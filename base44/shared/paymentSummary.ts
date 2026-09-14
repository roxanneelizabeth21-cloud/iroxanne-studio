// Integer-cent accounting, including invoices recorded before the payment ledger existed.
const cents = (n: unknown) => Math.max(0, Math.round((Number(n) || 0) * 100));
export function paymentSummary(invoice: any, payments: any[]) {
  if(invoice.square_schedule_enabled) {
    const total=cents(invoice.amount_total), deposit=cents(invoice.deposit_amount), balance=total-deposit;
    const depositPaid=cents(invoice.square_payment_snapshot?.[0]?.paid_amount);
    const balancePaid=(invoice.square_payment_snapshot || []).slice(1).reduce((n:any,p:any)=>n+cents(p.paid_amount),0);
    return {total:total/100,deposit:deposit/100,balance:balance/100,depositPaid:depositPaid/100,balancePaid:balancePaid/100,paid:(depositPaid+balancePaid)/100,outstanding:Math.max(0,total-depositPaid-balancePaid)/100,depositOutstanding:Math.max(0,deposit-depositPaid)/100,balanceOutstanding:Math.max(0,balance-balancePaid)/100,legacyDeposit:0,legacyBalance:0};
  }
  const total = cents(invoice.amount_total);
  const deposit = Math.min(total, cents(invoice.deposit_amount));
  const balance = total - deposit;
  const depositLedger = payments.filter(p => p.kind === 'deposit').reduce((n,p) => n + cents(p.amount), 0);
  const balanceLedger = payments.filter(p => p.kind !== 'deposit').reduce((n,p) => n + cents(p.amount), 0);
  const legacyDeposit = invoice.legacy_deposit_cents ?? Math.max(0, (invoice.deposit_status === 'paid' ? deposit : cents(invoice.deposit_paid_amount)) - depositLedger);
  const legacyBalance = invoice.legacy_balance_cents ?? Math.max(0, cents(invoice.balance_paid_amount) - balanceLedger);
  const depositPaid = legacyDeposit + depositLedger;
  const balancePaid = legacyBalance + balanceLedger;
  const waived = (invoice.deposit_status === 'waived' ? deposit : 0) + (invoice.balance_status === 'waived' ? balance : 0);
  return { total: total/100, deposit: deposit/100, balance: balance/100, depositPaid: depositPaid/100, balancePaid: balancePaid/100,
    depositOutstanding: invoice.deposit_status === 'waived' ? 0 : Math.max(0,deposit-depositPaid)/100,
    balanceOutstanding: invoice.balance_status === 'waived' ? 0 : Math.max(0,balance-balancePaid)/100,
    paid: (depositPaid+balancePaid)/100, outstanding: Math.max(0,total-waived-depositPaid-balancePaid)/100,
    legacyDeposit, legacyBalance };
}
