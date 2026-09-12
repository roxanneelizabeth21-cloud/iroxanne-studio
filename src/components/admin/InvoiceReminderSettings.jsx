import React,{useState} from 'react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
const localTime=value=>{const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
export default function InvoiceReminderSettings({invoice,onSaved}){
 const [enabled,setEnabled]=useState(!!invoice.reminder_enabled);
 const [stage,setStage]=useState(invoice.reminder_stage||'deposit');
 const [next,setNext]=useState(localTime(invoice.reminder_next_at||Date.now()+86400000));
 const [days,setDays]=useState(invoice.reminder_interval_days||7);
 const [max,setMax]=useState(invoice.reminder_max_count||3);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const blocked=['paid','cancelled','draft'].includes(invoice.status);
 const save=async(pause=false)=>{setBusy(true);setMessage('');try{
  if(!pause&&enabled&&(!next||new Date(next).getTime()<=Date.now()))throw new Error('Choose a future time for the first reminder.');
  if(!pause&&(!Number.isInteger(Number(days))||days<1||days>30||!Number.isInteger(Number(max))||max<1||max>10))throw new Error('Choose 1–30 days and 1–10 reminders.');
  if(!pause&&['sending','error'].includes(invoice.reminder_state)&&!window.confirm('First check whether the last reminder reached the client. Start a new reminder sequence now?'))return;
  await base44.entities.Invoice.update(invoice.id,pause?{reminder_enabled:false}:{reminder_enabled:enabled&&!blocked,reminder_stage:stage,reminder_next_at:new Date(next).toISOString(),reminder_interval_days:Number(days),reminder_max_count:Number(max),reminder_sent_count:0,reminder_state:'idle',reminder_error:''});
  if(pause)setEnabled(false);setMessage(pause?'Reminders paused.':'Reminder schedule saved.');await onSaved();
 }catch(e){setMessage(e.message);}finally{setBusy(false);}};
 return <details className="border-t pt-3 text-sm"><summary className="cursor-pointer font-medium">Payment reminders · {invoice.reminder_enabled?'Enabled':'Off'}</summary><div className="space-y-3 pt-3">
 <p className="rounded-lg border border-amber-300 bg-amber-50 text-amber-950 p-3">Setup check: confirm the hourly payment-reminder Workflow is active in Base44 before relying on these schedules.</p>
 <p className="text-muted-foreground">Email {invoice.client_email} about the selected unpaid stage. Checked hourly; delivery can be up to an hour after the chosen time. Stops when that stage is paid or the limit is reached.</p>
 <p>{invoice.reminder_sent_count||0} sent in this sequence.{invoice.reminder_last_sent_at?' Last sent '+new Date(invoice.reminder_last_sent_at).toLocaleString()+'.':''}</p>
 {invoice.reminder_error&&<p className="text-destructive">{invoice.reminder_error}</p>}
 {invoice.reminder_state==='sending'&&<p>A send is pending or unconfirmed. Check delivery before starting another sequence.</p>}
 <fieldset disabled={busy||blocked} className="space-y-3">
 <label className="flex gap-2"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Enable reminders for this invoice</label>
 <div className="grid sm:grid-cols-2 gap-3">
 <label>Payment stage<select className="w-full bg-background border rounded-md p-2" value={stage} onChange={e=>setStage(e.target.value)}><option value="deposit">Deposit</option><option value="balance">Balance</option></select></label>
 <label>First reminder (your local time)<Input type="datetime-local" value={next} onChange={e=>setNext(e.target.value)}/></label>
 <label>Repeat every (days)<Input type="number" min="1" max="30" value={days} onChange={e=>setDays(e.target.value)}/></label>
 <label>Maximum reminders<Input type="number" min="1" max="10" value={max} onChange={e=>setMax(e.target.value)}/></label>
 </div>
 <Button type="button" onClick={()=>save(false)}>Save new reminder schedule</Button>
 <p className="text-xs text-muted-foreground">Saving starts a new sequence with its sent count reset to zero.</p>
 </fieldset>
 {invoice.reminder_enabled&&<Button variant="outline" disabled={busy} onClick={()=>save(true)}>Pause reminders</Button>}
 {blocked&&<p>Reminders are unavailable for {invoice.status} invoices.</p>}
 {message&&<p role="status">{message}</p>}
 </div></details>;
}