import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { applyInvoicePayment } from '../../shared/invoicePayments.ts';
import { assertSquareBinding } from '../../shared/squareBinding.ts';
import { brandedEmail, esc } from '../../shared/emailBrand.ts';

// Token-verified (no login). When a client returns from Square with
// status=COMPLETED, this function queries the Square API directly and
// records the payment immediately — instead of waiting up to 5 minutes
// for the background reconciler to pick it up.
export default async function(req: Request) {
  try {
    const b = createClientFromRequest(req);
    const { id, token, order_id, transaction_id } = await req.json();
    if (!id || !token) return Response.json({ error: 'Missing invoice link' }, { status: 400 });

    const invoice = await b.asServiceRole.entities.Invoice.get(id);
    if (invoice.access_token !== token) return Response.json({ error: 'Invalid link' }, { status: 403 });

    const rows = await b.asServiceRole.entities.SquareCheckout.filter({ invoice_id: id }, '-created_date', 100);
    const match = rows.find((r: any) =>
      order_id ? r.order_id === order_id
      : transaction_id ? r.payment_id === transaction_id
      : r.status === 'recorded'
    );

    if (order_id && !match) return Response.json({ error: 'Checkout does not belong to this invoice' }, { status: 403 });

    // Already recorded by the background reconciler — nothing to do.
    if (match?.status === 'recorded') return Response.json({ success: true, pending: false });

    // No matching checkout to verify.
    if (!match) return Response.json({ success: false, pending: true });

    // Try to verify and record the payment right now.
    const { accessToken } = await b.asServiceRole.connectors.getConnection('square');
    if (!accessToken) return Response.json({ success: false, pending: true });

    const get = async (path: string) => {
      const r = await fetch('https://connect.squareup.com/v2/' + path, {
        headers: { Authorization: 'Bearer ' + accessToken, 'Square-Version': '2025-08-21' },
      });
      if (!r.ok) throw new Error('Square lookup failed: ' + r.status);
      return r.json();
    };

    try {
      await b.asServiceRole.entities.SquareCheckout.update(match.id, { last_checked_at: new Date().toISOString() });

      const { order } = await get('orders/' + encodeURIComponent(match.order_id));
      if (order?.id !== match.order_id || order.location_id !== match.location_id) {
        return Response.json({ success: false, pending: true });
      }

      const tenders = order.tenders || [];
      if (!tenders.length) return Response.json({ success: false, pending: true });
      if (tenders.length !== 1 || !tenders[0].payment_id) {
        return Response.json({ success: false, pending: true });
      }

      const { payment } = await get('payments/' + encodeURIComponent(tenders[0].payment_id));
      if (payment?.status !== 'COMPLETED') return Response.json({ success: false, pending: true });

      assertSquareBinding(match, payment);

      const prior = await b.asServiceRole.entities.Payment.filter({ request_id: 'square_' + payment.id }, '-created_date', 10);
      if (prior.some((p: any) => p.invoice_id !== match.invoice_id)) {
        throw new Error('Payment already belongs to another invoice');
      }

      await applyInvoicePayment(b, {
        invoice_id: match.invoice_id,
        amount: match.expected_amount_cents / 100,
        kind: match.kind,
        method: 'square',
        reference: payment.id,
        request_id: 'square_' + payment.id,
        milestoneIndex: match.milestone_index ?? null,
        source: 'square_verify',
        enforceOutstanding: true,
      });

      await b.asServiceRole.entities.SquareCheckout.update(match.id, { status: 'recorded', payment_id: payment.id, last_error: '' });

      // Send receipt email (non-blocking).
      if (invoice.client_email) {
        try {
          await b.asServiceRole.integrations.Core.SendEmail({
            to: invoice.client_email,
            subject: 'Payment received — ' + invoice.project_title,
            html: brandedEmail({
              title: 'Thank you for your payment',
              content: '<p>We received your payment of $' + (match.expected_amount_cents / 100).toFixed(2) + ' for ' + esc(invoice.project_title) + '.</p>',
            }),
          });
        } catch { /* receipt email failure is non-blocking */ }
      }

      return Response.json({ success: true, pending: false });
    } catch (error) {
      console.log('verifySquarePayment lookup failed', (error as Error)?.message);
      await b.asServiceRole.entities.SquareCheckout.update(match.id, { last_error: String((error as Error).message).slice(0, 500) }).catch(() => {});
      return Response.json({ success: false, pending: true });
    }
  } catch {
    return Response.json({ error: 'Unable to check payment status' }, { status: 500 });
  }
}