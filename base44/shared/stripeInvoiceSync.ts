// Shared Stripe -> Invoice sync logic used by the Stripe webhook (and reusable
// by other payment paths). Records a Payment ledger entry, recomputes the
// invoice deposit/balance/milestone + overall status, and activates the
// contract once the deposit is settled. Idempotent by request_id.
import { paymentSummary } from './paymentSummary.ts';

const cents = (n: unknown) => Math.round((Number(n) || 0) * 100);

export async function applyInvoicePayment(
  base44: any,
  opts: { invoice_id: string; amount: number; kind: string; reference: string; milestoneIndex?: number; source?: string }
) {
  const db = base44.asServiceRole.entities;
  const { invoice_id, kind, reference } = opts;
  const amount = Math.round(Number(opts.amount) * 100) / 100;
  const milestoneIndex = opts.milestoneIndex ?? null;
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid payment amount');
  if (!['deposit', 'balance', 'milestone', 'other'].includes(kind)) throw new Error('Invalid payment kind');

  const invoice = await db.Invoice.get(invoice_id);
  if (invoice.status === 'cancelled') throw new Error('Invoice is cancelled');

  const request_id = `stripe_${reference}`;
  let payments = await db.Payment.filter({ invoice_id }, '-created_date', 1000);
  const existing = payments.find((p: any) => p.request_id === request_id);
  if (existing) return { duplicate: true, payment: existing, invoice };

  const before = paymentSummary(invoice, payments);
  await db.Invoice.update(invoice_id, {
    legacy_deposit_cents: before.legacyDeposit,
    legacy_balance_cents: before.legacyBalance,
  }).catch(() => {});

  const paidAt = new Date().toISOString();
  const payment = await db.Payment.create({
    invoice_id,
    contract_id: invoice.contract_id || '',
    client_name: invoice.client_name || '',
    client_email: invoice.client_email,
    project_title: invoice.project_title,
    amount,
    kind,
    method: 'stripe',
    request_id,
    reference: String(reference).slice(0, 300),
    notes: opts.source ? `Stripe checkout (${opts.source})` : 'Stripe checkout payment',
    paid_at: paidAt,
  });

  // Mark the specific milestone paid when this payment targets one.
  if (kind === 'milestone' && milestoneIndex != null && Array.isArray(invoice.milestones) && invoice.milestones[milestoneIndex]) {
    const milestones = invoice.milestones.map((m: any, i: number) => (i === milestoneIndex ? { ...m, status: 'paid' } : m));
    await db.Invoice.update(invoice_id, { milestones }).catch(() => {});
  }

  payments = await db.Payment.filter({ invoice_id }, '-created_date', 1000);
  const summary = paymentSummary(
    { ...invoice, legacy_deposit_cents: before.legacyDeposit, legacy_balance_cents: before.legacyBalance },
    payments
  );
  const depositStatus =
    invoice.deposit_status === 'waived' || summary.deposit === 0
      ? 'waived'
      : summary.depositOutstanding === 0
        ? 'paid'
        : 'pending';
  const balanceStatus =
    invoice.balance_status === 'waived' || summary.balance === 0
      ? 'waived'
      : summary.balanceOutstanding === 0
        ? 'paid'
        : summary.balancePaid > 0
          ? 'partial'
          : 'pending';

  const updated = await db.Invoice.update(invoice_id, {
    deposit_status: depositStatus,
    deposit_paid_amount: summary.depositPaid,
    deposit_paid_at: depositStatus === 'paid' ? invoice.deposit_paid_at || paidAt : invoice.deposit_paid_at,
    deposit_method: kind === 'deposit' ? 'stripe' : invoice.deposit_method,
    balance_amount: summary.balance,
    balance_paid_amount: summary.balancePaid,
    balance_status: balanceStatus,
    status: summary.outstanding === 0 ? 'paid' : ['paid', 'waived'].includes(depositStatus) ? 'deposit_paid' : 'open',
  });

  // Activate the contract once the deposit is settled.
  if (invoice.contract_id && ['paid', 'waived'].includes(depositStatus)) {
    try {
      const contract = await db.Contract.get(invoice.contract_id);
      if (['signed', 'deposit_paid'].includes(contract.status)) {
        await db.Contract.update(contract.id, {
          status: 'active',
          stripe_payment_intent: reference,
          deposit_paid_at: depositStatus === 'paid' ? paidAt : contract.deposit_paid_at,
        });
      }
    } catch (e) {
      console.log('contract activation failed', (e as Error)?.message);
    }
  }

  return { duplicate: false, payment, invoice: updated, summary };
}