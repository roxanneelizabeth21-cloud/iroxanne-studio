import React,{useEffect,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import BrandedPageHeader,{BrandedFooter} from '@/components/BrandedPageHeader';
export default function BookCall(){
 const [params]=useSearchParams(),lead_id=params.get('lead')||'',token=params.get('t')||'';
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[selected,setSelected]=useState(''),[day,setDay]=useState(''),[phone,setPhone]=useState('');
 const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
 const dateKey=x=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(x));
 const format=x=>new Date(x).toLocaleString(undefined,{timeZone:zone,dateStyle:'full',timeStyle:'short'});
 const call=async action=>{const r=await base44.functions.invoke('quoteCallBooking',{action,lead_id,token,start:selected,phone});const d=r.data||r;if(d.error)throw Error(d.error);return d;};
 const load=async()=>{setBusy(true);setError('');try{setData(await call('slots'));}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{load();},[lead_id,token]);
 const book=async()=>{if(busy)return;setBusy(true);setError('');try{const d=await call('book');if(d.booked){base44.analytics.track({eventName:'call_booked'});}setData(d);}catch(e){setError(e.message);setSelected('');}finally{setBusy(false);}};
 const days=[...new Set((data?.slots||[]).map(dateKey))];
 const chosenDay=days.includes(day)?day:days[0];
 return <div className="studio-surface min-h-screen bg-background px-4 py-10"><div className="max-w-2xl mx-auto"><BrandedPageHeader title="Schedule an optional call" subtitle="Choose a time to talk through your project."/>
 <div className="rounded-2xl border bg-card p-6 space-y-5">
 {error&&<div role="alert"><p className="text-destructive">{error}</p><Button variant="outline" onClick={load} disabled={busy}>Refresh available times</Button></div>}
 {busy&&!data&&<p role="status">Checking availability…</p>}
 {data?.booked?<><h2 className="font-display text-2xl">Your call is booked</h2><p className="font-semibold">{format(data.start)}</p><p className="text-sm text-muted-foreground">Times shown in {zone}. Roxanne will call the phone number you provided. Check your email for the calendar invitation.</p>{data.email_sent===false&&<p>Your booking is saved, but an additional confirmation email could not be confirmed. The calendar invitation is separate.</p>}<p className="text-sm">To reschedule or cancel, contact the studio using the details in your confirmation.</p></>:data?.enabled===false?<p>Online booking is currently paused. Your quote request is still saved, and Roxanne will follow up by email.</p>:data&&<>
 <p>{data.duration}-minute phone call · Times shown in <strong>{zone}</strong></p>
 {!days.length?<p>No times are currently available. Roxanne will follow up with you by email.</p>:<>
 <fieldset><legend className="font-medium mb-3">Choose a day</legend><div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{days.map(d=>{const sample=data.slots.find(x=>dateKey(x)===d);return <Button key={d} variant={chosenDay===d?'default':'outline'} className="h-auto py-3 whitespace-normal" onClick={()=>{setDay(d);setSelected('');}}>{new Date(sample).toLocaleDateString(undefined,{timeZone:zone,weekday:'short',month:'short',day:'numeric'})}</Button>;})}</div></fieldset>
 <fieldset><legend className="font-medium mb-3">Choose a time</legend><div className="grid grid-cols-3 gap-2">{data.slots.filter(x=>dateKey(x)===chosenDay).map(x=><Button key={x} variant={selected===x?'default':'outline'} onClick={()=>setSelected(x)}>{new Date(x).toLocaleTimeString(undefined,{timeZone:zone,hour:'numeric',minute:'2-digit'})}</Button>)}</div></fieldset>
 {selected&&<div className="space-y-3 border-t pt-4"><p>Selected: <strong>{format(selected)}</strong></p><label className="block text-sm">Best phone number<Input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} maxLength={80} placeholder="Include your country code"/></label><Button disabled={busy||phone.trim().length<5} onClick={book}>{busy?'Booking…':'Confirm my call'}</Button><p className="text-xs text-muted-foreground">Confirming adds the appointment to Roxanne’s Google Calendar and sends an invitation to the email on your quote.</p></div>}
 </>}
 </>}
 </div><BrandedFooter/></div></div>;
}