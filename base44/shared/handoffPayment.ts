import {paymentSummary} from './paymentSummary.ts';
import {syncSquareSchedule} from './squareSchedule.ts';
export async function handoffPayment(base44:any,contract:any) {
  const blocked={paid_in_full:false,message:'Full app handoff is available after payment in full.'};
  const total=Math.round(Number(contract.price_total)*100);
  if(!Number.isSafeInteger(total)||total<=0) return {...blocked,message:'Confirm the project total and payment before handoff.'};
  const db=base44.asServiceRole.entities;
  const invoices=(await db.Invoice.filter({contract_id:contract.id},'-created_date',1000)).filter((i:any)=>i.status!=='cancelled');
  if(!invoices.length) return {...blocked,message:'No invoice is available to confirm full payment.'};
  let billed=0,paid=0;
  for(let invoice of invoices) {
    if(invoice.square_schedule_enabled) {
      if(!invoice.square_invoice_id) return blocked;
      try {invoice=await syncSquareSchedule(base44,invoice);}
      catch {return {...blocked,message:'Square payment could not be confirmed. Refresh after resolving the invoice issue.'};}
      if(invoice.status==='cancelled') return blocked;
    }
    const payments=await db.Payment.filter({invoice_id:invoice.id},'-created_date',1000);
    const s=paymentSummary(invoice,payments);
    const amount=Math.round(s.total*100),received=Math.round(s.paid*100);
    if(!Number.isSafeInteger(amount)||amount<=0||!Number.isSafeInteger(received)||received<amount) return blocked;
    billed+=amount;paid+=received;
  }
  if(billed!==total || paid<total) return {...blocked,message:'Invoice totals must match the agreement and be paid in full before handoff.'};
  return {paid_in_full:true,message:'Payment confirmed in full. Complete the checklist to release the app handoff.'};
}
