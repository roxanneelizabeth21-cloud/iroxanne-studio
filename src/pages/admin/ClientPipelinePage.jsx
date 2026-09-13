import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Workflow, Plus, Send, Copy, Pencil, Loader2, ClipboardList, Receipt, CheckCircle2 } from 'lucide-react';
import Hint, { HintIcon } from '@/components/admin/Hint';
import PipelineRow, { PipelineEmpty } from '@/components/admin/pipeline/PipelineRow';
import ProposalForm from '@/components/admin/ProposalForm';
import ContractForm from '@/components/admin/ContractForm';
import {
  STAGES, leadNextStep, proposalNextStep, contractNextStep,
  invoiceNextStep, intakeNextStep, sortByUrgency,
} from '@/lib/pipelineSteps';

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

export default function ClientPipelinePage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const [leads, setLeads] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [settings, setSettings] = useState(null);

  const [proposalEditing, setProposalEditing] = useState(null);
  const [contractEditing, setContractEditing] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [l, p, c, i, ik, s] = await Promise.all([
        base44.entities.Lead.list('-created_date', 60).catch(() => []),
        base44.entities.Proposal.list('-created_date', 60).catch(() => []),
        base44.entities.Contract.list('-created_date', 60).catch(() => []),
        base44.entities.Invoice.list('-created_date', 60).catch(() => []),
        base44.entities.ClientIntake.list('-created_date', 60).catch(() => []),
        base44.entities.PricingSettings.list().catch(() => []),
      ]);
      setLeads(l); setProposals(p); setContracts(c); setInvoices(i); setIntakes(ik);
      setSettings(s[0] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const invoiceFor = (contractId) => invoices.find((iv) => iv.contract_id === contractId);
  const intakeFor = (contractId) => intakes.find((ik) => ik.contract_id === contractId);

  // Only leads that haven't become a proposal yet belong in the first tab.
  const openLeads = useMemo(() => {
    const claimed = new Set(proposals.map((p) => p.lead_id).filter(Boolean));
    return leads.filter((l) => !claimed.has(l.id) && !['won', 'lost', 'archived'].includes(l.status));
  }, [leads, proposals]);

  // Agreements that still need something from you. Payments tab only shows
  // invoices for signed work, so nothing appears before there's money to collect.
  const liveContracts = useMemo(
    () => contracts.filter((c) => !['cancelled'].includes(c.status)),
    [contracts]
  );
  const activeInvoices = useMemo(() => {
    const signedIds = new Set(
      contracts.filter((c) => ['signed', 'deposit_paid', 'active', 'completed'].includes(c.status)).map((c) => c.id)
    );
    return invoices.filter((iv) => !iv.contract_id || signedIds.has(iv.contract_id));
  }, [invoices, contracts]);
  const sentIntakes = useMemo(() => intakes, [intakes]);

  const counts = {
    requests: openLeads.filter((l) => leadNextStep(l).tone === 'action').length,
    proposals: proposals.filter((p) => proposalNextStep(p).tone === 'action').length,
    agreements: liveContracts.filter((c) => contractNextStep(c, invoiceFor(c.id)).tone === 'action').length,
    money: activeInvoices.filter((iv) => invoiceNextStep(iv).tone === 'action').length,
    intake: sentIntakes.filter((ik) => intakeNextStep(ik).tone === 'action').length,
  };

  // ---- Actions -------------------------------------------------------------

  const startProposalFromLead = (lead) => {
    setProposalEditing({ lead });
  };

  const saveProposal = async (payload) => {
    setSaving(true);
    try {
      if (payload.id) {
        const { id, ...changes } = payload;
        await base44.entities.Proposal.update(id, changes);
        toast({ title: 'Proposal saved' });
        setProposalEditing(null);
      } else {
        await base44.entities.Proposal.create(payload);
        toast({ title: 'Proposal created', description: 'Next: send it to the client.' });
        setProposalEditing(null);
        setTab('proposals');
      }
      await load();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sendProposal = async (p) => {
    setBusy(p.id);
    try {
      const res = await base44.functions.invoke('sendProposal', { proposal_id: p.id });
      const data = res.data || res;
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      await navigator.clipboard.writeText(data.link).catch(() => {});
      toast({
        title: data.sent ? `Emailed to ${p.client_email}` : 'Link copied — email failed',
        description: data.sent ? 'Link copied to your clipboard too.' : 'Paste the link to your client manually.',
      });
      await load();
    } catch (e) {
      toast({ title: 'Failed to send', description: e.message, variant: 'destructive' });
    } finally { setBusy(''); }
  };

  const saveContract = async (payload) => {
    setSaving(true);
    try {
      if (payload.id) {
        const { id, ...changes } = payload;
        await base44.entities.Contract.update(id, changes);
        toast({ title: 'Agreement saved' });
      } else {
        await base44.entities.Contract.create(payload);
        toast({ title: 'Agreement created' });
      }
      setContractEditing(null);
      await load();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const sendContract = async (c) => {
    setBusy(c.id);
    try {
      const token = c.access_token || (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
      const link = `${window.location.origin}/contract/${c.id}?t=${token}`;
      await base44.entities.Contract.update(c.id, {
        status: 'sent', access_token: token, sent_at: new Date().toISOString(),
      });
      await navigator.clipboard.writeText(link).catch(() => {});
      let emailed = false;
      if (c.client_email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: c.client_email,
            subject: `Your project agreement — ${c.project_title || 'iRoxanne Studio'}`,
            html: `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
              <div style="background:#2D2A4A;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
                <span style="font-family:Georgia,serif;font-size:22px;color:#C9A84C;font-weight:600;">iRoxanne Studio</span>
              </div>
              <div style="padding:28px 24px;background:#fff;border:1px solid #ECE6DC;border-top:none;border-radius:0 0 12px 12px;">
                <p style="margin:0 0 14px;font-size:16px;">Hi ${c.client_name?.split(' ')[0] || 'there'},</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Your agreement for <strong>${c.project_title || 'your project'}</strong> is ready to review and sign online.</p>
                <p style="margin:24px 0 12px;"><a href="${link}" style="display:inline-block;background:#2D2A4A;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:50px;">Review &amp; sign agreement</a></p>
                <p style="margin:0;font-size:13px;color:#8B8B85;">This link is private to you — please don't forward it.</p>
              </div>
            </div>`,
          });
          emailed = true;
        } catch { /* fall through to copied link */ }
      }
      toast({
        title: emailed ? 'Sent for signature' : 'Link copied — email failed',
        description: emailed ? `Emailed to ${c.client_email}.` : 'Paste the copied link manually.',
      });
      await load();
    } catch (e) {
      toast({ title: 'Failed to send', description: e.message, variant: 'destructive' });
    } finally { setBusy(''); }
  };

  const createInvoice = async (c) => {
    setBusy(c.id);
    try {
      const total = c.price_total || 0;
      const deposit = c.deposit_amount || 0;
      await base44.entities.Invoice.create({
        contract_id: c.id,
        client_name: c.client_name || '',
        client_email: c.client_email,
        project_title: c.project_title,
        amount_total: total,
        deposit_amount: deposit,
        deposit_status: deposit > 0 ? 'pending' : 'waived',
        balance_amount: Math.max(total - deposit, 0),
        balance_status: total - deposit > 0 ? 'pending' : 'waived',
        status: 'open',
      });
      toast({ title: 'Invoice created', description: 'Next: email the deposit request.' });
      await load();
      setTab('money');
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally { setBusy(''); }
  };

  const emailInvoice = async (inv, which) => {
    setBusy(inv.id);
    try {
      const res = await base44.functions.invoke('sendInvoice', { invoice_id: inv.id, which });
      const data = res.data || res;
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      toast({
        title: data.sent ? `Sent to ${inv.client_email}` : 'Email failed',
        description: data.sent ? `Amount due: ${money(data.amount_due)}` : 'Check your payment settings and try again.',
        variant: data.sent ? undefined : 'destructive',
      });
      await load();
    } catch (e) {
      toast({ title: 'Failed to send', description: e.message, variant: 'destructive' });
    } finally { setBusy(''); }
  };

  const sendIntake = async (c) => {
    setBusy(c.id);
    try {
      const res = await base44.functions.invoke('sendIntakeForm', { contract_id: c.id });
      const data = res.data || res;
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      await navigator.clipboard.writeText(data.link).catch(() => {});
      toast({
        title: data.existing ? 'Already sent — link copied' : `Intake form sent to ${c.client_email}`,
      });
      await load();
      setTab('intake');
    } catch (e) {
      toast({ title: 'Failed to send intake form', description: e.message, variant: 'destructive' });
    } finally { setBusy(''); }
  };

  const completeContract = async (c) => {
    try {
      await base44.entities.Contract.update(c.id, { status: 'completed' });
      toast({ title: 'Marked complete' });
      await load();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Workflow className="h-6 w-6 text-primary" /> Client Pipeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Left to right is the order work flows. Each line tells you the one thing to do next.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-3 md:grid-cols-5">
          {STAGES.map((s, i) => (
            <TabsTrigger key={s.key} value={s.key} className="w-full flex-col gap-0.5 py-2">
              <span className="text-[10px] text-muted-foreground/70">Step {i + 1}</span>
              <span className="flex items-center gap-1.5">
                {s.label}
                {counts[s.key] > 0 && (
                  <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 min-w-[18px]">
                    {counts[s.key]}
                  </span>
                )}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {STAGES.map((s) => (
          <TabsContent key={s.key} value={s.key} className="mt-4">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{s.label}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.blurb}</p>
                </div>
                {s.key === 'proposals' && (
                  <Hint text="Start a proposal from scratch, for a client who didn't come through the quote form.">
                    <Button size="sm" onClick={() => setProposalEditing({ lead: null })} className="gap-1 shrink-0">
                      <Plus className="h-4 w-4" /> New
                    </Button>
                  </Hint>
                )}
                {s.key === 'agreements' && (
                  <Hint text="Write an agreement directly, without a proposal first. Most agreements are created for you when a client accepts their proposal.">
                    <Button size="sm" variant="outline" onClick={() => setContractEditing({ lead: null })} className="gap-1 shrink-0">
                      <Plus className="h-4 w-4" /> New
                    </Button>
                  </Hint>
                )}
              </div>

              {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

              {/* STEP 1 — Quote requests */}
              {!loading && s.key === 'requests' && (
                openLeads.length === 0
                  ? <PipelineEmpty>Nothing waiting. New requests land here from your Get a Quote form.</PipelineEmpty>
                  : sortByUrgency(openLeads, leadNextStep).map((lead) => (
                      <PipelineRow
                        key={lead.id}
                        title={lead.name || lead.email}
                        subtitle={`${lead.business_name ? `${lead.business_name} · ` : ''}${
                          lead.estimated_price_low != null
                            ? `est. ${money(lead.estimated_price_low)}–${money(lead.estimated_price_high)}`
                            : lead.quick_pitch?.slice(0, 60) || ''
                        }`}
                        step={leadNextStep(lead)}
                      >
                        <Hint text="Opens a proposal pre-filled with their name, business and estimated tier.">
                          <Button size="sm" onClick={() => startProposalFromLead(lead)} className="gap-1">
                            <Plus className="h-3.5 w-3.5" /> Build Proposal
                          </Button>
                        </Hint>
                      </PipelineRow>
                    ))
              )}

              {/* STEP 2 — Proposals */}
              {!loading && s.key === 'proposals' && (
                proposals.length === 0
                  ? <PipelineEmpty>No proposals yet. Build one from a quote request in Step 1.</PipelineEmpty>
                  : sortByUrgency(proposals, proposalNextStep).map((p) => {
                      const step = proposalNextStep(p);
                      return (
                        <PipelineRow
                          key={p.id}
                          title={p.project_title}
                          subtitle={`${p.business_name || p.client_name || p.client_email} · ${money(p.price_total)}`}
                          step={step}
                        >
                          {step.action === 'send_proposal' && (
                            <Hint text="Emails the client a private link to read the proposal and accept it online. Accepting creates your draft agreement automatically.">
                              <Button size="sm" disabled={busy === p.id} onClick={() => sendProposal(p)} className="gap-1">
                                {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                {p.access_token ? 'Resend' : 'Send'}
                              </Button>
                            </Hint>
                          )}
                          {step.action === 'open_agreement' && (
                            <Button size="sm" onClick={() => setTab('agreements')} className="gap-1">
                              Go to agreement
                            </Button>
                          )}
                          {p.status !== 'accepted' && (
                            <Hint text="Edit the scope, line items or pricing.">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setProposalEditing({ proposal: p })}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Hint>
                          )}
                          {p.access_token && (
                            <Hint text="Copy the client's private proposal link, to paste into a text or email yourself.">
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/proposal/${p.id}?t=${p.access_token}`);
                                  toast({ title: 'Link copied' });
                                }}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </Hint>
                          )}
                        </PipelineRow>
                      );
                    })
              )}

              {/* STEP 3 — Agreements */}
              {!loading && s.key === 'agreements' && (
                liveContracts.length === 0
                  ? <PipelineEmpty>No agreements yet. One is created for you the moment a client accepts their proposal.</PipelineEmpty>
                  : sortByUrgency(liveContracts, (c) => contractNextStep(c, invoiceFor(c.id))).map((c) => {
                      const step = contractNextStep(c, invoiceFor(c.id));
                      return (
                        <PipelineRow
                          key={c.id}
                          title={c.project_title}
                          subtitle={`${c.client_name || c.client_email} · ${money(c.price_total)} · deposit ${money(c.deposit_amount)}`}
                          step={step}
                        >
                          {step.action === 'send_contract' && (
                            <Hint text="Emails the client a private link to read and e-sign the agreement. You'll be notified the moment they sign.">
                              <Button size="sm" disabled={busy === c.id} onClick={() => sendContract(c)} className="gap-1">
                                {busy === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                {c.access_token ? 'Resend' : 'Send to sign'}
                              </Button>
                            </Hint>
                          )}
                          {step.action === 'create_invoice' && (
                            <Hint text="Creates the invoice that tracks their deposit and final balance.">
                              <Button size="sm" disabled={busy === c.id} onClick={() => createInvoice(c)} className="gap-1">
                                <Receipt className="h-3.5 w-3.5" /> Create invoice
                              </Button>
                            </Hint>
                          )}
                          {step.action === 'send_deposit' && (
                            <Button size="sm" onClick={() => setTab('money')} className="gap-1">
                              <Receipt className="h-3.5 w-3.5" /> Go to payments
                            </Button>
                          )}
                          {step.action === 'send_intake' && (
                            <Hint text="Emails the client a form, organized page by page, to hand over their copy, images and business details.">
                              <Button size="sm" disabled={busy === c.id} onClick={() => sendIntake(c)} className="gap-1">
                                {busy === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardList className="h-3.5 w-3.5" />}
                                Send intake
                              </Button>
                            </Hint>
                          )}
                          {step.action === 'complete' && (
                            <Hint text="Closes this project out. Do this once the app is live and they're paid up.">
                              <Button size="sm" variant="outline" onClick={() => completeContract(c)} className="gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
                              </Button>
                            </Hint>
                          )}
                          {['draft', 'sent'].includes(c.status) && (
                            <Hint text="Edit the scope, pricing or terms before they sign.">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setContractEditing({ contract: c })}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </Hint>
                          )}
                        </PipelineRow>
                      );
                    })
              )}

              {/* STEP 4 — Payments */}
              {!loading && s.key === 'money' && (
                activeInvoices.length === 0
                  ? <PipelineEmpty>Nothing to collect yet. Invoices appear here once an agreement is signed.</PipelineEmpty>
                  : sortByUrgency(activeInvoices, invoiceNextStep).map((inv) => {
                      const step = invoiceNextStep(inv);
                      const paid = (inv.deposit_status === 'paid' ? inv.deposit_amount || 0 : 0) + (inv.balance_paid_amount || 0);
                      return (
                        <PipelineRow
                          key={inv.id}
                          title={inv.project_title}
                          subtitle={`${inv.client_name || inv.client_email} · ${money(paid)} of ${money(inv.amount_total)} received`}
                          step={step}
                        >
                          {step.action === 'send_deposit' && (
                            <Hint text="Emails a branded deposit request with your payment instructions and Pay Online link.">
                              <Button size="sm" disabled={busy === inv.id} onClick={() => emailInvoice(inv, 'deposit')} className="gap-1">
                                {busy === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                Email deposit
                              </Button>
                            </Hint>
                          )}
                          {step.action === 'send_balance' && (
                            <Hint text="Emails the final balance request with a full statement of what's been paid.">
                              <Button size="sm" disabled={busy === inv.id} onClick={() => emailInvoice(inv, 'balance')} className="gap-1">
                                {busy === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                Email balance
                              </Button>
                            </Hint>
                          )}
                          {step.tone !== 'done' && (
                            <Hint text="Log money you've received — Zelle, CashApp, Square, cash, anything. Sends the client a receipt and updates their project status.">
                              <Button size="sm" variant="outline" onClick={() => setPaymentFor(inv)} className="gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Record payment
                              </Button>
                            </Hint>
                          )}
                        </PipelineRow>
                      );
                    })
              )}

              {/* STEP 5 — Content intake */}
              {!loading && s.key === 'intake' && (
                sentIntakes.length === 0
                  ? <PipelineEmpty>No intake forms sent. Send one from a signed agreement in Step 3.</PipelineEmpty>
                  : sortByUrgency(sentIntakes, intakeNextStep).map((ik) => (
                      <PipelineRow
                        key={ik.id}
                        title={ik.project_title || 'Untitled project'}
                        subtitle={`${ik.client_name || ik.client_email}${ik.project_tier ? ` · ${ik.project_tier} tier` : ''}`}
                        step={intakeNextStep(ik)}
                      >
                        <Hint text="Copy their private intake link, to resend or paste into a text.">
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/intake/${ik.id}?t=${ik.access_token}`);
                              toast({ title: 'Link copied' });
                            }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </Hint>
                        <Hint text="Open what they've submitted so far.">
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/intake/${ik.id}?t=${ik.access_token}`} target="_blank" rel="noreferrer">View</a>
                          </Button>
                        </Hint>
                      </PipelineRow>
                    ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Proposal dialog */}
      <Dialog open={!!proposalEditing} onOpenChange={(o) => !o && setProposalEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{proposalEditing?.proposal ? 'Edit Proposal' : 'New Proposal'}</DialogTitle>
          </DialogHeader>
          {proposalEditing && (
            <ProposalForm
              initial={proposalEditing.proposal || proposalEditing.lead || {}}
              settings={settings}
              onSave={saveProposal}
              saving={saving}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Agreement dialog */}
      <Dialog open={!!contractEditing} onOpenChange={(o) => !o && setContractEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{contractEditing?.contract ? 'Edit Agreement' : 'New Agreement'}</DialogTitle>
          </DialogHeader>
          {contractEditing && (
            <ContractForm
              initial={contractEditing.contract || contractEditing.lead || {}}
              settings={settings}
              onSave={saveContract}
              saving={saving}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Record payment dialog */}
      <RecordPaymentDialog
        invoice={paymentFor}
        onClose={() => setPaymentFor(null)}
        onDone={async () => { setPaymentFor(null); await load(); }}
      />
    </div>
  );
}

// --- Record payment -------------------------------------------------------

const METHODS = ['zelle', 'cashapp', 'square', 'stripe', 'venmo', 'paypal', 'cash', 'check', 'transfer', 'other'];

function RecordPaymentDialog({ invoice, onClose, onDone }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('deposit');
  const [method, setMethod] = useState('zelle');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!invoice) return;
    const depositOpen = invoice.deposit_status === 'pending';
    setKind(depositOpen ? 'deposit' : 'balance');
    const suggested = depositOpen
      ? invoice.deposit_amount
      : Math.max((invoice.balance_amount || 0) - (invoice.balance_paid_amount || 0), 0);
    setAmount(suggested ? String(suggested) : '');
    setReference('');
  }, [invoice]);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('recordPayment', {
        invoice_id: invoice.id,
        amount: Number(amount),
        kind, method, reference,
      });
      const data = res.data || res;
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      toast({
        title: 'Payment recorded',
        description: data.outstanding > 0 ? `${money(data.outstanding)} still outstanding.` : 'Paid in full — receipt sent.',
      });
      await onDone();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
        </DialogHeader>
        {invoice && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {invoice.project_title} · {invoice.client_name || invoice.client_email}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  Amount ($)
                  <HintIcon text="Pre-filled with what's outstanding. Change it if they paid a partial amount." />
                </Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>This covers</Label>
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="balance">Balance</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Paid via</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  Reference
                  <HintIcon text="Optional — a confirmation number or check number, so you can match it later." />
                </Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Saving this emails the client a receipt and moves their project forward automatically.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={submit} disabled={!Number(amount) || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Record payment
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
