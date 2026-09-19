import { validateSchedule } from './paymentSchedule.ts';

const token = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2,'0')).join('');
// Reuse the contract link on retries. Never infer payments or overwrite existing totals.
export async function ensureContractInvoice(entities, contract) {
  if (!['signed','deposit_paid','active','completed'].includes(contract.status)) throw new Error('A signed agreement is required.');
  const matches = await entities.Invoice.filter({contract_id:contract.id});
  const active = matches.filter(i=>i.status!=='cancelled');
  if(active.length>1) throw new Error('Multiple invoices are linked to this agreement. Review them before proceeding.');
  if(active.length) {
    let invoice=active[0];
    if(!invoice.access_token) invoice=await entities.Invoice.update(invoice.id,{access_token:token()});
    return invoice;
  }
  if(matches.length) throw new Error('The linked invoice was cancelled. Review it before creating a replacement.');
  const total=Number(contract.price_total), deposit=Number(contract.deposit_amount||0);
  if(!Number.isFinite(total)||total<0||!Number.isFinite(deposit)||deposit<0||deposit>total) throw new Error('The agreement has invalid payment amounts.');
  const installments=contract.payment_installments?.length?validateSchedule(contract.payment_installments,total):[];
  if(installments.length&&installments[0].amount!==deposit) throw new Error('The payment plan and deposit do not match.');
  return entities.Invoice.create({
    contract_id:contract.id, proposal_id:contract.proposal_id||'',
    client_name:contract.client_name||'',client_email:contract.client_email,project_title:contract.project_title,
    amount_total:total,deposit_amount:deposit,balance_amount:Math.max(total-deposit,0),
    deposit_status:deposit>0?'pending':'waived',balance_status:total-deposit>0?'pending':'waived',
    status:total===0?'paid':'open',access_token:token(),payment_installments:installments,
    square_schedule_enabled:installments.length>0,
    ...(installments.length?{due_date:installments[0].due_date}:{})
  });
}
