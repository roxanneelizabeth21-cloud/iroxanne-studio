import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Receipt, Plus, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useConfirmDelete } from '@/components/admin/ConfirmDeleteDialog';
import { deleteProjectChain, chainSummary } from '@/lib/projectChain';
const money = n => Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const methods = ['square','stripe','zelle','cashapp','venmo','paypal','cash','check','transfer','other'];
export default function InvoicesAdminPage() {
  const { toast } = useToast();
  const [invoices,setInvoices] = useState([]);
  const [payments,setPayments] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState({});
  const [sending,setSending] = useState(null);
  const [busy,setBusy] = useState(false);
  const inFlight = useRef(false);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [i,p] = await Promise.all([base44.entities.Invoice.list('-created_date',100),base44.entities.Payment.list('-created_date',1000)]);
      setInvoices(i); setPayments(p);
    } catch(e) { setError(e.message || 'Could not load invoices.'); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);
  const remaining = (i,k) => k==='deposit'
    ? (['paid','waived'].includes(i.deposit_status) ? 0 : Math.max(0,Number(i.deposit_amount||0)-Number(i.deposit_paid_amount||0)))
    : (i.balance_status==='waived' || i.balance_status==='paid' ? 0 : Math.max(0,Number(i.balance_amount||0)-Number(i.balance_paid_amount||0)));
  // Unpaid milestones, kept with their original index so the backend can mark
  // the right one paid.
  const openMilestones = i => (Array.isArray(i?.milestones)?i.milestones:[])
    .map((m,idx)=>({...m,idx})).filter(m=>m.status!=='paid');
  const stageAmount = (i,kind,idx) => {
    if(kind==='milestone'){ const m=(i?.milestones||[])[idx]; return m?Number(m.amount||0):0; }
    return remaining(i,kind);
  };
  const openPayment = i => {
    const ms = openMilestones(i);
    const kind = remaining(i,'deposit')>0 ? 'deposit' : ms.length ? 'milestone' : 'balance';
    const milestone_index = kind==='milestone' ? ms[0].idx : '';
    setEditing(i);
    setForm({kind,milestone_index,amount:stageAmount(i,kind,milestone_index),method:'transfer',reference:'',request_id:crypto.randomUUID(),notify_client:false});
  };
  const save = async e => {
    e.preventDefault();
    if(inFlight.current) return;
    inFlight.current=true; setBusy(true);
    try {
      const res=await base44.functions.invoke('recordPayment',{invoice_id:editing.id,...form,amount:Number(form.amount)});
      const data=res.data || res;
      if(data.error) throw new Error(data.error);
      toast({title:'Payment recorded',description:data.receipt_sent?'Receipt emailed to the client.':'Payment history and balance updated.'});
      setEditing(null); await load();
    } catch(e) {toast({title:'Could not record payment',description:e.message,variant:'destructive'});}
    finally {inFlight.current=false;setBusy(false);}
  };
  const send = async () => {
    if(inFlight.current) return;
    inFlight.current=true;setBusy(true);
    try{
      const res=await base44.functions.invoke('sendInvoice',{invoice_id:sending.invoice.id,which:sending.which});
      const data=res.data || res;
      if(data.error || !data.sent) throw new Error(data.error || 'Email was not sent. Please try again.');
      toast({title:'Payment request sent',description:sending.invoice.client_email});
      setSending(null); await load();
    }catch(e){toast({title:'Could not send request',description:e.message,variant:'destructive'});}
    finally{inFlight.current=false;setBusy(false);}
  };
  const { confirm: confirmDelete, dialog: confirmDialog } = useConfirmDelete();
  const removeInvoice = async i => {
    const ok = await confirmDelete({
      title: 'Delete this invoice?',
      description: `The invoice for "${i.project_title}" will be permanently removed, along with any payments recorded against it. This cannot be undone.`,
    });
    if(!ok)return;
    try{const counts=await deleteProjectChain('invoice',i.id);toast({title:'Invoice deleted',description:chainSummary(counts)});await load();}
    catch(e){toast({title:'Delete failed',description:e.message,variant:'destructive'});}
  };
  const removePayment = async p => {
    const ok = await confirmDelete({
      title: 'Delete this payment?',
      description: `This ${p.kind} payment of ${money(p.amount)} will be permanently removed. This cannot be undone.`,
    });
    if(!ok)return;
    try{const counts=await deleteProjectChain('payment',p.id);toast({title:'Payment deleted',description:chainSummary(counts)});await load();}
    catch(e){toast({title:'Delete failed',description:e.message,variant:'destructive'});}
  };
  return <div className="space-y-6">
    <div><h1 className="font-display text-3xl font-semibold flex items-center gap-2"><Receipt className="h-6 w-6 text-primary"/>Invoices & Payments</h1>
    <p className="text-sm text-muted-foreground mt-2">Track deposits and balances for every signed project. Record payments after you receive them.</p></div>
    {error && <p role="alert" className="text-destructive">{error} <Button variant="outline" onClick={load}>Retry</Button></p>}
    {loading && <p role="status">Loading invoices…</p>}
    {!loading && !error && !invoices.length && <div className="rounded-2xl bg-card border p-8">Invoices appear here when a client signs their agreement.</div>}
    {invoices.map(i=><section key={i.id} className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">{i.project_title}</h2><p className="text-sm text-muted-foreground">{i.client_name || i.client_email}</p></div><span className="text-sm font-medium text-primary">{i.status?.replaceAll('_',' ')}</span></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><p className="text-xs text-muted-foreground">Project total</p><p className="font-semibold">{money(i.amount_total)}</p></div>
        <div><p className="text-xs text-muted-foreground">Deposit remaining</p><p className="font-semibold">{money(remaining(i,'deposit'))}</p><p className="text-xs">{i.deposit_status}</p></div>
        <div><p className="text-xs text-muted-foreground">Balance remaining</p><p className="font-semibold">{money(remaining(i,'balance'))}</p><p className="text-xs">{i.balance_status}</p></div>
        <div><p className="text-xs text-muted-foreground">Due date</p><p>{i.due_date || 'Per agreement'}</p></div>
      </div>
      {i.status!=='cancelled' && <div className="flex flex-wrap gap-2">
        {(remaining(i,'deposit')+remaining(i,'balance'))>0 && <Button onClick={()=>openPayment(i)} className="gap-1"><Plus className="h-4 w-4"/>Record payment</Button>}
        {remaining(i,'deposit')>0 && <Button variant="outline" onClick={()=>setSending({invoice:i,which:'deposit'})} className="gap-1"><Send className="h-4 w-4"/>Request deposit</Button>}
        {remaining(i,'balance')>0 && <Button variant="outline" onClick={()=>setSending({invoice:i,which:'balance'})}>Request balance</Button>}
        <Button variant="outline" onClick={()=>setSending({invoice:i,which:'statement'})}>Email statement</Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" title="Delete invoice" onClick={()=>removeInvoice(i)}><Trash2 className="h-4 w-4"/></Button>
      </div>}
      <details className="text-sm"><summary className="cursor-pointer font-medium">Payment history</summary><div className="space-y-2 mt-3">
        {payments.filter(p=>p.invoice_id===i.id).map(p=><div key={p.id} className="flex flex-wrap justify-between gap-2 border-t pt-2 items-center"><span>{new Date(p.paid_at || p.created_date).toLocaleDateString()} · {p.kind} · {p.method}{p.reference?' · '+p.reference:''}</span><span className="flex items-center gap-1"><strong>{money(p.amount)}</strong><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete payment" onClick={()=>removePayment(p)}><Trash2 className="h-3.5 w-3.5"/></Button></span></div>)}
        {!payments.some(p=>p.invoice_id===i.id) && <p className="text-muted-foreground">No detailed payments recorded. Earlier manual paid statuses are retained.</p>}
      </div></details>
    </section>)}
    <p className="text-xs text-muted-foreground">Clients can pay deposits, milestones, and balances online via Stripe. Use “Request deposit / balance” to email them a pay link, or share the invoice link directly.</p>
    {confirmDialog}
    <Dialog open={!!editing} onOpenChange={o=>!busy&&!o&&setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Record received payment</DialogTitle><DialogDescription>{editing?.project_title} — enter money you have already received.</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div><Label htmlFor="payment-kind">Payment stage</Label><select id="payment-kind" className="w-full border rounded-md p-2 bg-background" value={form.kind} onChange={e=>{const k=e.target.value;const ms=openMilestones(editing);const idx=k==='milestone'?(ms[0]?.idx ?? ''):'';setForm({...form,kind:k,milestone_index:idx,amount:stageAmount(editing,k,idx)});}}><option value="deposit">Deposit</option><option value="balance">Balance</option>{!!openMilestones(editing).length&&<option value="milestone">Milestone</option>}</select></div>
        {form.kind==='milestone'&&<div><Label htmlFor="payment-milestone">Which milestone</Label><select id="payment-milestone" className="w-full border rounded-md p-2 bg-background" value={form.milestone_index} onChange={e=>{const idx=e.target.value;setForm({...form,milestone_index:idx,amount:stageAmount(editing,'milestone',idx)});}}>{openMilestones(editing).map(m=><option key={m.idx} value={m.idx}>{m.label} — {money(m.amount)}{m.due_date?' (due '+m.due_date+')':''}</option>)}</select></div>}
        <div><Label htmlFor="payment-amount">Amount received ($)</Label><Input id="payment-amount" type="number" min="0.01" step="0.01" required max={editing?stageAmount(editing,form.kind,form.milestone_index):undefined} value={form.amount ?? ''} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
        <div><Label htmlFor="payment-method">Payment method</Label><select id="payment-method" className="w-full border rounded-md p-2 bg-background" value={form.method} onChange={e=>setForm({...form,method:e.target.value})}>{methods.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
        <div><Label htmlFor="payment-reference">Receipt or reference number</Label><Input id="payment-reference" value={form.reference||''} onChange={e=>setForm({...form,reference:e.target.value})}/></div>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!form.notify_client} onChange={e=>setForm({...form,notify_client:e.target.checked})}/>Email the client a receipt</label>
        <Button type="submit" disabled={busy}>{busy?'Saving…':'Save payment'}</Button>
      </form>
    </DialogContent></Dialog>
    <Dialog open={!!sending} onOpenChange={o=>!busy&&!o&&setSending(null)}><DialogContent><DialogHeader><DialogTitle>Send {sending?.which==='statement'?'statement':sending?.which+' request'}</DialogTitle><DialogDescription>This emails {sending?.invoice.client_email} the current amount and your saved payment instructions.</DialogDescription></DialogHeader><Button onClick={send} disabled={busy}>{busy?'Sending…':'Send email'}</Button></DialogContent></Dialog>
  </div>;
}