import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { INTAKE_LABELS, readableIntake } from '@/lib/intakeJourney';

export default function IntakeManager() {
  const [rows,setRows]=useState([]);
  const [contracts,setContracts]=useState([]);
  const [filter,setFilter]=useState('all');
  const [selected,setSelected]=useState(null);
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const load=async()=>{
    try {
      const [items,agreements]=await Promise.all([base44.entities.ClientIntake.list('-created_date',500),base44.entities.Contract.list('-created_date',500)]);
      setRows(items);setContracts(agreements);setError('');
    } catch {setError('Could not load intakes. Please retry.');}
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
  const copy=async row=>{
    try{await navigator.clipboard.writeText('https://iroxannestudio.com/intake/'+row.id+'?t='+row.access_token);toast.success('Private link copied.');}
    catch{toast.error('Could not copy the link. Please try again.');}
  };
  const review=async()=>{
    setBusy(selected.id);
    try{await base44.entities.ClientIntake.update(selected.id,{status:'reviewed',reviewed_at:new Date().toISOString()});await load();setSelected(null);toast.success('Marked reviewed.');}
    catch{toast.error('Could not update the intake.');}finally{setBusy('');}
  };
  const waiting=contracts.filter(c=>c.status!=='cancelled'&&!rows.some(i=>i.contract_id===c.id));
  return <section className="space-y-5">
    <div><h2 className="font-display text-2xl">Project intakes</h2><p className="text-sm text-muted-foreground mt-2">Send a guided intake when you’re ready to explore the details. Responses stay linked to the agreement.</p></div>
    {error&&<p role="alert">{error} <Button variant="outline" onClick={load}>Retry</Button></p>}
    <nav aria-label="Filter intakes" className="flex gap-2 flex-wrap">{[['all','All'],['sent','Sent'],['in_progress','In progress'],['submitted','Completed'],['reviewed','Reviewed']].map(([key,label])=><Button key={key} size="sm" variant={filter===key?'default':'outline'} onClick={()=>setFilter(key)} aria-pressed={filter===key}>{label}</Button>)}</nav>
    {rows.filter(r=>filter==='all'||r.status===filter).map(r=><article key={r.id} className="rounded-2xl bg-card border border-border p-5 flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-semibold">{r.project_title||r.client_name}</h3><p className="text-sm text-muted-foreground">{r.client_name} · {INTAKE_LABELS[r.status]||r.status}</p></div><div className="flex gap-2 flex-wrap"><Button variant="outline" onClick={()=>copy(r)}>Copy private link</Button>{!['submitted','reviewed'].includes(r.status)&&<Button disabled={!!busy} variant="outline" onClick={()=>send({id:r.contract_id})}>Resend email</Button>}<Button onClick={()=>setSelected(r)}>View responses</Button></div></article>)}
    {!rows.length&&!error&&<p className="text-sm text-muted-foreground">No intakes yet. Choose a project below to send the first one.</p>}
    {filter==='all'&&waiting.length>0&&<div className="space-y-3"><h3 className="font-semibold">Ready to send an intake?</h3>{waiting.map(c=><div key={c.id} className="rounded-xl border border-border p-4 flex items-center justify-between gap-3"><div><p>{c.project_title||c.client_name}</p><p className="text-sm text-muted-foreground">{c.client_name}</p></div><Button disabled={!!busy||!c.client_email} onClick={()=>send(c)}>{busy===c.id?'Sending…':'Send intake'}</Button></div>)}</div>}
    <Dialog open={!!selected} onOpenChange={o=>!o&&setSelected(null)}><DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{selected?.project_title||'Project intake'}</DialogTitle></DialogHeader>{selected&&<><p className="text-sm text-muted-foreground">{selected.client_name} · {INTAKE_LABELS[selected.status]}</p>{Object.entries(selected).filter(([k,v])=>!['id','access_token','created_by','created_by_id','contract_id','lead_id','admin_notes'].includes(k)&&readableIntake(v)).map(([k,v])=><div key={k} className="border-b border-border py-3"><h3 className="font-medium capitalize">{k.replaceAll('_',' ')}</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-1">{readableIntake(v)}</p></div>)}{selected.status==='submitted'&&<Button disabled={!!busy} onClick={review}>Mark reviewed</Button>}</>}</DialogContent></Dialog>
  </section>;
}
