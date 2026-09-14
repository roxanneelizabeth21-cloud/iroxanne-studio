import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { applyInvoicePayment } from '../../shared/invoicePayments.ts';
import { assertSquareBinding } from '../../shared/squareBinding.ts';
import { brandedEmail, esc } from '../../shared/emailBrand.ts';
import {syncSquareSchedule} from '../../shared/squareSchedule.ts';
export default async function(req: Request) {
  const b = createClientFromRequest(req);
  const user = await b.auth.me().catch(()=>null);
  if (!user || (user.role !== 'admin' && user.is_service !== true)) return Response.json({error:'Forbidden'},{status:403});
  const e = b.asServiceRole.entities;
  const {accessToken} = await b.asServiceRole.connectors.getConnection('square');
  if (!accessToken) return Response.json({error:'Square disconnected'},{status:503});
  const get = async (path:string) => {
    const r = await fetch('https://connect.squareup.com/v2/'+path,{headers:{Authorization:'Bearer '+accessToken,'Square-Version':'2025-08-21'}});
    if (!r.ok) throw new Error('Square lookup failed: '+r.status);
    return r.json();
  };
  // Oldest checked first: abandoned links cannot starve newer payments.
  const rows = await e.SquareCheckout.filter({status:'pending'},'last_checked_at',100);
  let recorded=0, errors=0;
  for (const c of rows) {
    try {
      await e.SquareCheckout.update(c.id,{last_checked_at:new Date().toISOString()});
      const {order} = await get('orders/'+encodeURIComponent(c.order_id));
      if (order?.id !== c.order_id || order.location_id !== c.location_id) throw new Error('Order mismatch');
      const tenders = order.tenders || [];
      if (!tenders.length) continue;
      if (tenders.length !== 1 || !tenders[0].payment_id) throw new Error('Unsupported tender; review Square checkout');
      const {payment} = await get('payments/'+encodeURIComponent(tenders[0].payment_id));
      if (payment?.status !== 'COMPLETED') continue;
      assertSquareBinding(c,payment);
      const prior = await e.Payment.filter({request_id:'square_'+payment.id},'-created_date',10);
      if (prior.some((p:any)=>p.invoice_id !== c.invoice_id)) throw new Error('Payment already belongs to another invoice');
      const result = await applyInvoicePayment(b,{invoice_id:c.invoice_id,amount:c.expected_amount_cents/100,
        kind:c.kind,method:'square',reference:payment.id,request_id:'square_'+payment.id,
        milestoneIndex:c.milestone_index ?? null,source:'square_reconciliation',enforceOutstanding:true});
      await e.SquareCheckout.update(c.id,{status:'recorded',payment_id:payment.id,last_error:''});
      recorded++;
      if (!result.duplicate && result.invoice?.client_email) {
        try {
          await b.asServiceRole.integrations.Core.SendEmail({to:result.invoice.client_email,
            subject:'Payment received — '+result.invoice.project_title,
            html:brandedEmail({title:'Thank you for your payment',content:'<p>We received your payment of $'+(c.expected_amount_cents/100).toFixed(2)+' for '+esc(result.invoice.project_title)+'.</p>'})});
        } catch { await e.SquareCheckout.update(c.id,{last_error:'Payment recorded; receipt email needs retry by admin'}); }
      }
    } catch (error) {
      errors++;
      await e.SquareCheckout.update(c.id,{last_error:String((error as Error).message).slice(0,500)});
    }
  }
  const plans=await e.Invoice.filter({square_schedule_enabled:true},'square_last_checked_at',100);
  for(const invoice of plans) {
    if(!invoice.square_invoice_id) {
      await e.Invoice.update(invoice.id,{square_last_checked_at:new Date().toISOString()});
      continue;
    }
    try {await syncSquareSchedule(b,invoice);}
    catch(error) {errors++; await e.Invoice.update(invoice.id,{square_last_checked_at:new Date().toISOString(),square_sync_error:(error as Error).message});}
  }
  return Response.json({checked:rows.length,plans_checked:plans.length,recorded,errors});
}
