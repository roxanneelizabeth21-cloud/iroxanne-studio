import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { paymentSummary } from '../../shared/paymentSummary.ts';
import { reminderDecision } from '../../shared/studioDelivery.ts';
import { esc, brandedEmail, brandButton, detailRows } from '../../shared/emailBrand.ts';
export default async function(req: Request) {
  try {
    const base44=createClientFromRequest(req);
    const user=await base44.auth.me().catch(()=>null);
    if (!user || (user.role!=='admin' && user.is_service!==true)) return Response.json({error:'Unauthorized'},{status:403});
    const db=base44.asServiceRole.entities;
    const settingsList=await db.PricingSettings.list('-updated_date');
    const settings=settingsList.find((s:any)=>s.packages?.length)||settingsList[0]||{};
    let sent=0,skipped=0,failed=0;
    const candidates=[];
    // Read a stable candidate list before any flags are changed.
    for(let offset=0;offset<10000;offset+=100) {
      const invoices=await db.Invoice.filter({reminder_enabled:true},'created_date',100,offset);
      candidates.push(...invoices);
      if(invoices.length<100)break;
    }
      for(const row of candidates) {
        const invoice=await db.Invoice.get(row.id);
        if(invoice.reminder_state==='sending' || invoice.reminder_state==='error'){skipped++;continue;}
        const payments=await db.Payment.filter({invoice_id:invoice.id},'-created_date',1000);
        const summary=paymentSummary(invoice,payments);
        const stage=invoice.reminder_stage==='balance'?'balance':'deposit';
        const due=stage==='deposit'?summary.depositOutstanding:summary.balanceOutstanding;
        const decision=reminderDecision(invoice,due);
        if(decision!=='send') {
          if(due<=0 || decision==='limit' || ['paid','cancelled'].includes(invoice.status)) await db.Invoice.update(invoice.id,{reminder_enabled:false});
          skipped++;continue;
        }
        if(!invoice.client_email){await db.Invoice.update(invoice.id,{reminder_enabled:false,reminder_state:'error',reminder_error:'Client email is missing.'});failed++;continue;}
        const now=new Date();
        // A pending send is not retried automatically after an uncertain response.
        await db.Invoice.update(invoice.id,{reminder_state:'sending',reminder_error:'',reminder_last_attempt_at:now.toISOString()});
        try {
          const money=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD'});
          const link=/^https:\/\//i.test(settings.payment_link||'')?settings.payment_link:'';
          const html=brandedEmail({title:'A friendly payment reminder',content:
            '<p>Hello '+esc(invoice.client_name||'there')+',</p><p>This is a reminder about the '+stage+' for <strong>'+esc(invoice.project_title)+'</strong>.</p>'+
            detailRows([['Amount remaining',money(due)],['Paid to date',money(summary.paid)],['Due date',esc(invoice.due_date||'Per your agreement')]])+
            (link?'<p>'+brandButton('Pay online',link)+'</p>':'')+
            (settings.payment_instructions?'<p>'+esc(settings.payment_instructions).replace(/\n/g,'<br/>')+'</p>':'<p>Please reply to arrange payment.</p>')+
            '<p>If you have just paid, thank you. Please reply with the payment reference so I can update your record.</p>'});
          await base44.asServiceRole.integrations.Core.SendEmail({to:invoice.client_email,subject:'Payment reminder — '+invoice.project_title,body:html,from_name:'iRoxanne Studio'});
          const count=(invoice.reminder_sent_count||0)+1;
          const limit=Math.max(1,Math.min(10,invoice.reminder_max_count||3));
          const interval=Math.max(1,Math.min(30,invoice.reminder_interval_days||7));
          await db.Invoice.update(invoice.id,{reminder_state:'idle',reminder_sent_count:count,reminder_last_sent_at:now.toISOString(),reminder_next_at:new Date(now.getTime()+interval*86400000).toISOString(),reminder_enabled:count<limit});
          sent++;
        }catch(e){
          await db.Invoice.update(invoice.id,{reminder_enabled:false,reminder_state:'error',reminder_error:'Send could not be confirmed. Check email delivery before resuming. '+String((e as Error).message).slice(0,300)});
          failed++;
        }
      }
    return Response.json({sent,skipped,failed});
  }catch(e){return Response.json({error:(e as Error).message},{status:500});}
}
