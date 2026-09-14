import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { applyInvoicePayment } from '../../shared/invoicePayments.ts';
import { esc, brandedEmail, detailRows } from '../../shared/emailBrand.ts';

// Stripe webhook. Verifies the signature with Web Crypto (HMAC-SHA256), then
// syncs the payment to the invoice via applyInvoicePayment — the same writer
// the offline admin path uses.
//
// Why this is more than "session completed = paid":
// Affirm and Afterpay are delayed-notification methods. For those,
// checkout.session.completed fires with payment_status 'unpaid' while the
// financing provider is still deciding. Crediting on that event would mark an
// invoice paid for a loan that may yet be declined. Money is credited only on
// payment_status 'paid', or on checkout.session.async_payment_succeeded.
//
// Every outcome is written to the StripeCheckout binding record so declines,
// abandonment and expiry are visible to the admin rather than silent.
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

async function verifySignature(rawBody: string, sigHeader: string | null, secret: string) {
  if (!sigHeader) return null;
  const parts = sigHeader.split(',');
  const tsPart = parts.find((p) => p.startsWith('t='));
  const v1Part = parts.find((p) => p.startsWith('v1='));
  if (!tsPart || !v1Part) return null;
  const timestamp = tsPart.split('=')[1];
  const supplied = v1Part.split('=')[1];
  const signedPayload = `${timestamp}.${rawBody}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
  const computed = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (computed !== supplied) return null;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return null;
  return JSON.parse(rawBody);
}

// Find the binding record this event belongs to. Returns null when the session
// was not created by us.
async function findBinding(base44: any, sessionId: string | null, paymentIntent: string | null) {
  const db = base44.asServiceRole.entities;
  if (sessionId) {
    const bySession = await db.StripeCheckout.filter({ session_id: sessionId }, '-created_date', 5).catch(() => []);
    if (bySession?.length) return bySession[0];
  }
  if (paymentIntent) {
    const byPi = await db.StripeCheckout.filter({ payment_intent: paymentIntent }, '-created_date', 5).catch(() => []);
    if (byPi?.length) return byPi[0];
  }
  return null;
}

async function markBinding(base44: any, binding: any, changes: Record<string, unknown>) {
  if (!binding?.id) return;
  await base44.asServiceRole.entities.StripeCheckout.update(binding.id, {
    ...changes,
    last_checked_at: new Date().toISOString(),
  }).catch((e: any) => console.log('StripeCheckout update failed', e?.message));
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const secret = secrets.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });

    const rawBody = await req.text();
    const event = await verifySignature(rawBody, req.headers.get('stripe-signature'), secret);
    if (!event) return Response.json({ error: 'Invalid signature' }, { status: 400 });

    const type = event.type;
    const obj = event.data?.object || {};

    const sessionId = type.startsWith('checkout.session.') ? obj.id || null : null;
    const paymentIntent = typeof obj.payment_intent === 'string'
      ? obj.payment_intent
      : type.startsWith('payment_intent.') ? obj.id || null : null;
    const binding = await findBinding(base44, sessionId, paymentIntent);

    // Keep the PaymentIntent on the binding as soon as Stripe assigns one, so
    // later intent-only events can still be matched back to this invoice.
    if (binding && paymentIntent && !binding.payment_intent) {
      await markBinding(base44, binding, { payment_intent: paymentIntent });
    }

    const methodType =
      obj.payment_method_types?.[0] ||
      obj.payment_method_options && Object.keys(obj.payment_method_options)[0] ||
      '';

    // ---- Terminal non-payment outcomes ------------------------------------
    // Recorded, never credited. Returning 200 stops Stripe retrying a decision
    // that is already final.
    if (type === 'checkout.session.expired') {
      await markBinding(base44, binding, { status: 'expired', last_error: 'Checkout expired before payment was completed' });
      return Response.json({ received: true, outcome: 'expired' });
    }
    if (type === 'checkout.session.async_payment_failed' || type === 'payment_intent.payment_failed') {
      const reason = obj.last_payment_error?.message
        || 'Financing or payment was declined by the provider';
      await markBinding(base44, binding, { status: 'failed', last_error: String(reason).slice(0, 500), payment_method_type: methodType });
      return Response.json({ received: true, outcome: 'failed' });
    }

    // ---- Payment events ---------------------------------------------------
    let invoiceId: string | null = null;
    let kind: string | null = null;
    let milestoneIndex: number | null = null;
    let amount: number | null = null;
    let reference: string | null = null;

    if (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') {
      // For BNPL, `completed` can arrive unpaid while the provider decides.
      // Record that we're waiting and credit nothing yet.
      if (obj.payment_status !== 'paid') {
        await markBinding(base44, binding, {
          status: 'processing',
          payment_method_type: methodType,
          last_error: '',
        });
        return Response.json({ received: true, outcome: 'awaiting_financing', payment_status: obj.payment_status || null });
      }
      invoiceId = obj.metadata?.invoice_id || obj.client_reference_id || null;
      kind = obj.metadata?.kind || null;
      milestoneIndex = obj.metadata?.milestone_index != null && obj.metadata.milestone_index !== '' ? Number(obj.metadata.milestone_index) : null;
      amount = obj.amount_total != null ? obj.amount_total / 100 : null;
      reference = obj.payment_intent || obj.id || null;
    } else if (type === 'payment_intent.succeeded') {
      invoiceId = obj.metadata?.invoice_id || null;
      kind = obj.metadata?.kind || null;
      milestoneIndex = obj.metadata?.milestone_index != null && obj.metadata.milestone_index !== '' ? Number(obj.metadata.milestone_index) : null;
      amount = obj.amount_received != null ? obj.amount_received / 100 : null;
      reference = obj.id || null;
    } else {
      return Response.json({ received: true, ignored: type });
    }

    // Fall back to the binding record when Stripe's metadata is missing.
    if (binding) {
      invoiceId = invoiceId || binding.invoice_id;
      kind = kind || binding.kind;
      if (milestoneIndex == null && binding.milestone_index != null) milestoneIndex = binding.milestone_index;
    }

    if (!invoiceId || !kind || !reference || amount == null) {
      console.log('stripe webhook missing metadata', { type, invoiceId, kind, reference });
      return Response.json({ received: true, ignored: 'missing metadata' });
    }

    // Amount must match what the session was created for. Protects against a
    // replayed or tampered event crediting a different sum.
    if (binding && Math.abs(Math.round(amount * 100) - Number(binding.expected_amount_cents)) > 0) {
      await markBinding(base44, binding, {
        status: 'failed',
        last_error: `Amount mismatch: charged ${Math.round(amount * 100)}c, expected ${binding.expected_amount_cents}c`,
      });
      console.log('stripe amount mismatch', { invoiceId, amount, expected: binding.expected_amount_cents });
      return Response.json({ received: true, error: 'amount mismatch, not credited' });
    }

    const result: any = await applyInvoicePayment(base44, {
      invoice_id: invoiceId,
      amount,
      kind,
      method: 'stripe',
      reference,
      request_id: `stripe_${reference}`,
      milestoneIndex: milestoneIndex ?? null,
      source: `${type}${methodType ? ` / ${methodType}` : ''}`,
      // Stripe amounts are server-computed in createStripeCheckout and checked
      // against the binding above, so a legitimate overpayment must not be dropped.
      enforceOutstanding: false,
    }).catch((e: any) => ({ error: (e as Error).message, status: e?.status }));

    if (result && result.error) {
      await markBinding(base44, binding, { status: 'failed', last_error: String(result.error).slice(0, 500) });
      console.log('applyInvoicePayment failed', result.error);
      // 404 means the invoice no longer exists — a permanent condition. Return
      // 200 so Stripe stops retrying an event that can never succeed; anything
      // else may be transient, so let Stripe retry.
      const permanent = result.status === 404 || result.status === 409;
      return Response.json({ received: true, error: result.error }, { status: permanent ? 200 : 500 });
    }

    await markBinding(base44, binding, {
      status: 'paid',
      payment_method_type: methodType,
      payment_intent: typeof reference === 'string' && reference.startsWith('pi_') ? reference : binding?.payment_intent || '',
      last_error: '',
    });

    if (result && !result.duplicate && result.invoice) {
      const invoice = result.invoice;
      if (invoice.client_email) {
        const summary = result.summary;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: invoice.client_email,
          subject: `Payment received — ${invoice.project_title}`,
          html: brandedEmail({
            title: 'Thank you for your payment',
            content:
              `<p style="margin:0 0 16px;">Payment received for <strong>${esc(invoice.project_title)}</strong>.</p>` +
              detailRows([
                ['Payment', money(amount)],
                ['Paid to date', summary ? money(summary.paid) : ''],
                ['Remaining', summary ? money(summary.outstanding) : ''],
              ]) +
              (summary && summary.outstanding > 0
                ? `<p style="margin:16px 0 0;font-size:13px;">Your remaining balance is due per your agreed schedule.</p>`
                : `<p style="margin:16px 0 0;font-size:13px;">Your project is fully paid — thank you!</p>`),
            footerNote: 'iRoxanne Studio — one builder, not an agency.',
          }),
        }).catch((e) => console.log('receipt email failed', (e as Error)?.message));
      }
    }

    return Response.json({ received: true, processed: true, duplicate: !!result?.duplicate });
  } catch (error) {
    console.log('stripe webhook error', (error as Error)?.message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
