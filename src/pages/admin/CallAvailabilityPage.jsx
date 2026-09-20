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
 return <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
  <div className="irx-page-header">
    <div className="irx-eyebrow">Business Manager</div>
    <h1>Call Availability</h1>
    <p>Set your weekly consultation hours and manage calendar integration.</p>
  </div>
  {message&&<p role="status" style={{ borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)', padding: '12px' }}>{message}</p>}
  {!s?<p>Loading settings…</p>:<div className="irx-card" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
   <Button variant="outline" disabled={busy} onClick={()=>run('admin_check')}>Check Google connection</Button>
   <fieldset disabled={busy} style={{ display: 'flex', flexDirection: 'column', gap: '32px', border: 'none', padding: 0, margin: 0 }}>
    <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><input type="checkbox" checked={!!s.enabled} onChange={e=>update('enabled',e.target.checked)}/>Offer "Schedule an optional call" after a quote</label>
    <label style={{ display: 'block', fontSize: '13px' }}>Your scheduling time zone<Input value={s.timezone} onChange={e=>update('timezone',e.target.value)} placeholder="America/New_York"/></label>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>{[['duration_minutes','Call length (minutes)',15,120,15],['buffer_minutes','Break between calls (minutes)',0,60,15],['notice_hours','Minimum advance notice (hours)',1,168,1],['horizon_days','How far ahead clients may book (days)',1,60,1]].map(([key,label,min,max,step])=><label key={key} style={{ fontSize: '13px' }}>{label}<Input type="number" min={min} max={max} step={step} value={s[key]} onChange={e=>update(key,Number(e.target.value))}/></label>)}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}><h2 className="irx-section-head">Weekly hours</h2>{names.map((name,n)=>{const w=s.weekly_hours.find(x=>x.day===n);return <div key={name} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}><label style={{ display: 'flex', gap: '8px', width: '128px' }}><input type="checkbox" checked={!!w} onChange={e=>update('weekly_hours',e.target.checked?[...s.weekly_hours,{day:n,start:'17:00',end:'19:30'}]:s.weekly_hours.filter(x=>x.day!==n))}/>{name}</label>{w&&<><Input aria-label={name+' opening time'} type="time" step="900" style={{ width: '128px' }} value={w.start} onChange={e=>day(n,{start:e.target.value})}/><span>to</span><Input aria-label={name+' closing time'} type="time" step="900" style={{ width: '128px' }} value={w.end} onChange={e=>day(n,{end:e.target.value})}/></>}</div>;})}</div>
    <label style={{ display: 'block', fontSize: '13px' }}><span style={{ display: 'block', marginBottom: '8px' }}>Blocked dates (one YYYY-MM-DD date per line)</span><Textarea rows={4} value={blocked} onChange={e=>setBlocked(e.target.value)} placeholder="2026-12-25"/></label>
    <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)' }}>Changes apply to new bookings. Existing appointments stay on your calendar. Manage cancellations or changes in Google Calendar and notify the client.</p>
    <Button onClick={()=>run('admin_save')}>Save availability</Button>
   </fieldset></div>}
 </div>;
}
