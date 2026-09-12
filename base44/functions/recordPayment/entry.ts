import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/marketingAdmin.ts';
import { esc, brandedEmail, detailRows } from '../../shared/emailBrand.ts';
import { paymentSummary } from '../../shared/paymentSummary.ts';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;
    const b = await req.json();
    const { invoice_id, kind, method = 'other', reference = '', notes = '', request_id } = b;
    const amount = Math.round(Number(b.amount) * 100) / 100;
    if (!invoice_id || !request_id || typeof request_id !== 'string') return Response.json({error:'Invoice and request ID are required.'},{status:400});
    if (!Number.isFinite(amount) || amount <= 0) return Response.json({error:'Enter a positive payment amount.'},{status:400});
    if (!['deposit','balance','milestone','other'].includes(kind) || !['stripe','square','zelle','cashapp','venmo','paypal','cash','check','transfer','other'].includes(method)) return Response.json({error:'Invalid payment type or method.'},{status:400});
    const invoice = await base44.entities.Invoice.get(invoice_id);
    if (invoice.status === 'cancelled') return Response.json({error:'This invoice is cancelled.'},{status:409});
    let payments = await base44.entities.Payment.filter({invoice_id}, '-created_date', 1000);
    const existing = payments.find((p:any)=>p.request_id===request_id);
    if (existing && (Number(existing.amount)!==amount || existing.kind!==kind || existing.method!==method)) return Response.json({error:'This request was already recorded with different details. Refresh the invoice before entering another payment.'},{status:409});
    const before = paymentSummary(invoice,payments);
    if (!existing && amount > (kind === 'deposit' ? before.depositOutstanding : before.balanceOutstanding) + 0.001) return Response.json({error:'Amount exceeds the unpaid amount for this payment stage.'},{status:400});
    // Persist a baseline before the first ledger entry so old manual payments are retained on retries.
    const baseline = {legacy_deposit_cents:before.legacyDeposit,legacy_balance_cents:before.legacyBalance};
    await base44.entities.Invoice.update(invoice_id,baseline);
    const paidAt = b.paid_at ? new Date(b.paid_at) : new Date();
    if (Number.isNaN(paidAt.getTime())) return Response.json({error:'Invalid payment date.'},{status:400});
    const payment = existing || await base44.entities.Payment.create({
      invoice_id,contract_id:invoice.contract_id || '',client_name:invoice.client_name || '',client_email:invoice.client_email,
      project_title:invoice.project_title,amount,kind,method,request_id,reference:String(reference).slice(0,300),notes:String(notes).slice(0,1000),paid_at:paidAt.toISOString()
    });
    payments = await base44.entities.Payment.filter({invoice_id}, '-created_date', 1000);
    const summary = paymentSummary({...invoice,...baseline},payments);
    const depositStatus = invoice.deposit_status === 'waived' || summary.deposit===0 ? 'waived' : summary.depositOutstanding===0 ? 'paid' : 'pending';
    const balanceStatus = invoice.balance_status === 'waived' || summary.balance===0 ? 'waived' : summary.balanceOutstanding===0 ? 'paid' : summary.balancePaid>0 ? 'partial' : 'pending';
    const updated = await base44.entities.Invoice.update(invoice_id,{
      deposit_status:depositStatus, deposit_paid_amount:summary.depositPaid,
      deposit_paid_at:depositStatus==='paid' ? invoice.deposit_paid_at || paidAt.toISOString() : invoice.deposit_paid_at,
      deposit_method:kind==='deposit' ? method : invoice.deposit_method,
      balance_amount:summary.balance,balance_paid_amount:summary.balancePaid,balance_status:balanceStatus,
      status:summary.outstanding===0 ? 'paid' : ['paid','waived'].includes(depositStatus) ? 'deposit_paid' : 'open',
    });
    if (invoice.contract_id && ['paid','waived'].includes(depositStatus)) {
      const contract = await base44.entities.Contract.get(invoice.contract_id);
      if (['signed','deposit_paid'].includes(contract.status)) await base44.entities.Contract.update(contract.id,{status:'active'});
    }
    let receiptSent = false;
    if (!existing && b.notify_client === true && invoice.client_email) {
      const money = (n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD'});
      await base44.asServiceRole.integrations.Core.SendEmail({to:invoice.client_email,subject:'Payment received — '+invoice.project_title,
        html:brandedEmail({title:'Thank you for your payment',content:'<p>Payment received for '+esc(invoice.project_title)+'.</p>'+detailRows([['Payment',money(amount)],['Method',esc(method)],['Paid to date',money(summary.paid)],['Remaining',money(summary.outstanding)]])})
      }).then(() => { receiptSent = true; }).catch(() => { receiptSent = false; });
    }
    return Response.json({payment,invoice:updated,paid_total:summary.paid,outstanding:summary.outstanding,receipt_sent:receiptSent,duplicate:!!existing});
  } catch(e) { return Response.json({error:(e as Error).message},{status:500}); }
}
