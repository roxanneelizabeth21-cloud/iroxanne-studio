import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/marketingAdmin.ts';
import { esc, brandedEmail, detailRows } from '../../shared/emailBrand.ts';

const money = (n: unknown) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

// Admin-only: record a payment received (online or offline), then recompute the
// invoice's deposit/balance state and roll the contract status forward. One
// entry point so the money math lives in exactly one place.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const {
      invoice_id,
      amount,
      kind = 'balance',
      method = 'other',
      reference = '',
      notes = '',
      paid_at,
      notify_client = true,
    } = await req.json();

    if (!invoice_id) return Response.json({ error: 'invoice_id is required' }, { status: 400 });
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return Response.json({ error: 'A payment amount greater than zero is required' }, { status: 400 });

    let invoice;
    try {
      invoice = await base44.entities.Invoice.get(invoice_id);
    } catch {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const when = paid_at || new Date().toISOString();

    const payment = await base44.entities.Payment.create({
      invoice_id,
      contract_id: invoice.contract_id || '',
      client_name: invoice.client_name || '',
      client_email: invoice.client_email || '',
      project_title: invoice.project_title || '',
      amount: amt,
      kind,
      method,
      reference,
      notes,
      paid_at: when,
    });

    // Recompute from the full payment ledger so the numbers survive edits and
    // out-of-order entry rather than being incremented blind.
    const payments = (await base44.entities.Payment.filter({ invoice_id })) || [];
    const total = typeof invoice.amount_total === 'number' ? invoice.amount_total : 0;
    const depositDue = typeof invoice.deposit_amount === 'number' ? invoice.deposit_amount : 0;
    const balanceDue = Math.max(total - depositDue, 0);

    const sum = (k: string) => payments
      .filter((p: any) => p.kind === k)
      .reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);

    const depositPaidAmt = sum('deposit');
    const nonDepositPaidAmt = payments
      .filter((p: any) => p.kind !== 'deposit')
      .reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
    const paidTotal = payments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);

    const depositStatus = invoice.deposit_status === 'waived'
      ? 'waived'
      : depositPaidAmt >= depositDue && depositDue > 0
        ? 'paid'
        : depositPaidAmt > 0
          ? 'pending'
          : invoice.deposit_status || 'pending';

    const balanceStatus = invoice.balance_status === 'waived'
      ? 'waived'
      : balanceDue <= 0
        ? 'waived'
        : nonDepositPaidAmt >= balanceDue
          ? 'paid'
          : nonDepositPaidAmt > 0
            ? 'partial'
            : 'pending';

    const settled = paidTotal >= total && total > 0;
    const invoiceStatus = settled
      ? 'paid'
      : depositStatus === 'paid' || depositStatus === 'waived'
        ? 'deposit_paid'
        : invoice.status === 'draft' ? 'open' : invoice.status || 'open';

    const firstDeposit = payments
      .filter((p: any) => p.kind === 'deposit')
      .sort((a: any, b: any) => String(a.paid_at).localeCompare(String(b.paid_at)))[0];

    const updatedInvoice = await base44.entities.Invoice.update(invoice_id, {
      deposit_status: depositStatus,
      deposit_paid_at: depositStatus === 'paid' ? (firstDeposit?.paid_at || when) : invoice.deposit_paid_at,
      deposit_method: depositStatus === 'paid' ? (firstDeposit?.method || method) : invoice.deposit_method,
      balance_amount: balanceDue,
      balance_paid_amount: Math.min(nonDepositPaidAmt, balanceDue),
      balance_status: balanceStatus,
      status: invoiceStatus,
    });

    // Payment and delivery are separate: paying never completes a project.
    if (invoice.contract_id) {
      const contract = await base44.entities.Contract.get(invoice.contract_id).catch(() => null);
      if (contract) {
        const changes: Record<string, unknown> = {};
        if ((depositStatus === 'paid' || depositStatus === 'waived') &&
          ['signed', 'deposit_paid'].includes(contract.status)) {
          changes.status = 'active';
        }
        if (depositStatus === 'paid' && !contract.deposit_paid_at) {
          changes.deposit_paid_at = firstDeposit?.paid_at || when;
        }
        if (Object.keys(changes).length > 0) {
          await base44.entities.Contract.update(invoice.contract_id, changes).catch(() => {});
        }
      }
    }

    // Receipt to the client.
    if (notify_client && invoice.client_email) {
      const firstName = (invoice.client_name || '').split(' ')[0] || 'there';
      const outstanding = Math.max(total - paidTotal, 0);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: invoice.client_email,
        subject: `Payment received — ${invoice.project_title}`,
        html: brandedEmail({
          title: `Thank you, ${esc(firstName)}!`,
          content: `<p style="margin:0 0 16px;">I've received your payment of <strong>${money(amt)}</strong> for <strong>${esc(invoice.project_title)}</strong>.</p>
            <div style="margin:20px 0;padding:16px;background:#FAF7F0;border-radius:10px;">${detailRows([
              ['Payment received', money(amt)],
              ['Method', esc(method)],
              ['Project total', money(total)],
              ['Paid to date', money(paidTotal)],
              ['Remaining', money(outstanding)],
            ] as [string, string][])}</div>
            ${outstanding <= 0
              ? `<p style="margin:0;">You're fully paid up — thank you for trusting me with this build.</p>`
              : `<p style="margin:0;color:#8B7B95;font-size:13px;">Remaining balance of ${money(outstanding)} is due per your agreed schedule.</p>`}`,
          footerNote: 'iRoxanne Studio — one builder, not an agency. This email is your receipt.',
        }),
      }).catch((e) => console.log('receipt email failed', (e as Error)?.message));
    }

    return Response.json({ payment, invoice: updatedInvoice, paid_total: paidTotal, outstanding: Math.max(total - paidTotal, 0) });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
