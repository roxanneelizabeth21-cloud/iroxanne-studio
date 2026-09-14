import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {validateSchedule} from '../../../base44/shared/paymentSchedule.ts';

export function scheduleError(rows,total) {
  if (!rows?.length) return '';
  try {validateSchedule(rows,total); return '';} catch(e) {return e.message;}
}
export default function PaymentScheduleEditor(props) {
  if (!props.value?.length) return <p className="text-sm text-muted-foreground">Deposit and final balance apply. Clients may pay in full or make voluntary extra payments. The deposit must clear before work begins; the final balance is due under the agreement.</p>;
  return <LegacyPaymentScheduleEditor {...props}/>;
}
function LegacyPaymentScheduleEditor({value=[],total,onChange}) {
  const [count,setCount]=useState(value.length || 3);
  const [start,setStart]=useState(value[0]?.due_date || new Date().toLocaleDateString('en-CA'));
  const [gap,setGap]=useState(14);
  const build=()=>{
    const cents=Math.round(total*100), each=Math.floor(cents/count);
    const rows=Array.from({length:count},(_,i)=>{
      const d=new Date(start+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+i*gap);
      return {label:i===0?(count===1?'Full payment':'Deposit'):'Payment '+(i+1),
        amount:(each+(i===count-1?cents-each*count:0))/100,due_date:d.toISOString().slice(0,10)};
    });
    onChange(rows);
  };
  const error=scheduleError(value,total);
  return <section className="rounded-xl border border-border p-4 space-y-4">
    <div><h3 className="font-semibold">Dated payment plan</h3><p className="text-sm text-muted-foreground">Up to seven payments total. Payment one is the deposit. Edit every amount and date before sending.</p></div>
    <div className="grid sm:grid-cols-3 gap-3">
      <label className="text-sm">Number of payments<select className="block w-full border rounded-md bg-background p-2" value={count} onChange={e=>setCount(Number(e.target.value))}>{[1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
      <label className="text-sm">First due date<Input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
      <label className="text-sm">Spacing<select className="block w-full border rounded-md bg-background p-2" value={gap} onChange={e=>setGap(Number(e.target.value))}><option value={7}>Weekly</option><option value={14}>Every two weeks</option><option value={30}>Every 30 days</option></select></label>
    </div>
    <div className="flex gap-2"><Button type="button" variant="outline" disabled={!start || !Number.isFinite(Date.parse(start)) || total<=0 || Math.round(total*100)<count} onClick={build}>{value.length?'Rebuild equal payments':'Create payment plan'}</Button>{value.length>0 && <Button type="button" variant="ghost" onClick={()=>onChange([])}>Use standard terms</Button>}</div>
    {value.map((r,i)=><div key={i} className="grid sm:grid-cols-3 gap-2">
      <label className="text-xs">Payment {i+1}<Input aria-label={'Payment '+(i+1)+' label'} disabled={i===0} value={r.label} onChange={e=>onChange(value.map((x,j)=>j===i?{...x,label:e.target.value}:x))}/></label>
      <label className="text-xs">Amount ($)<Input aria-label={'Payment '+(i+1)+' amount'} type="number" min="0.01" step="0.01" value={r.amount} onChange={e=>onChange(value.map((x,j)=>j===i?{...x,amount:Number(e.target.value)}:x))}/></label>
      <label className="text-xs">Due date<Input aria-label={'Payment '+(i+1)+' due date'} type="date" value={r.due_date} onChange={e=>onChange(value.map((x,j)=>j===i?{...x,due_date:e.target.value}:x))}/></label>
    </div>)}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {value.length>0 && <p className="text-xs text-muted-foreground">Square emails the invoice and reminders when you send it from Invoices. Three or more payments require Square installment support. Clients pay each installment; this does not authorize automatic charges.</p>}
  </section>;
}
