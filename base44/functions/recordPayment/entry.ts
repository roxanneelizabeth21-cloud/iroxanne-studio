import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/marketingAdmin.ts';
import { applyInvoicePayment, PaymentError } from '../../shared/invoicePayments.ts';
import { esc, brandedEmail, detailRows } from '../../shared/emailBrand.ts';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// Admin-only: record money already received offline — Zelle, CashApp, Square,
// cash, transfer. The ledger write, guards, milestone marking and recompute all
// live in applyInvoicePayment, shared with the Stripe webhook, so both paths
// can't drift apart.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const b = await req.json();
    const {
      invoice_id, kind, method = 'other', reference = '', notes = '',
      request_id, milestone_index, paid_at,
    } = b;

    const result = await applyInvoicePayment(base44, {
      invoice_id,
      amount: Number(b.amount),
      kind,
      method,
      reference,
      notes,
      request_id,
      paid_at,
      milestoneIndex: milestone_index == null || milestone_index === '' ? null : Number(milestone_index),
      // Offline entry is hand-typed, so hold it to the outstanding amount.
      enforceOutstanding: true,
    });

    const { payment, invoice, summary, duplicate } = result;

    // Receipt — opt-in, and never re-sent on a duplicate submit.
    let receiptSent = false;
    if (!duplicate && b.notify_client === true && invoice.client_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: invoice.client_email,
        subject: `Payment received — ${invoice.project_title}`,
        html: brandedEmail({
          title: 'Thank you for your payment',
          content:
            `<p style="margin:0 0 16px;">Payment received for <strong>${esc(invoice.project_title)}</strong>.</p>` +
            detailRows([
              ['Payment', money(payment.amount)],
              ['Method', esc(method)],
              ['Paid to date', money(summary.paid)],
              ['Remaining', money(summary.outstanding)],
            ]) +
            (summary.outstanding > 0
              ? `<p style="margin:16px 0 0;font-size:13px;">Your remaining balance is due per your agreed schedule.</p>`
              : `<p style="margin:16px 0 0;font-size:13px;">Your project is fully paid — thank you!</p>`),
          footerNote: 'iRoxanne Studio — one builder, not an agency. This email is your receipt.',
        }),
      }).then(() => { receiptSent = true; }).catch(() => { receiptSent = false; });
    }

    return Response.json({
      payment,
      invoice,
      paid_total: summary.paid,
      outstanding: summary.outstanding,
      receipt_sent: receiptSent,
      duplicate,
    });
  } catch (e) {
    const status = e instanceof PaymentError ? e.status : 500;
    return Response.json({ error: (e as Error).message }, { status });
  }
}
