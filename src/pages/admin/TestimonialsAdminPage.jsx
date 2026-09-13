import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const empty={quote:'',client_name:'',client_anonymous:false,consent_to_publish:false,approved_for_use:false,featured_homepage:false,permission_notes:'',sort_order:0};
export default function TestimonialsAdminPage(){
  const [rows,setRows]=useState([]),[edit,setEdit]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[link,setLink]=useState('');
  async function load(){setRows(await base44.entities.Testimonial.list('-created_date',500));}
  useEffect(()=>{load().catch(()=>setMessage('Could not load testimonials. Please refresh.'));},[]);
  const update=(k,v)=>setEdit(p=>({...p,[k]:v}));
  async function save(e){
    e.preventDefault();setBusy(true);setMessage('');
    try{
      if(edit.approved_for_use&&!edit.consent_to_publish)throw new Error('Record client permission before publishing.');
      if(edit.consent_to_publish&&!edit.permission_notes?.trim())throw new Error('Record how and when permission was given.');
      const data={quote:edit.quote.trim(),client_name:edit.client_name.trim(),client_anonymous:edit.client_anonymous,
        consent_to_publish:edit.consent_to_publish,permission_notes:edit.permission_notes,
        approved_for_use:edit.consent_to_publish&&edit.approved_for_use,
        featured_homepage:edit.consent_to_publish&&edit.approved_for_use&&edit.featured_homepage,
        sort_order:Number(edit.sort_order)||0,request_pending:false};
      if(edit.id)await base44.entities.Testimonial.update(edit.id,data);else await base44.entities.Testimonial.create({...data,date:new Date().toISOString().slice(0,10)});
      setEdit(null);await load();setMessage('Testimonial saved.');
    }catch(e){setMessage(e.message);}finally{setBusy(false);}
  }
  async function invitation(){
    setBusy(true);setMessage('');
    try{
      const token=crypto.randomUUID()+crypto.randomUUID();
      const r=await base44.entities.Testimonial.create({...empty,quote:'Awaiting client feedback',request_pending:true,access_token:token,expires_at:new Date(Date.now()+30*86400000).toISOString()});
      setLink('https://iroxannestudio.com/feedback?id='+encodeURIComponent(r.id)+'&t='+encodeURIComponent(token));await load();
    }catch(e){setMessage(e.message);}finally{setBusy(false);}
  }
  return <div className="space-y-6">
    <h1 className="font-display text-3xl">Testimonials</h1>
    <p className="text-muted-foreground">Collect feedback privately. Client permission allows you to consider sharing it; you decide whether to publish and whether to feature it on the homepage.</p>
    <div className="flex flex-wrap gap-3"><Button onClick={()=>setEdit({...empty})}>Add received testimonial</Button><Button variant="outline" disabled={busy} onClick={invitation}>Create private feedback link</Button></div>
    {link&&<div className="rounded-xl border border-border p-4 space-y-3"><p>Send this private link to one client. It expires in 30 days and accepts one submission.</p><Input aria-label="Private feedback link" readOnly value={link}/><Button variant="outline" onClick={()=>navigator.clipboard.writeText(link).then(()=>setMessage('Link copied.')).catch(()=>setMessage('Select the link above and copy it manually.'))}>Copy link</Button></div>}
    {message&&<p role="status">{message}</p>}
    {edit&&<form onSubmit={save} className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h2 className="font-display text-2xl">{edit.id?'Review testimonial':'Add testimonial'}</h2>
      <label className="block space-y-2">Client’s words<Textarea required maxLength={3000} rows={5} value={edit.quote} onChange={e=>update('quote',e.target.value)}/></label>
      <label className="block space-y-2">Approved display name<Input maxLength={120} value={edit.client_name} onChange={e=>update('client_name',e.target.value)}/></label>
      <label className="flex gap-3"><input type="checkbox" checked={edit.client_anonymous} onChange={e=>update('client_anonymous',e.target.checked)}/>Display as “A recent client”</label>
      <label className="flex gap-3"><input type="checkbox" checked={edit.consent_to_publish} onChange={e=>setEdit(p=>({...p,consent_to_publish:e.target.checked,approved_for_use:false,featured_homepage:false}))}/>Client gave permission to share these words and this display name</label>
      <label className="block space-y-2">Permission details (private)<Textarea maxLength={2000} value={edit.permission_notes} onChange={e=>update('permission_notes',e.target.value)} placeholder="For example: permission received by email on September 14."/></label>
      <label className="flex gap-3"><input type="checkbox" disabled={!edit.consent_to_publish} checked={edit.approved_for_use} onChange={e=>setEdit(p=>({...p,approved_for_use:e.target.checked,featured_homepage:e.target.checked?p.featured_homepage:false}))}/>Publish — allow use on the website and in future studio marketing</label>
      <label className="flex gap-3"><input type="checkbox" disabled={!edit.approved_for_use||!edit.consent_to_publish} checked={edit.featured_homepage} onChange={e=>update('featured_homepage',e.target.checked)}/>Feature on homepage</label>
      <label className="block space-y-2">Homepage order (lower first)<Input type="number" value={edit.sort_order} onChange={e=>update('sort_order',e.target.value)}/></label>
      <p className="text-sm text-muted-foreground">Use the client’s own words. Get renewed permission for wording changes. Unpublishing stops future use here; it does not remove posts already shared elsewhere.</p>
      <div className="flex gap-3"><Button disabled={busy}>Save choices</Button><Button type="button" variant="outline" onClick={()=>setEdit(null)}>Cancel</Button></div>
    </form>}
    <div className="space-y-3">{rows.length===0&&<p>No feedback yet. Add a testimonial or create a private link.</p>}{rows.map(t=><article key={t.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
      <p className="text-sm text-muted-foreground">{t.request_pending?'Awaiting submission':t.approved_for_use&&t.consent_to_publish?(t.featured_homepage?'Published · Homepage':'Approved for sharing'):'Private · Awaiting review'}</p>
      <p className="whitespace-pre-wrap">{t.quote}</p><p className="font-medium">{t.client_name||'Anonymous'}</p>
      {!t.request_pending&&<Button variant="outline" onClick={()=>setEdit({...empty,...t})}>Review and choose sharing</Button>}
      {t.request_pending&&t.access_token&&<Button variant="outline" onClick={()=>setLink('https://iroxannestudio.com/feedback?id='+encodeURIComponent(t.id)+'&t='+encodeURIComponent(t.access_token))}>Show private link</Button>}
    </article>)}</div>
  </div>;
}
