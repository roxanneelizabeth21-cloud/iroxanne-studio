import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Receipt, Plus, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useConfirmDelete } from '@/components/admin/ConfirmDeleteDialog';
import { deleteProjectChain, chainSummary } from '@/lib/projectChain';
import PaymentPlanDisplay from '@/components/PaymentPlanDisplay';
const money = n => Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const methods = ['square','zelle','cashapp','venmo','paypal','cash','check','transfer','other'];

const statusBadge = status => {
  if (!status) return 'irx-badge';
  const s = status.replace(/_/g, ' ');
  if (s === 'paid' || s === 'completed') return 'irx-badge irx-accent-green';
  if (s === 'partial' || s === 'deposit paid') return 'irx-badge irx-accent-gold';
  if (s === 'overdue' || s === 'cancelled') return 'irx-badge irx-accent-rose';
  return 'irx-badge';
};

export default function InvoicesAdminPage() {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const contractFilter=params.get('contract');
  const [invoices,setInvoices] = useState([]);
  const [payments,setPayments] = useState([]);
  const [agreements,setAgreements] = useState([]);
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
      const [i,p,c] = await Promise.all([
        base44.entities.Invoice.list('-created_date',100),
        base44.entities.Payment.list('-created_date',1000),
        base44.entities.Contract.list('-created_date',500),
      ]);
      setInvoices(i); setPayments(p); setAgreements(c);
    } catch(e) { setError(e.message || 'Could not load invoices.'); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);
  const prepareInvoice=async contract=>{
    if(inFlight.current)return;
    inFlight.current=true;setBusy(true);
    try {
      const res=await base44.functions.invoke('repairContractInvoice',{contract_id:contract.id});
      if(res.data?.error)throw new Error(res.data.error);
      toast({title:'Invoice prepared',description:'No email was sent and no payment was charged.'});
      await load();
    } catch(e){toast({title:'Invoice needs review',description:e.response?.data?.error||e.message,variant:'destructive'});}
    finally{inFlight.current=false;setBusy(false);}
  };
  const missingInvoices=agreements.filter(c=>['signed','deposit_paid','active','completed'].includes(c.status)&&(!contractFilter||c.id===contractFilter)&&!invoices.some(i=>i.contract_id===c.id));
  const remaining = (i,k) => k==='deposit'
    ? (['paid','waived'].includes(i.deposit_status) ? 0 : Math.max(0,Number(i.deposit_amount||0)-Number(i.deposit_paid_amount||0)))
    : (i.balance_status==='waived' || i.balance_status==='paid' ? 0 : Math.max(0,Number(i.balance_amount||0)-Number(i.balance_paid_amount||0)));
  const openMilestones = i => (Array.isArray(i?.milestones)?i.milestones:[])
    .map((m,idx)=>({...m,idx})).filter(m=>m.status!=='paid');
  const stageAmount = (i,kind,idx) => {
    if(kind==='milestone'){ const m=(i?.milestones||[])[idx]; return m?Math.max(0,Number(m.amount||0)-payments.filter(p=>p.invoice_id===i.id&&p.kind==='milestone'&&p.milestone_index===Number(idx)).reduce((sum,p)=>sum+Number(p.amount||0),0)):0; }
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
      toast({title:data.square_schedule?'Square payment plan ready':'Payment request sent',description:data.square_schedule?'The plan is published in Square. Existing plans are refreshed without emailing again.':sending.invoice.client_email});
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

  const filteredInvoices = invoices.filter(i => !contractFilter || i.contract_id === contractFilter);

  // Stats
  const totalOwed = filteredInvoices.reduce((s, i) => s + remaining(i, 'deposit') + remaining(i, 'balance'), 0);
  const totalPaid = filteredInvoices.reduce((s, i) => s + Number(i.deposit_paid_amount || 0) + Number(i.balance_paid_amount || 0), 0);
  const totalValue = filteredInvoices.reduce((s, i) => s + Number(i.amount_total || 0), 0);
  const overdueCount = filteredInvoices.filter(i => i.due_date && new Date(i.due_date) < new Date() && remaining(i, 'deposit') + remaining(i, 'balance') > 0).length;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
    <div className="irx-page-header">
      <div className="irx-eyebrow">Business Manager</div>
      <h1>Invoices</h1>
      <p>Track payments, deposits, and project billing.</p>
    </div>

    {error && <p role="alert" style={{ color: 'var(--destructive, #e5484d)' }}>{error} <Button variant="outline" onClick={load}>Retry</Button></p>}

    {/* Summary stats */}
    {!loading && !error && filteredInvoices.length > 0 && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        <div className="irx-stat">
          <span style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Total value</span>
          <span className="irx-stat-number">{money(totalValue)}</span>
        </div>
        <div className="irx-stat">
          <span style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Collected</span>
          <span className="irx-stat-number">{money(totalPaid)}</span>
        </div>
        <div className="irx-stat">
          <span style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Outstanding</span>
          <span className="irx-stat-number">{money(totalOwed)}</span>
        </div>
        <div className="irx-stat">
          <span style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Overdue</span>
          <span className="irx-stat-number">{overdueCount}</span>
        </div>
      </div>
    )}

    {/* Missing invoice warnings */}
    {!loading && !error && missingInvoices.map(c => (
      <section key={c.id} className="irx-card" style={{ borderLeft: '3px solid var(--accent-gold, #f5a623)' }}>
        <p>{c.project_title} — signed agreement has no invoice.</p>
        <Button disabled={busy} style={{ marginTop: '8px' }} onClick={() => prepareInvoice(c)}>Prepare missing invoice</Button>
      </section>
    ))}

    {loading && <p role="status">Loading invoices…</p>}

    {!loading && !error && !invoices.length && (
      <div className="irx-empty">Invoices appear here when a client signs their agreement.</div>
    )}

    {contractFilter && (
      <p style={{ fontSize: '13px' }}>Showing invoices for this agreement. <Link style={{ textDecoration: 'underline' }} to="/admin/invoices">Show all invoices</Link></p>
    )}

    {/* Invoice list */}
    <div className="irx-list">
      {filteredInvoices.map(i => (
        <section key={i.id} className="irx-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '18px', fontWeight: 600 }}>{i.project_title}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary, #66736e)' }}>{i.client_name || i.client_email}</p>
            </div>
            <span className={statusBadge(i.status)}>{i.status?.replaceAll('_', ' ')}</span>
          </div>

          <p className="text-sm">{i.status === 'cancelled' ? 'This invoice is cancelled.' : 'Open this invoice to review amounts and choose a payment action.'}</p>
          {i.square_sync_error && <p role="alert" className="text-sm text-destructive">Payment sync needs attention. Open the invoice for details.</p>}
          <details className="irx-workflow-section" open={!!contractFilter}><summary>Review invoice & payment options</summary><div className="space-y-4 pt-4">
          {/* Financials grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Project total</p>
              <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{money(i.amount_total)}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Deposit remaining</p>
              <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{money(remaining(i, 'deposit'))}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)' }}>{i.deposit_status}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Balance remaining</p>
              <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{money(remaining(i, 'balance'))}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)' }}>{i.balance_status}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Due date</p>
              <p>{i.due_date || 'Per agreement'}</p>
            </div>
          </div>

          {/* Payment plan (Square integration) */}
          {i.payment_installments?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <PaymentPlanDisplay invoice={i} />
              {i.square_sync_error && <p role="alert" style={{ color: 'var(--destructive, #e5484d)', fontSize: '13px' }}>{i.square_sync_error}</p>}
              {i.status !== 'cancelled' && <Button disabled={busy} onClick={() => setSending({ invoice: i, which: 'statement' })}>{i.square_invoice_id ? 'Refresh Square plan' : 'Send payment plan'}</Button>}
              {i.square_public_url && <Button variant="outline" asChild><a href={i.square_public_url} target="_blank" rel="noopener noreferrer">View Square invoice</a></Button>}
              <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)' }}>Record offline payments, refunds, and cancellations on this invoice in Square. Payment status syncs here automatically. New schedules are set in the proposal or agreement before signing.</p>
            </div>
          )}

          {/* Action buttons (non-installment invoices) */}
          {!i.payment_installments?.length && i.status !== 'cancelled' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(remaining(i, 'deposit') + remaining(i, 'balance')) > 0 && <Button onClick={() => openPayment(i)} className="gap-1"><Plus className="h-4 w-4" />Record payment</Button>}
              {remaining(i, 'deposit') > 0 && <Button variant="outline" onClick={() => setSending({ invoice: i, which: 'deposit' })} className="gap-1"><Send className="h-4 w-4" />Request deposit</Button>}
              {remaining(i, 'balance') > 0 && <Button variant="outline" onClick={() => setSending({ invoice: i, which: 'balance' })}>Request balance</Button>}
              <Button variant="outline" onClick={() => setSending({ invoice: i, which: 'statement' })}>Email statement</Button>
              <Button variant="ghost" size="icon" style={{ height: '36px', width: '36px', color: 'var(--destructive, #e5484d)' }} title="Delete invoice" onClick={() => removeInvoice(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          )}

          {/* Payment history */}
          {!i.payment_installments?.length && (
            <details style={{ fontSize: '13px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500 }}>Payment history</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {payments.filter(p => p.invoice_id === i.id).map(p => (
                  <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--border, #e5e7eb)', paddingTop: '8px', alignItems: 'center' }}>
                    <span>{new Date(p.paid_at || p.created_date).toLocaleDateString()} · {p.kind} · {p.method}{p.reference ? ' · ' + p.reference : ''}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong>{money(p.amount)}</strong>
                      <Button variant="ghost" size="icon" style={{ height: '28px', width: '28px', color: 'var(--destructive, #e5484d)' }} title="Delete payment" onClick={() => removePayment(p)}><Trash2 style={{ height: '14px', width: '14px' }} /></Button>
                    </span>
                  </div>
                ))}
                {!payments.some(p => p.invoice_id === i.id) && <p style={{ color: 'var(--text-secondary, #66736e)' }}>No detailed payments recorded. Earlier manual paid statuses are retained.</p>}
              </div>
            </details>
          )}
          </div></details>
        </section>
      ))}
    </div>

    <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)' }}>Clients can pay deposits, milestones, and balances online via Square. Use "Request deposit / balance" to email them a pay link, or share the invoice link directly.</p>

    {confirmDialog}

    {/* Record Payment Dialog */}
    <Dialog open={!!editing} onOpenChange={o => !busy && !o && setEditing(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record received payment</DialogTitle>
          <DialogDescription>{editing?.project_title} — enter money you have already received.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Label htmlFor="payment-kind">Payment stage</Label>
            <select id="payment-kind" className="w-full border rounded-md p-2 bg-background" value={form.kind} onChange={e => { const k = e.target.value; const ms = openMilestones(editing); const idx = k === 'milestone' ? (ms[0]?.idx ?? '') : ''; setForm({ ...form, kind: k, milestone_index: idx, amount: stageAmount(editing, k, idx) }); }}>
              <option value="deposit">Deposit</option>
              <option value="balance">Balance</option>
              {!!openMilestones(editing).length && <option value="milestone">Milestone</option>}
            </select>
          </div>
          {form.kind === 'milestone' && <div>
            <Label htmlFor="payment-milestone">Which milestone</Label>
            <select id="payment-milestone" className="w-full border rounded-md p-2 bg-background" value={form.milestone_index} onChange={e => { const idx = e.target.value; setForm({ ...form, milestone_index: idx, amount: stageAmount(editing, 'milestone', idx) }); }}>
              {openMilestones(editing).map(m => <option key={m.idx} value={m.idx}>{m.label} — {money(m.amount)}{m.due_date ? ' (due ' + m.due_date + ')' : ''}</option>)}
            </select>
          </div>}
          <div>
            <Label htmlFor="payment-amount">Amount received ($)</Label>
            <Input id="payment-amount" type="number" min="0.01" step="0.01" required max={editing ? stageAmount(editing, form.kind, form.milestone_index) : undefined} value={form.amount ?? ''} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="payment-method">Payment method</Label>
            <select id="payment-method" className="w-full border rounded-md p-2 bg-background" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
              {methods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="payment-reference">Receipt or reference number</Label>
            <Input id="payment-reference" value={form.reference || ''} onChange={e => setForm({ ...form, reference: e.target.value })} />
          </div>
          <label style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <input type="checkbox" checked={!!form.notify_client} onChange={e => setForm({ ...form, notify_client: e.target.checked })} />
            Email the client a receipt
          </label>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save payment'}</Button>
        </form>
      </DialogContent>
    </Dialog>

    {/* Send Invoice Dialog */}
    <Dialog open={!!sending} onOpenChange={o => !busy && !o && setSending(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sending?.invoice.payment_installments?.length ? (sending.invoice.square_invoice_id ? 'Refresh Square plan' : 'Send payment plan') : 'Send ' + (sending?.which === 'statement' ? 'statement' : sending?.which + ' request')}</DialogTitle>
          <DialogDescription>{sending?.invoice.payment_installments?.length ? (sending.invoice.square_invoice_id ? 'Check Square for current payments. This does not send another email.' : 'Square will email ' + sending.invoice.client_email + ' the agreed payment schedule and scheduled reminders. It will not automatically charge a card.') : 'This emails ' + sending?.invoice.client_email + ' the current amount and your saved payment instructions.'}</DialogDescription>
        </DialogHeader>
        <Button onClick={send} disabled={busy}>{busy ? 'Working…' : sending?.invoice.square_invoice_id ? 'Refresh plan' : sending?.invoice.payment_installments?.length ? 'Send plan through Square' : 'Send email'}</Button>
      </DialogContent>
    </Dialog>
  </div>;
}
