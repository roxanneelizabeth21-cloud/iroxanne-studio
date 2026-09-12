import React,{useEffect,useState} from 'react';
import {useParams,useSearchParams} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import BrandedPageHeader,{BrandedFooter,PrintButton} from '@/components/BrandedPageHeader';
export default function ProjectHandoff(){
 const {id}=useParams(),[params]=useSearchParams(),token=params.get('t')||'';
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[name,setName]=useState(''),[consent,setConsent]=useState(false),[notes,setNotes]=useState('');
 useEffect(()=>{setData(null);setError('');base44.functions.invoke('projectHandoff',{contract_id:id,token,action:'view'}).then(r=>{const d=r.data||r;if(d.error)throw new Error(d.error);setData(d.handoff);}).catch(e=>setError(e.message));},[id,token]);
 const act=async action=>{setBusy(true);setError('');try{const r=await base44.functions.invoke('projectHandoff',{contract_id:id,token,action,name,consent,notes});const d=r.data||r;if(d.error)throw new Error(d.error);setData(d.handoff);}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <div className="studio-surface min-h-screen p-4 py-10"><div className="max-w-3xl mx-auto">
 <BrandedPageHeader title="Your project handoff" projectTitle={data?.project_title} clientName={data?.client_name}/><div className="flex justify-end"><PrintButton/></div>
 {error&&<p role="alert" className="text-destructive my-4">{error}</p>}
 {!data&&!error&&<p>Loading your handoff…</p>}
 {data&&<div className="rounded-2xl bg-card border p-6 space-y-6">
 <p>Review the delivered items below. Accept the handoff when everything is ready, or tell me what still needs attention.</p>
 {data.handoff_items.map(x=><div key={x.id} className="border-b pb-3"><p className="text-xs text-muted-foreground">{x.category}</p><h2 className="font-semibold">{x.completed?'✓':'○'} {x.label}{!x.required?' (optional)':''}</h2>{x.notes&&<p className="text-sm whitespace-pre-wrap mt-1">{x.notes}</p>}</div>)}
 {data.handoff_status==='ready'&&<div className="space-y-3 print:hidden"><label htmlFor="handoff-name">Your full name</label><Input id="handoff-name" value={name} onChange={e=>setName(e.target.value)} maxLength={200}/><label className="flex gap-2"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I have reviewed the delivered items and accept this project handoff.</label><Button disabled={busy||!name.trim()||!consent} onClick={()=>act('accept')}>Accept handoff</Button><div className="pt-5 space-y-2"><label htmlFor="handoff-notes">Something still needs attention?</label><Textarea id="handoff-notes" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={3000}/><Button variant="outline" disabled={busy||!notes.trim()} onClick={()=>act('request_changes')}>Request follow-up</Button></div></div>}
 {data.handoff_status==='accepted'&&<p className="font-semibold">Accepted by {data.handoff_ack_name} on {new Date(data.handoff_ack_at).toLocaleString()}.</p>}
 {data.handoff_status==='changes_requested'&&<div><h2 className="font-semibold">Your follow-up request is saved</h2><p className="whitespace-pre-wrap">{data.handoff_client_notes}</p></div>}
 </div>}<BrandedFooter/></div></div>;
}