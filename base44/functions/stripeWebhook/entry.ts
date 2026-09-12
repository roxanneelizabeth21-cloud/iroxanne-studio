import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { applyInvoicePayment } from '../../shared/stripeInvoiceSync.ts';
import { esc, brandedEmail, detailRows } from '../../shared/emailBrand.ts';

// Stripe webhook. Verifies the signature with Web Crypto (HMAC-SHA256), then
// syncs the completed payment to the invoice: records a Payment ledger entry,
// marks the targeted milestone paid, settles deposit/balance status, and
// activates the contract once the deposit is in.
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

export default async function (req: Request) {
  try {
    // base44 auth from request headers (platform requirement before processing).
    const base44 = createClientFromRequest(req);
    const secret = secrets.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });

    const rawBody = await req.text();
    const event = await verifySignature(rawBody, req.headers.get('stripe-signature'), secret);
    if (!event) return Response.json({ error: 'Invalid signature' }, { status: 400 });

    const type = event.type;
    const obj = event.data?.object || {};

    // checkout.session.completed is the reliable "paid" event for one-time
    // payment mode. payment_intent.succeeded is a backup for the same charge.
    let invoiceId: string | null = null;
    let kind: string | null = null;
    let milestoneIndex: number | null = null;
    let amount: number | null = null;
    let reference: string | null = null;

    if (type === 'checkout.session.completed') {
      invoiceId = obj.metadata?.invoice_id || obj.client_reference_id || null;
      kind = obj.metadata?.kind || null;
      milestoneIndex = obj.metadata?.milestone_index != null && obj.metadata.milestone_index !== '' ? Number(obj.metadata.milestone_index) : null;
      amount = obj.amount_total != null ? obj.amount_total / 100 : null;
      reference = obj.payment_intent || obj.id || null;
    } else if (type === 'payment_intent.succeeded') {
      // Fallback: read metadata off the payment intent if the session event was missed.
      invoiceId = obj.metadata?.invoice_id || null;
      kind = obj.metadata?.kind || null;
      milestoneIndex = obj.metadata?.milestone_index != null && obj.metadata.milestone_index !== '' ? Number(obj.metadata.milestone_index) : null;
      amount = obj.amount_received != null ? obj.amount_received / 100 : null;
      reference = obj.id || null;
    } else {
      return Response.json({ received: true, ignored: type });
    }

    if (!invoiceId || !kind || !reference || amount == null) {
      console.log('stripe webhook missing metadata', { type, invoiceId, kind, reference });
      return Response.json({ received: true, ignored: 'missing metadata' });
    }

    const result = await applyInvoicePayment(base44, {
      invoice_id: invoiceId,
      amount,
      kind,
      reference,
      milestoneIndex: milestoneIndex ?? undefined,
      source: type,
    }).catch((e) => {
      console.log('applyInvoicePayment failed', (e as Error)?.message);
      return { error: (e as Error).message };
    });

    if (result && result.error) {
      return Response.json({ received: true, error: result.error }, { status: 500 });
    }

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