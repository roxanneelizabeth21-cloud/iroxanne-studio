import React,{useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
const names=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export default function CallAvailabilityPage(){
 const [s,setS]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[blocked,setBlocked]=useState('');
 const invoke=async(action,extra={})=>{const r=await base44.functions.invoke('quoteCallBooking',{action,...extra});const d=r.data||r;if(d.error)throw Error(d.error);return d;};
 useEffect(()=>{invoke('admin_load').then(d=>{setS(d.settings);setBlocked((d.settings.blocked_dates||[]).join('\n'));}).catch(e=>setMessage(e.message));},[]);
 const update=(k,v)=>setS(p=>({...p,[k]:v}));
 const day=(n,patch)=>setS(p=>({...p,weekly_hours:p.weekly_hours.map(x=>x.day===n?{...x,...patch}:x)}));
 const run=async action=>{setBusy(true);setMessage('');try{const d=await invoke(action,action==='admin_save'?{settings:{...s,blocked_dates:blocked.split(/[\n,]/).map(x=>x.trim()).filter(Boolean)}}:{});if(d.settings)setS(d.settings);setMessage(action==='admin_check'?'Connected to '+d.calendar_name+'. Calendar time zone: '+d.timezone:'Call availability saved.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 return <div className="space-y-5"><h1 className="font-display text-3xl">Call availability</h1><p className="text-muted-foreground">Control the optional call calendar shown after a quote submission. Busy events on your primary Google Calendar block appointments.</p>{message&&<p role="status" className="rounded-xl border p-3">{message}</p>}{!s?<p>Loading settings…</p>:<div className="rounded-2xl border bg-card p-5 space-y-5">
 <Button variant="outline" disabled={busy} onClick={()=>run('admin_check')}>Check Google connection</Button>
 <fieldset disabled={busy} className="space-y-5">
 <label className="flex gap-2"><input type="checkbox" checked={!!s.enabled} onChange={e=>update('enabled',e.target.checked)}/>Offer “Schedule an optional call” after a quote</label>
 <label className="block text-sm">Your scheduling time zone<Input value={s.timezone} onChange={e=>update('timezone',e.target.value)} placeholder="America/New_York"/></label>
 <div className="grid sm:grid-cols-2 gap-4">{[['duration_minutes','Call length (minutes)',15,120,15],['buffer_minutes','Break between calls (minutes)',0,60,15],['notice_hours','Minimum advance notice (hours)',1,168,1],['horizon_days','How far ahead clients may book (days)',1,60,1]].map(([key,label,min,max,step])=><label key={key} className="text-sm">{label}<Input type="number" min={min} max={max} step={step} value={s[key]} onChange={e=>update(key,Number(e.target.value))}/></label>)}</div>
 <div className="space-y-3"><h2 className="font-semibold">Weekly hours</h2>{names.map((name,n)=>{const w=s.weekly_hours.find(x=>x.day===n);return <div key={name} className="flex flex-wrap items-center gap-3"><label className="flex gap-2 w-32"><input type="checkbox" checked={!!w} onChange={e=>update('weekly_hours',e.target.checked?[...s.weekly_hours,{day:n,start:'10:00',end:'16:00'}]:s.weekly_hours.filter(x=>x.day!==n))}/>{name}</label>{w&&<><Input aria-label={name+' opening time'} type="time" step="900" className="w-32" value={w.start} onChange={e=>day(n,{start:e.target.value})}/><span>to</span><Input aria-label={name+' closing time'} type="time" step="900" className="w-32" value={w.end} onChange={e=>day(n,{end:e.target.value})}/></>}</div>;})}</div>
 <label className="block text-sm space-y-2">Blocked dates (one YYYY-MM-DD date per line)<Textarea rows={4} value={blocked} onChange={e=>setBlocked(e.target.value)} placeholder="2026-12-25"/></label>
 <p className="text-xs text-muted-foreground">Changes apply to new bookings. Existing appointments stay on your calendar. Manage cancellations or changes in Google Calendar and notify the client.</p>
 <Button onClick={()=>run('admin_save')}>Save availability</Button>
 </fieldset></div>}</div>;
}