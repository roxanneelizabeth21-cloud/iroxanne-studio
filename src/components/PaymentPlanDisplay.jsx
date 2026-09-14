import React from 'react';
const money=n=>Number(n || 0).toLocaleString('en-US',{style:'currency',currency:'USD'});
export default function PaymentPlanDisplay({invoice}) {
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 return <section className="space-y-3">
   <h3 className="font-semibold text-foreground">Payment plan · {invoice.payment_installments.length} payments</h3>
   {invoice.payment_installments.map((r,i)=>{
     const paid=Number(invoice.square_payment_snapshot?.[i]?.paid_amount || 0);
     const remaining=Math.max(0,Math.round((r.amount-paid)*100)/100);
     const status=remaining===0?'Paid':invoice.status==='cancelled'?'Cancelled':r.due_date<today?(paid>0?'Partially paid · overdue':'Overdue'):r.due_date===today?'Due today':paid>0?'Partially paid':'Upcoming';
     return <div key={i} className="rounded-lg border border-border p-3 text-sm grid gap-2 sm:grid-cols-3">
       <div><p className="font-medium text-foreground">{r.label}</p><p className="text-muted-foreground">Due {r.due_date}</p></div>
       <div><p className="text-foreground">{money(r.amount)}</p><p className="text-muted-foreground">{money(paid)} paid · {money(remaining)} remaining</p></div>
       <p className={remaining===0?'text-green-600 dark:text-green-400':'text-foreground'}>{status}</p>
     </div>;
   })}
   <p className="text-xs text-muted-foreground">Payment status updates from Square automatically. {invoice.square_last_checked_at?'Last checked '+new Date(invoice.square_last_checked_at).toLocaleString()+'.':'The plan has not been sent to Square yet.'}</p>
 </section>;
}
