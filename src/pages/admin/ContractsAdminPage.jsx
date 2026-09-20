import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Plus, Send, Copy, Pencil, ChevronDown, ChevronRight, ClipboardList, Trash2 } from 'lucide-react';
import ContractForm from '@/components/admin/ContractForm';

import HandoffPanel from '@/components/admin/HandoffPanel';
import { RUSH_TERMS } from '@/lib/studioDelivery';
import { useConfirmDelete } from '@/components/admin/ConfirmDeleteDialog';
import { deleteProjectChain, chainSummary } from '@/lib/projectChain';

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

const STATUS_MAP = {
  draft: { accent: 'irx-accent-gray', label: 'draft' },
  sent: { accent: 'irx-accent-blue', label: 'sent' },
  signed: { accent: 'irx-accent-green', label: 'signed' },
  deposit_paid: { accent: 'irx-accent-green', label: 'deposit_paid' },
  active: { accent: 'irx-accent-purple', label: 'active' },
  completed: { accent: 'irx-accent-gray', label: 'completed' },
  cancelled: { accent: 'irx-accent-red', label: 'cancelled' },
};

export default function ContractsAdminPage() {
  const { toast } = useToast();
  const { confirm: confirmDelete, dialog: confirmDialog } = useConfirmDelete();
  const [searchParams] = useSearchParams();
  const requestedContract = searchParams.get('contract');

  useEffect(() => {
    if (!requestedContract) return;
    let cancelled = false;
    base44.entities.Contract.get(requestedContract).then(contract => {
      if (cancelled) return;
      if (['draft', 'sent'].includes(contract.status)) setEditing({ contract });
      else setHandoff(contract);
    }).catch(() => {
      if (!cancelled) toast({ title: 'Agreement could not be opened', description: 'It may no longer be available, or you may need to sign in again.', variant: 'destructive' });
    });
    return () => { cancelled = true; };
  }, [requestedContract, toast]);
  const [leads, setLeads] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // contract or {lead} to prefill
  const [showLead, setShowLead] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [handoff,setHandoff] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [leadList, contractList, settingsList] = await Promise.all([
        base44.entities.Lead.filter({ status: 'new' }).catch(() => []),
        base44.entities.Contract.list('-created_date', 50).catch(() => []),
        base44.entities.PricingSettings.list('-updated_date', 1).catch(() => []),
      ]);
      setLeads(leadList);
      setContracts(contractList);
      setSettings(settingsList.find((s) => s.packages?.length) || settingsList[0] || null);
    } finally {
      setLoading(false);
    }
  };

  const startFromLead = (lead) => {
    setEditing({ lead });
  };

  const handleDeleteContract = async (contract) => {
    const ok = await confirmDelete({
      title: 'Delete this agreement?',
      description: `"${contract.project_title}" will be permanently removed, along with its invoice, intake, and payment records. This cannot be undone.`,
    });
    if (!ok) return;
    try {
      const counts = await deleteProjectChain('contract', contract.id);
      toast({ title: 'Agreement deleted', description: chainSummary(counts) });
      await load();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteLead = async (lead) => {
    const ok = await confirmDelete({
      title: 'Delete this quote request?',
      description: `The request from "${lead.name || lead.email}" will be permanently removed, along with any proposals or agreements created from it. This cannot be undone.`,
    });
    if (!ok) return;
    try {
      const counts = await deleteProjectChain('lead', lead.id);
      toast({ title: 'Quote request deleted', description: chainSummary(counts) });
      await load();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (payload.id) {
        const { id, ...changes } = payload;
        const latest=await base44.entities.Contract.get(id);
        if(!['draft','sent'].includes(latest.status))throw new Error('Signed agreements cannot be edited. Create a new agreement for changed terms.');
        await base44.entities.Contract.update(id, changes);
        toast({ title: 'Contract updated' });
      } else {
        const created = await base44.entities.Contract.create(payload);
        if (payload.lead_id) {
          await base44.entities.Lead.update(payload.lead_id, { status: 'proposal_sent' }).catch(() => {});
        }
        toast({ title: 'Contract created', description: 'Click Send to email the signing link to your client.' });
      }
      await load();
      setEditing(null);
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (contract) => {
    if (!['draft', 'sent'].includes(contract.status)) return;
    try {
      const result = await base44.functions.invoke('sendContract', { contract_id: contract.id });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      await navigator.clipboard.writeText(data.link).catch(() => {});
      toast({ title: data.sent ? 'Agreement sent' : 'Email failed; link copied', description: data.sent ? contract.client_email : 'You can retry sending.' });
      await load();
    } catch (e) { toast({ title: 'Could not send agreement', description: e.message, variant: 'destructive' }); }
  };

  const saveSettings = async (s) => {
    s = {...s,packages:(s.packages || []).map(p=>({...p,name:p.name.trim()})),addons:(s.addons || []).map(a=>({...a,name:a.name.trim()}))};
    try {
      if (s.id) {
        await base44.entities.PricingSettings.update(s.id, s);
      } else {
        await base44.entities.PricingSettings.create(s);
      }
      toast({ title: 'Pricing settings saved' });
      await load();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Contracts &amp; Quotes</h1>
        <p>Manage client contracts, packages, and project handoffs.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outline" size="sm" onClick={() => setSettingsOpen((v) => !v)} className="gap-1.5">
          {settingsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Pricing Settings
        </Button>
      </div>

      {settingsOpen && (
        <PricingSettingsCard settings={settings} onSave={saveSettings} />
      )}

      {/* New leads */}
      <div className="irx-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={() => setShowLead((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}>
          {showLead ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <div className="irx-section-head" style={{ margin: 0 }}>New Quote Requests ({leads.length})</div>
        </button>
        {showLead && (
          <div className="irx-list">
            {loading && <p className="irx-empty">Loading...</p>}
            {!loading && leads.length === 0 && <p className="irx-empty">No new quote requests.</p>}
            {leads.map((lead) => (
              <div key={lead.id} className="irx-list-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name || lead.email}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.business_name ? `${lead.business_name} · ` : ''}{lead.quick_pitch?.slice(0, 80) || 'No pitch'}
                  </p>
                  {lead.estimated_price_low != null && (
                    <p style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '2px' }}>Est. {money(lead.estimated_price_low)}–{money(lead.estimated_price_high)}</p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <Button size="sm" onClick={() => startFromLead(lead)} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Create Contract
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => handleDeleteLead(lead)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contracts */}
      <div className="irx-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="irx-section-head" style={{ margin: 0 }}>Contracts ({contracts.length})</div>
          <Button size="sm" onClick={() => setEditing({ lead: null })} className="gap-1">
            <Plus className="h-4 w-4" /> New Contract
          </Button>
        </div>
        <div className="irx-list">
          {loading && <p className="irx-empty">Loading...</p>}
          {!loading && contracts.length === 0 && <p className="irx-empty">No contracts yet.</p>}
          {contracts.map((c) => {
            const statusInfo = STATUS_MAP[c.status] || { accent: 'irx-accent-gray', label: c.status };
            return (
              <div key={c.id} className="irx-list-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.project_title}</p>
                    <span className={`irx-badge ${statusInfo.accent}`}>{statusInfo.label}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.client_name || c.client_email} · {money(c.price_total)} · dep {money(c.deposit_amount)}
                  </p>
                  {c.status !== 'draft' && c.status !== 'sent' && c.signer_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      {c.signature_mode === 'drawn' && c.signature_image && (
                        <img src={c.signature_image} alt="Signature" style={{ height: '40px', background: '#FAF7F0', borderRadius: '4px', padding: '4px 8px', border: '1px solid var(--border-color, #e5e5e5)' }} />
                      )}
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)' }}>
                        Signed by {c.signer_name}{c.signed_at ? ` on ${new Date(c.signed_at).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end' }}>
                  <Button disabled={!['draft','sent'].includes(c.status)} title="Edit unsigned agreement" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ contract: c })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {(c.status === 'draft' || c.status === 'sent') && (
                    <Button variant="outline" size="sm" onClick={() => handleSend(c)} className="gap-1">
                      <Send className="h-3.5 w-3.5" /> {c.status === 'sent' ? 'Resend' : 'Send'}
                    </Button>
                  )}
                  {c.status === 'sent' && c.access_token && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Copy link"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/contract/${c.id}?t=${c.access_token}`)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {['signed','deposit_paid','active','completed'].includes(c.status) && <Button variant="outline" size="sm" onClick={()=>setHandoff(c)}>Handoff checklist</Button>}
                  {['signed', 'deposit_paid', 'active'].includes(c.status) && (
                    <Button variant="outline" size="sm" className="gap-1" onClick={async () => {
                      try {
                        const res = await base44.functions.invoke('sendIntakeForm', { contract_id: c.id });
                        const data = res.data || res;
                        if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
                        toast({ title: data.sent ? 'Intake email sent' : 'Email failed; private link is available', description: data.sent ? c.client_email : data.link, variant: data.sent ? 'default' : 'destructive' });
                        navigator.clipboard.writeText(data.link);
                      } catch (e) { toast({ title: 'Failed to send intake form', variant: 'destructive' }); }
                    }}><ClipboardList className="h-3.5 w-3.5" /> Send Intake</Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => handleDeleteContract(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!handoff} onOpenChange={o=>!o&&setHandoff(null)}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Project handoff — {handoff?.project_title}</DialogTitle></DialogHeader>{handoff&&<HandoffPanel contractId={handoff.id} onSaved={load}/>}</DialogContent></Dialog>
      {confirmDialog}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.contract ? 'Edit Contract' : 'New Contract'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <ContractForm
              key={editing.contract?.id || editing.lead?.id || 'new'}
              initial={editing.contract || editing.lead || {}}
              settings={settings}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PricingSettingsCard({ settings, onSave }) {
  const [s, setS] = useState(settings || {
    rate_per_hour: 65,
    pricing_mode: 'packages_addons',
    default_deposit_percent: 50,
    standard_terms: '',
    packages: [],
    addons: [],
  });
  const update = (f, v) => setS((p) => ({ ...p, [f]: v }));

  return (
    <div className="irx-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="irx-section-head">Pricing Settings</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Label>Hourly rate ($)</Label>
          <Input type="number" value={s.rate_per_hour} onChange={(e) => update('rate_per_hour', Number(e.target.value))} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Label>Pricing mode</Label>
          <Select value={s.pricing_mode} onValueChange={(v) => update('pricing_mode', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="custom_quote">Custom quote</SelectItem>
              <SelectItem value="fixed_packages">Fixed packages</SelectItem>
              <SelectItem value="packages_addons">Packages + add-ons</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Label>Starting deposit</Label>
          <p style={{ fontSize: '13px' }}>$500 by default. Set the exact dollar amount on each new proposal or agreement.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Label>Proposal validity (days from sending)</Label>
          <Input type="number" min="1" value={s.proposal_valid_days ?? 3} onChange={e=>update('proposal_valid_days',Number(e.target.value))}/>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)' }}>3 days = 72 hours.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Label>Invoice due days</Label>
          <Input type="number" min="1" value={s.invoice_due_days ?? 7} onChange={e=>update('invoice_due_days',Number(e.target.value))}/>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label>Payment instructions shown in emails</Label>
        <Textarea value={s.payment_instructions || ''} onChange={e=>update('payment_instructions',e.target.value)} placeholder="Tell clients how to arrange their deposit or balance payment." />
      </div>
      {/* Packages */}
      {(s.pricing_mode === 'fixed_packages' || s.pricing_mode === 'packages_addons') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Label>Packages</Label>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => update('packages', [...(s.packages || []), { name: '', price: 0, description: '', highlight: false }])}>
              <Plus className="h-3.5 w-3.5" /> Add package
            </Button>
          </div>
          {(s.packages || []).map((pkg, i) => (
            <div key={i} className="irx-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary, #f5f5f5)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}><Label style={{ fontSize: '12px' }}>Name</Label><Input value={pkg.name} onChange={(e) => { const p = [...s.packages]; p[i] = { ...p[i], name: e.target.value }; update('packages', p); }} placeholder="e.g. Starter" /></div>
                <div style={{ width: '112px', display: 'flex', flexDirection: 'column', gap: '4px' }}><Label style={{ fontSize: '12px' }}>Price ($)</Label><Input type="number" value={pkg.price} onChange={(e) => { const p = [...s.packages]; p[i] = { ...p[i], price: Number(e.target.value) }; update('packages', p); }} /></div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" style={{ flexShrink: 0 }} onClick={() => update('packages', s.packages.filter((_, j) => j !== i))}><span style={{ fontSize: '18px' }}>&times;</span></Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><Label style={{ fontSize: '12px' }}>What's included</Label><Input value={pkg.description || ''} onChange={(e) => { const p = [...s.packages]; p[i] = { ...p[i], description: e.target.value }; update('packages', p); }} placeholder="Brief description of what this tier covers" /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}><input type="checkbox" checked={!!pkg.highlight} onChange={(e) => { const p = [...s.packages]; p[i] = { ...p[i], highlight: e.target.checked }; update('packages', p); }} /> Highlight as recommended</label>
            </div>
          ))}
          {(!s.packages || s.packages.length === 0) && <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)' }}>No packages yet — add your tiers above.</p>}
        </div>
      )}

      {/* Add-ons */}
      {s.pricing_mode === 'packages_addons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Label>Add-ons</Label>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => update('addons', [...(s.addons || []), { name: '', price: 0, description: '' }])}>
              <Plus className="h-3.5 w-3.5" /> Add add-on
            </Button>
          </div>
          {(s.addons || []).map((addon, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}><Label style={{ fontSize: '12px' }}>Name</Label><Input value={addon.name} onChange={(e) => { const a = [...s.addons]; a[i] = { ...a[i], name: e.target.value }; update('addons', a); }} placeholder="e.g. Extra pages" /></div>
              <div style={{ width: '112px', display: 'flex', flexDirection: 'column', gap: '4px' }}><Label style={{ fontSize: '12px' }}>Price ($)</Label><Input type="number" value={addon.price} onChange={(e) => { const a = [...s.addons]; a[i] = { ...a[i], price: Number(e.target.value) }; update('addons', a); }} /></div>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" style={{ flexShrink: 0 }} onClick={() => update('addons', s.addons.filter((_, j) => j !== i))}><span style={{ fontSize: '18px' }}>&times;</span></Button>
            </div>
          ))}
          {(!s.addons || s.addons.length === 0) && <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)' }}>No add-ons yet.</p>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Label>Standard terms (pre-filled on new contracts)</Label>
        <Textarea rows={4} value={s.standard_terms || ''} onChange={(e) => update('standard_terms', e.target.value)} />
      </div>
      <label style={{ display: 'block', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>Rush terms (pre-filled on new agreements)<Textarea rows={7} maxLength={8000} value={s.rush_terms ?? RUSH_TERMS} onChange={e=>update('rush_terms',e.target.value)}/></label>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => onSave({...s,rush_terms:s.rush_terms ?? RUSH_TERMS})}>Save Settings</Button>
      </div>
    </div>
  );
}
