import { MoreActions } from '@/components/admin/WorkflowSection';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { INTAKE_LABELS, readableIntake } from '@/lib/intakeJourney';
import { useConfirmDelete } from '@/components/admin/ConfirmDeleteDialog';
import { deleteProjectChain, chainSummary } from '@/lib/projectChain';

export default function IntakeManager() {
  const [params] = useSearchParams();
  const contractFilter = params.get('contract');
  const [rows,setRows]=useState([]);
  const [contracts,setContracts]=useState([]);
  const [filter,setFilter]=useState('all');
  const [selected,setSelected]=useState(null);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);
  const [pendingSend,setPendingSend]=useState(null);
  const load=async()=>{
    setLoading(true);
    try {
      const [items,agreements]=await Promise.all([base44.entities.ClientIntake.list('-created_date',500),base44.entities.Contract.list('-created_date',500)]);
      setRows(items);setContracts(agreements);setError('');
    } catch {setError('Could not load intakes. Please retry.');} finally {setLoading(false);}
  };
  useEffect(()=>{load();},[]);
  const send=async c=>{
    setBusy(c.id);
    try {
      const res=await base44.functions.invoke('sendIntakeForm',{contract_id:c.id});
      if(res.data.error)throw new Error(res.data.error);
      toast[res.data.sent?'success':'error'](res.data.sent?'Intake email sent.':'Email was not sent. Please retry.');
      await load();
    }catch(e){toast.error(e.message||'Could not send intake.');}
    finally{setBusy('');}
  };
  const askSend=(contractId,name,email)=>setPendingSend({id:contractId,name,email});
  const confirmSend=async()=>{
    const c=pendingSend;setPendingSend(null);
    if(editing&&editing.row.contract_id===c.id){const ok=await saveEdit(true);if(!ok)return;setEditing(null);}
    await send({id:c.id});
  };
  const prepare=async c=>{
    setBusy(c.id);
    try{
      const res=await base44.functions.invoke('sendIntakeForm',{contract_id:c.id,mode:'prepare'});
      if(res.data.error)throw new Error(res.data.error);
      await load();openEdit(res.data.intake);
    }catch(e){toast.error(e.message||'Could not set up the checklist.');}
    finally{setBusy('');}
  };
  const openEdit=row=>setEditing({row,requests:(row.requests||[]).map(r=>({...r})),note:row.request_note||''});
  const saveEdit=async(quiet)=>{
    try{
      await base44.entities.ClientIntake.update(editing.row.id,{requests:editing.requests.filter(r=>r.label?.trim()),request_note:editing.note});
      if(quiet!==true)toast.success('Checklist saved. Nothing has been sent.');
      await load();return true;
    }catch{toast.error('Could not save the checklist.');return false;}
  };
  const setItem=(i,k,v)=>setEditing(e=>({...e,requests:e.requests.map((r,j)=>j===i?{...r,[k]:v}:r)}));
  const addItem=()=>setEditing(e=>({...e,requests:[...e.requests,{id:'custom_'+Date.now(),label:'',help:'',kind:'text',required:false,answer:'',file_urls:[]}]}));
  const removeItem=i=>setEditing(e=>({...e,requests:e.requests.filter((_,j)=>j!==i)}));
  const skip=async r=>{
    setBusy(r.id);
    try{await base44.entities.ClientIntake.update(r.id,{status:'skipped'});await load();toast.success('Intake skipped. The project moves on.');}
    catch{toast.error('Could not skip the intake.');}finally{setBusy('');}
  };
  const copy=async row=>{
    try{await navigator.clipboard.writeText('https://iroxannestudio.com/intake/'+row.id+'?t='+row.access_token);toast.success('Private link copied.');}
    catch{toast.error('Could not copy the link. Please try again.');}
  };
  const review=async()=>{
    setBusy(selected.id);
    try{await base44.entities.ClientIntake.update(selected.id,{status:'reviewed',reviewed_at:new Date().toISOString()});await load();setSelected(null);toast.success('Marked reviewed.');}
    catch{toast.error('Could not update the intake.');}finally{setBusy('');}
  };
  const { confirm: confirmDelete, dialog: confirmDialog } = useConfirmDelete();
  const remove=async r=>{
    const ok=await confirmDelete({
      title:'Delete this intake?',
      description:`The intake for "${r.project_title||r.client_name}" will be permanently removed. This cannot be undone.`,
    });
    if(!ok)return;
    try{const counts=await deleteProjectChain('intake',r.id);toast.success('Intake deleted.'+(chainSummary(counts)?' '+chainSummary(counts):''));await load();}
    catch{toast.error('Could not delete the intake.');}
  };
  const waiting=contracts.filter(c=>['signed','deposit_paid','active'].includes(c.status)&&(!contractFilter||c.id===contractFilter)&&!rows.some(i=>i.contract_id===c.id));
  const orphaned=rows.filter(r=>!r.is_test_record&&(!r.contract_id||!contracts.some(c=>c.id===r.contract_id)));
  return <section className="space-y-5">
    <div><h2 className="font-display text-2xl">Project intakes</h2><p className="text-sm text-muted-foreground mt-2">Set up a short checklist of what you need from the client, edit it after you talk with them, then send it. Nothing is emailed until you confirm.</p></div>
    {orphaned.length>0&&<p role="alert" className="rounded-xl border border-amber-400 p-3 text-sm">{orphaned.length} intake record(s) need an agreement link reviewed. Their responses are preserved; do not resend them until their project is identified.</p>}
    {error&&<p role="alert">{error} <Button variant="outline" onClick={load}>Retry</Button></p>}
    <nav aria-label="Filter intakes" className="flex gap-2 flex-wrap">{[['all','All'],['sent','Sent'],['in_progress','In progress'],['submitted','Ready to review'],['reviewed','Reviewed'],['skipped','Skipped']].map(([key,label])=><Button key={key} size="sm" variant={filter===key?'default':'outline'} onClick={()=>setFilter(key)} aria-pressed={filter===key}>{label}</Button>)}</nav>
    {rows.filter(r=>(!contractFilter||r.contract_id===contractFilter)&&(filter==='all'||r.status===filter)).map(r=><article key={r.id} className="rounded-2xl bg-card border border-border p-5 flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-semibold">{r.project_title||r.client_name}</h3><p className="text-sm text-muted-foreground">{r.client_name} · {INTAKE_LABELS[r.status]||r.status}{r.is_test_record?' · Test record':''}</p></div><div className="flex gap-2 flex-wrap">{Array.isArray(r.requests)&&!['submitted','reviewed','skipped'].includes(r.status)&&<Button variant="outline" onClick={()=>openEdit(r)}>Edit what I'm asking for</Button>}<Button onClick={()=>setSelected(r)}>{r.status==='submitted'?'Review responses':'View responses'}</Button><MoreActions><Button variant="outline" onClick={()=>copy(r)}>Copy private link</Button>{!r.is_test_record&&r.contract_id&&!orphaned.some(o=>o.id===r.id)&&!['submitted','reviewed'].includes(r.status)&&<Button disabled={!!busy} variant="outline" onClick={()=>askSend(r.contract_id,r.client_name,r.client_email)}>{r.sent_at?'Resend email':'Send email'}</Button>}{!['submitted','reviewed','skipped'].includes(r.status)&&<Button variant="outline" disabled={!!busy} onClick={()=>skip(r)}>Skip intake</Button>}<Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" title="Delete" onClick={()=>remove(r)}><Trash2 className="h-4 w-4"/></Button></MoreActions></div></article>)}
    {loading && <p role="status">Loading intakes…</p>}
    {!loading&&!error&&rows.length>0&&!rows.some(r=>(!contractFilter||r.contract_id===contractFilter)&&(filter==='all'||r.status===filter))&&<p>No intakes in this view. Choose another filter to continue.</p>}
    {!loading&&!rows.length&&!error&&<p className="text-sm text-muted-foreground">No intakes yet. Choose a project below to send the first one.</p>}
    {filter==='all'&&waiting.length>0&&<div className="space-y-3"><h3 className="font-semibold">Ready to send an intake?</h3>{waiting.map(c=><div key={c.id} className="rounded-xl border border-border p-4 flex items-center justify-between gap-3"><div><p>{c.project_title||c.client_name}</p><p className="text-sm text-muted-foreground">{c.client_name}</p></div><Button disabled={!!busy||!c.client_email} onClick={()=>prepare(c)}>{busy===c.id?'Setting up…':'Set up intake'}</Button></div>)}</div>}
    {confirmDialog}
    <Dialog open={!!pendingSend} onOpenChange={o=>!o&&setPendingSend(null)}><DialogContent><DialogHeader><DialogTitle>Send this to the client?</DialogTitle></DialogHeader><p className="text-sm">This emails the checklist to <strong>{pendingSend?.name||'the client'}</strong>{pendingSend?.email?' ('+pendingSend.email+')':''}. Make sure the list is what you want to ask for.</p><div className="flex gap-2 justify-end"><Button variant="outline" onClick={()=>setPendingSend(null)}>Not yet</Button><Button onClick={confirmSend}>Yes, send it</Button></div></DialogContent></Dialog>
    <Dialog open={!!editing} onOpenChange={o=>!o&&setEditing(null)}><DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>What I'm asking {editing?.row.client_name||'the client'} for</DialogTitle></DialogHeader>{editing&&<div className="space-y-4">
      <p className="text-sm text-muted-foreground">Add, change or remove anything after you've talked with them. Answers already known from the quote are pre-filled and the client only confirms them.</p>
      <label className="block text-sm font-medium">Personal note shown at the top (optional)<textarea className="mt-1 w-full rounded-md border border-border p-2 text-sm bg-background" rows={2} value={editing.note} onChange={e=>setEditing({...editing,note:e.target.value})}/></label>
      {editing.requests.map((r,i)=><div key={r.id} className="rounded-xl border border-border p-3 space-y-2">
        <input className="w-full rounded-md border border-border p-2 text-sm bg-background" placeholder="What do you need?" value={r.label} onChange={e=>setItem(i,'label',e.target.value)}/>
        <input className="w-full rounded-md border border-border p-2 text-sm bg-background" placeholder="Short help text (optional)" value={r.help||''} onChange={e=>setItem(i,'help',e.target.value)}/>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <select className="rounded-md border border-border p-1 bg-background" value={r.kind} onChange={e=>setItem(i,'kind',e.target.value)}><option value="text">Written answer</option><option value="file">File upload</option></select>
          <label className="flex items-center gap-1"><input type="checkbox" checked={!!r.required} onChange={e=>setItem(i,'required',e.target.checked)}/>Required</label>
          <input className="flex-1 min-w-[160px] rounded-md border border-border p-1 text-sm bg-background" placeholder="Pre-filled answer (optional)" value={r.answer||''} onChange={e=>setItem(i,'answer',e.target.value)}/>
          <Button variant="ghost" size="icon" className="text-destructive" title="Remove" onClick={()=>removeItem(i)}><Trash2 className="h-4 w-4"/></Button>
        </div>
      </div>)}
      <div className="flex flex-wrap gap-2 justify-between"><Button variant="outline" onClick={addItem}>+ Add a request</Button><div className="flex gap-2"><Button variant="outline" onClick={()=>saveEdit()}>Save (don't send)</Button><Button disabled={!editing.row.client_email} onClick={()=>askSend(editing.row.contract_id,editing.row.client_name,editing.row.client_email)}>Save and send…</Button></div></div>
    </div>}</DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={o=>!o&&setSelected(null)}><DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{selected?.project_title||'Project intake'}</DialogTitle></DialogHeader>{selected&&<><p className="text-sm text-muted-foreground">{selected.client_name} · {INTAKE_LABELS[selected.status]}</p>{Array.isArray(selected.requests)&&selected.requests.map(r=><div key={r.id} className="border-b border-border py-3"><h3 className="font-medium">{r.label}</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-1">{r.answer||'No answer'}</p>{(r.file_urls||[]).map((u,i)=><a key={i} href={u} target="_blank" rel="noreferrer" className="block text-sm underline">File {i+1}</a>)}</div>)}{Object.entries(selected).filter(([k,v])=>!['requests','request_note','sent_at','submitted_at','reviewed_at','id','access_token','created_by','created_by_id','contract_id','lead_id','admin_notes','client_name','project_title','status','created_date','updated_date','is_test_record'].includes(k)&&readableIntake(v)).map(([k,v])=><div key={k} className="border-b border-border py-3"><h3 className="font-medium capitalize">{k.replaceAll('_',' ')}</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-1">{readableIntake(v)}</p></div>)}{selected.status==='submitted'&&<Button disabled={!!busy} onClick={review}>Mark reviewed</Button>}</>}</DialogContent></Dialog>
  </section>;
}