// The single writer for money against an invoice.
//
// Both payment paths go through here — the Stripe webhook and the admin's
// manual "record payment" — so the ledger entry, the overpayment guard, the
// milestone marking, the deposit/balance recompute and the contract roll-forward
// exist in exactly one place. This logic used to be duplicated in
// recordPayment/entry.ts and had already drifted: the manual path couldn't mark
// a milestone paid or backfill contract.deposit_paid_at, and the Stripe path
// had no overpayment guard.
//
// Idempotent by request_id. Callers supply it: `stripe_<payment_intent>` for
// webhooks, a client-generated UUID for admin entry.
import { paymentSummary } from './paymentSummary.ts';

export const PAYMENT_KINDS = ['deposit', 'balance', 'milestone', 'other', 'project'] as const;
export const PAYMENT_METHODS = [
  'stripe', 'square', 'zelle', 'cashapp', 'venmo', 'paypal', 'cash', 'check', 'transfer', 'other',
] as const;

/** Error carrying the HTTP status a caller should return. */
export class PaymentError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type ApplyPaymentOpts = {
  invoice_id: string;
  amount: number;
  kind: string;
  method?: string;
  reference?: string;
  request_id: string;
  notes?: string;
  paid_at?: string;
  milestoneIndex?: number | null;
  source?: string;
  /** Reject an amount larger than what's outstanding for this stage. */
  enforceOutstanding?: boolean;
};

export async function applyInvoicePayment(base44: any, opts: ApplyPaymentOpts) {
  const db = base44.asServiceRole.entities;
  const { invoice_id, request_id, reference = '', source } = opts;
  const kind = opts.kind;
  const method = opts.method || 'other';
  const amount = Math.round(Number(opts.amount) * 100) / 100;
  const milestoneIndex = opts.milestoneIndex ?? null;

  if (!invoice_id) throw new PaymentError('Invoice is required.', 400);
  if (!request_id || typeof request_id !== 'string') throw new PaymentError('Request ID is required.', 400);
  if (!Number.isFinite(amount) || amount <= 0) throw new PaymentError('Enter a positive payment amount.', 400);
  if (!PAYMENT_KINDS.includes(kind as any)) throw new PaymentError('Invalid payment type.', 400);
  if (!PAYMENT_METHODS.includes(method as any)) throw new PaymentError('Invalid payment method.', 400);

  const paidAtDate = opts.paid_at ? new Date(opts.paid_at) : new Date();
  if (Number.isNaN(paidAtDate.getTime())) throw new PaymentError('Invalid payment date.', 400);
  const paidAt = paidAtDate.toISOString();

  const invoice = await db.Invoice.get(invoice_id);
  if (!invoice) throw new PaymentError('Invoice not found.', 404);
  if (invoice.square_schedule_enabled || invoice.payment_installments?.length) throw new PaymentError('Record payments for this plan in Square Invoices. The app syncs them automatically.',409);
  if (invoice.status === 'cancelled') throw new PaymentError('This invoice is cancelled.', 409);

  // --- Idempotency -----------------------------------------------------------
  let payments = await db.Payment.filter({ invoice_id }, '-created_date', 1000);
  const existing = payments.find((p: any) => p.request_id === request_id);
  if (existing) {
    const sameDetails =
      Math.round(Number(existing.amount) * 100) === Math.round(amount * 100) &&
      existing.kind === kind &&
      existing.method === method &&
      (kind !== 'milestone' || existing.milestone_index === milestoneIndex);
    if (!sameDetails) {
      throw new PaymentError(
        'This request was already recorded with different details. Refresh the invoice before entering another payment.',
        409
      );
    }
    return reconcilePayment(db, invoice, payments, existing, true);
  }

  // --- Milestone validation --------------------------------------------------
  const milestones = Array.isArray(invoice.milestones) ? invoice.milestones : [];
  if (kind === 'milestone') {
    if (milestoneIndex == null || !milestones[milestoneIndex]) {
      throw new PaymentError('Milestone not found on this invoice.', 404);
    }
    const m = milestones[milestoneIndex];
    if (m.status === 'paid') throw new PaymentError('That milestone is already paid.', 409);
    const paid=payments.filter(p=>p.kind==='milestone'&&p.milestone_index===milestoneIndex).reduce((sum,p)=>sum+Number(p.amount||0),0);
    if (opts.enforceOutstanding && amount > Number(m.amount) - paid + 0.001) {
      throw new PaymentError('Amount exceeds this milestone.', 400);
    }
  }

  const before = paymentSummary(invoice, payments);

  // --- Overpayment guard -----------------------------------------------------
  // Milestones draw down the balance, so they're checked against it too.
  if (opts.enforceOutstanding) {
    const cap = kind === 'project' ? before.outstanding : kind === 'deposit' ? before.depositOutstanding : before.balanceOutstanding;
    if (amount > cap + 0.001) {
      throw new PaymentError('Amount exceeds the unpaid amount for this payment stage.', 400);
    }
  }

  // Persist a baseline before the first ledger entry so payments recorded
  // before the ledger existed are retained across retries.
  const baseline = {
    legacy_deposit_cents: before.legacyDeposit,
    legacy_balance_cents: before.legacyBalance,
  };
  await db.Invoice.update(invoice_id, baseline);

  // --- Write the ledger entry ------------------------------------------------
  const payment = await db.Payment.create({
    invoice_id,
    contract_id: invoice.contract_id || '',
    client_name: invoice.client_name || '',
    client_email: invoice.client_email,
    project_title: invoice.project_title,
    amount,
    kind,
    method,
    request_id,
    reference: String(reference).slice(0, 300),
    notes: String(opts.notes || (source ? `Stripe checkout (${source})` : '')).slice(0, 1000),
    paid_at: paidAt,
    ...(kind === 'milestone' ? {milestone_index:milestoneIndex} : {}),
  });

  payments = await db.Payment.filter({ invoice_id }, '-created_date', 1000);
  return reconcilePayment(db, {...invoice,...baseline}, payments, payment, false);
}

async function reconcilePayment(db, invoice, payments, payment, duplicate) {
  const invoice_id=invoice.id, kind=payment.kind, method=payment.method, reference=payment.reference;
  const paidAt=payment.paid_at || new Date().toISOString();
  const summary=paymentSummary(invoice,payments);
  const milestones=(invoice.milestones||[]).map((m,index)=>{
    const paid=payments.filter(p=>p.kind==='milestone'&&p.milestone_index===index).reduce((sum,p)=>sum+Math.round(Number(p.amount||0)*100),0);
    return paid>=Math.round(Number(m.amount)*100)&&paid>0?{...m,status:'paid'}:m;
  });
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
    milestones,
    deposit_status: depositStatus,
    deposit_paid_amount: summary.depositPaid,
    deposit_paid_at: depositStatus === 'paid' ? invoice.deposit_paid_at || paidAt : invoice.deposit_paid_at,
    deposit_method: kind === 'deposit' ? method : invoice.deposit_method,
    balance_amount: summary.balance,
    balance_paid_amount: summary.balancePaid,
    balance_status: balanceStatus,
    status: summary.outstanding === 0 ? 'paid' : ['paid', 'waived'].includes(depositStatus) ? 'deposit_paid' : 'open',
  });

  // --- Roll the contract forward --------------------------------------------
  // Applies to every method, not just Stripe — an offline deposit has to
  // activate the project and stamp deposit_paid_at the same way.
  if (invoice.contract_id && ['paid', 'waived'].includes(depositStatus)) {
    try {
      const contract = await db.Contract.get(invoice.contract_id);
      if (contract) {
        const changes: Record<string, unknown> = {};
        if (['signed', 'deposit_paid'].includes(contract.status)) changes.status = 'active';
        if (!contract.deposit_paid_at && depositStatus === 'paid') changes.deposit_paid_at = paidAt;
        if (method === 'stripe' && reference && !contract.stripe_payment_intent) {
          changes.stripe_payment_intent = reference;
        }
        if (Object.keys(changes).length > 0) await db.Contract.update(contract.id, changes);
      }
    } catch (e) {
      throw new Error('Payment saved, but project status needs updating. Retry the same payment to complete the update without recording it twice.');
    }
  }

  return { duplicate, payment, invoice: updated, summary };
}
