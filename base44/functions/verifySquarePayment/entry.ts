import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { applyInvoicePayment } from '../../shared/invoicePayments.ts';
import { paymentSummary } from '../../shared/paymentSummary.ts';
import { esc, brandedEmail, detailRows } from '../../shared/emailBrand.ts';

// Redirect-based payment verification for Square Checkout.
//
// After the client completes (or cancels) a Square Online Checkout, Square
// redirects them back to the invoice page with query params:
//   status=COMPLETED, order_id=xxx, transaction_id=xxx
//
// The frontend calls this function with the transaction_id (or order_id) plus
// the invoice id and access token. We retrieve the payment from Square,
// confirm it's COMPLETED, and record it in the payment ledger — replacing
// the Stripe webhook approach with a redirect-based flow.
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { id, token, transaction_id, order_id } = body || {};

    if (!id || !token) return Response.json({ error: 'Missing invoice id or token' }, { status: 400 });
    if (!transaction_id && !order_id) return Response.json({ error: 'Missing transaction or order id' }, { status: 400 });

    // Validate the invoice token before doing anything else.
    let invoice: any;
    try {
      invoice = await base44.asServiceRole.entities.Invoice.get(id);
    } catch {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (invoice.access_token !== token) return Response.json({ error: 'Invalid or expired link' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('square');
    if (!accessToken) return Response.json({ error: 'Square payments are not configured' }, { status: 503 });

    // Retrieve the payment from Square. Use transaction_id directly if we have it;
    // otherwise list payments for the order_id.
    let payment: any = null;
    if (transaction_id) {
      const resp = await fetch(`https://connect.squareup.com/v2/payments/${transaction_id}`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Square-Version': '2025-08-21' },
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.log('square payment lookup failed', JSON.stringify(data?.errors?.[0]));
        return Response.json({ error: 'Could not retrieve payment from Square' }, { status: 502 });
      }
      payment = data.payment;
    } else if (order_id) {
      const resp = await fetch(`https://connect.squareup.com/v2/payments?order_id=${encodeURIComponent(order_id)}`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Square-Version': '2025-08-21' },
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.log('square payment list failed', JSON.stringify(data?.errors?.[0]));
        return Response.json({ error: 'Could not retrieve payment from Square' }, { status: 502 });
      }
      // Pick the first completed payment.
      payment = (data.payments || []).find((p: any) => p.status === 'COMPLETED') || (data.payments || [])[0];
    }

    if (!payment) return Response.json({ error: 'No payment found for this checkout' }, { status: 404 });
    if (payment.status !== 'COMPLETED') {
      return Response.json({ error: `Payment is ${payment.status}, not completed` }, { status: 409 });
    }

    const amount = Number(payment.amount_money?.amount || 0) / 100;
    if (amount <= 0) return Response.json({ error: 'Payment amount is zero' }, { status: 400 });

    // Parse the kind and milestone index from the payment note we set at checkout.
    // Format: "invoice:{id}|kind:{kind}|mi:{index}"
    const note = String(payment.note || '');
    let kind: string | null = null;
    let milestoneIndex: number | null = null;
    for (const part of note.split('|')) {
      const [k, v] = part.split(':');
      if (k === 'kind' && v) kind = v;
      if (k === 'mi' && v != null && v !== '') milestoneIndex = Number(v);
    }
    // Fall back to the invoice's outstanding amounts if the note wasn't parsed.
    if (!kind) {
      const payments = await base44.asServiceRole.entities.Payment.filter({ invoice_id: id }, '-created_date', 1000);
      const summary = paymentSummary(invoice, payments);
      if (summary.depositOutstanding > 0 && Math.abs(amount - summary.depositOutstanding) < 0.01) kind = 'deposit';
      else if (summary.balanceOutstanding > 0) kind = 'balance';
      else kind = 'other';
    }

    const reference = payment.id || transaction_id || order_id;
    const result = await applyInvoicePayment(base44, {
      invoice_id: id,
      amount,
      kind,
      method: 'square',
      reference,
      request_id: `square_${reference}`,
      milestoneIndex,
      source: 'square_checkout',
      enforceOutstanding: false,
    }).catch((e) => {
      console.log('applyInvoicePayment (square) failed', (e as Error)?.message);
      return { error: (e as Error).message };
    });

    if (result && result.error) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    // Send a receipt email to the client (unless this was a duplicate).
    if (result && !result.duplicate && result.invoice) {
      const inv = result.invoice;
      if (inv.client_email) {
        const summary = result.summary;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: inv.client_email,
          subject: `Payment received — ${inv.project_title}`,
          html: brandedEmail({
            title: 'Thank you for your payment',
            content:
              `<p style="margin:0 0 16px;">Payment received for <strong>${esc(inv.project_title)}</strong>.</p>` +
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
        }).catch((e) => console.log('square receipt email failed', (e as Error)?.message));
      }
    }

    return Response.json({
      success: true,
      duplicate: !!result?.duplicate,
      amount,
      kind,
      summary: result?.summary || null,
    });
  } catch (error) {
    console.log('verifySquarePayment error', (error as Error)?.message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}