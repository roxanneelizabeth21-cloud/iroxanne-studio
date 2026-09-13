import React,{useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
export default function HandoffPanel({contractId,onSaved}){
 const [c,setC]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[link,setLink]=useState('');
 const call=async(action,extra={})=>{const r=await base44.functions.invoke('projectHandoff',{contract_id:contractId,action,...extra});const d=r.data||r;if(d.error)throw new Error(d.error);return d;};
 useEffect(()=>{call('load').then(d=>setC(d.contract)).catch(e=>setError(e.message));},[contractId]);
 const run=async(action)=>{setBusy(true);setError('');try{
   if(action==='save'||action==='publish')await call('save',{items:c.handoff_items,internal_notes:c.handoff_internal_notes||''});
   const d=action==='save'?await call('load'):await call(action);
   if(d.contract)setC(d.contract);if(d.link)setLink(d.link);if(action==='reopen')setLink('');
   await onSaved();
 }catch(e){setError(e.message);}finally{setBusy(false);}};
 const item=(id,patch)=>setC(p=>({...p,handoff_items:p.handoff_items.map(x=>x.id===id?{...x,...patch}:x)}));
 const locked=c?.handoff_status==='accepted'||c?.status==='completed';
 const complete=c?.handoff_items?.every(x=>!x.required||x.completed);
 const shareLink=link||(c?.handoff_token && c.handoff_status!=='draft'?window.location.origin+'/handoff/'+contractId+'?t='+c.handoff_token:'');
 return <div className="space-y-4">
 {error&&<p role="alert" className="text-destructive">{error}</p>}
 {!c?<p>Loading checklist…</p>:<>
 <p className="text-sm text-muted-foreground">Status: {(c.handoff_status||'draft').replaceAll('_',' ')}. Complete the required items, then share the checklist for client acceptance. Payment status is tracked separately.</p>
 <fieldset disabled={busy||locked} className="space-y-3">
 {c.handoff_items.map(x=><div key={x.id} className="rounded-xl border p-3 space-y-2">
 <p className="text-xs text-muted-foreground">{x.category}</p>
 <label className="flex gap-2 items-start"><input type="checkbox" className="mt-1" checked={!!x.completed} onChange={e=>item(x.id,{completed:e.target.checked})}/><span>{x.label}</span></label>
 <label className="flex gap-2 text-xs"><input type="checkbox" checked={!!x.required} onChange={e=>item(x.id,{required:e.target.checked})}/>Required for handoff</label>
 <Textarea aria-label={'Client-visible notes for '+x.label} placeholder="Client-visible notes, instructions or document links. Do not include passwords." value={x.notes||''} onChange={e=>item(x.id,{notes:e.target.value})} maxLength={2000}/>
 </div>)}
 <Button variant="outline" type="button" disabled={c.handoff_items.length>=50} onClick={()=>setC(p=>({...p,handoff_items:[...p.handoff_items,{id:crypto.randomUUID(),category:'Additional',label:'Additional handoff item',required:true,completed:false,notes:''}]}))}>Add checklist item</Button>
 {c.handoff_items.filter(x=>x.category==='Additional').map(x=><label key={x.id} className="block text-sm">Additional item title<Input value={x.label} onChange={e=>item(x.id,{label:e.target.value})}/></label>)}
 <label className="block text-sm space-y-2">Internal notes — only visible to you<Textarea value={c.handoff_internal_notes||''} onChange={e=>setC({...c,handoff_internal_notes:e.target.value})} maxLength={5000}/></label>
 </fieldset>
 {c.handoff_client_notes&&<div className="rounded-xl bg-secondary p-3"><p className="font-medium">Client follow-up request</p><p className="whitespace-pre-wrap">{c.handoff_client_notes}</p></div>}
 {c.handoff_status==='accepted'&&<p className="text-sm">Accepted by {c.handoff_ack_name} on {new Date(c.handoff_ack_at).toLocaleString()}.</p>}
 <div className="flex flex-wrap gap-2">
 {!locked&&<><Button disabled={busy} onClick={()=>run('save')}>Save checklist</Button><Button variant="outline" disabled={busy||!complete} onClick={()=>run('publish')}>Save & create client link</Button></>}
 {c.handoff_status==='accepted'&&c.status!=='completed'&&<Button disabled={busy} onClick={()=>run('complete')}>Mark project delivered</Button>}
 {locked&&<Button variant="outline" disabled={busy} onClick={()=>{if(window.confirm('Reopen this handoff? The client will need to accept the revised checklist again.'))run('reopen');}}>Reopen for revisions</Button>}
 </div>
 {shareLink&&<div className="space-y-2"><label className="text-sm">Private client handoff link<Input readOnly value={shareLink}/></label><Button variant="outline" onClick={()=>navigator.clipboard.writeText(shareLink).catch(()=>setError('Select and copy the link above.'))}>Copy link</Button><p className="text-xs text-muted-foreground">Share this link with the client when you are ready. Creating it does not email them.</p></div>}
 </>}
 </div>;
}