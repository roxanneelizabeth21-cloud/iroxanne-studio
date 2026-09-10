import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Plus, Send, Copy, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import ContractForm from '@/components/admin/ContractForm';

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

const STATUS_STYLES = {
  draft: 'bg-secondary text-muted-foreground',
  sent: 'bg-blue-500/10 text-blue-600',
  signed: 'bg-green-500/10 text-green-600',
  deposit_paid: 'bg-green-500/15 text-green-700',
  active: 'bg-primary/10 text-primary',
  completed: 'bg-secondary text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function ContractsAdminPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // contract or {lead} to prefill
  const [showLead, setShowLead] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [leadList, contractList, settingsList] = await Promise.all([
        base44.entities.Lead.filter({ status: 'new' }).catch(() => []),
        base44.entities.Contract.list('-created_date', 50).catch(() => []),
        base44.entities.PricingSettings.list().catch(() => []),
      ]);
      setLeads(leadList);
      setContracts(contractList);
      setSettings(settingsList[0] || null);
    } finally {
      setLoading(false);
    }
  };

  const startFromLead = (lead) => {
    setEditing({ lead });
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (payload.id) {
        const { id, ...changes } = payload;
        await base44.entities.Contract.update(id, changes);
        toast({ title: 'Contract updated' });
      } else {
        const created = await base44.entities.Contract.create(payload);
        if (payload.lead_id) {
          await base44.entities.Lead.update(payload.lead_id, { status: 'proposal_sent' }).catch(() => {});
        }
        setEditing({ contract: created });
        toast({ title: 'Contract created' });
      }
      await load();
      setEditing((prev) => (prev?.contract ? { contract: prev.contract } : null));
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (contract) => {
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const link = `${window.location.origin}/contract/${contract.id}?t=${token}`;
    try {
      await base44.entities.Contract.update(contract.id, {
        status: 'sent',
        access_token: token,
        sent_at: new Date().toISOString(),
      });
      await navigator.clipboard.writeText(link);
      toast({ title: 'Contract link copied', description: 'Send it to your client.' });
      await load();
    } catch (e) {
      toast({ title: 'Failed to generate link', variant: 'destructive' });
    }
  };

  const saveSettings = async (s) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Contracts &amp; Quotes
        </h1>
        <Button variant="outline" size="sm" onClick={() => setSettingsOpen((v) => !v)} className="gap-1.5">
          {settingsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Pricing Settings
        </Button>
      </div>

      {settingsOpen && (
        <PricingSettingsCard settings={settings} onSave={saveSettings} />
      )}

      {/* New leads */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <button onClick={() => setShowLead((v) => !v)} className="flex items-center gap-2 w-full">
          {showLead ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <h2 className="font-semibold">New Quote Requests ({leads.length})</h2>
        </button>
        {showLead && (
          <div className="space-y-2">
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!loading && leads.length === 0 && <p className="text-sm text-muted-foreground">No new quote requests.</p>}
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 p-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{lead.name || lead.email}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.business_name ? `${lead.business_name} · ` : ''}{lead.quick_pitch?.slice(0, 80) || 'No pitch'}
                  </p>
                  {lead.estimated_price_low != null && (
                    <p className="text-xs text-primary mt-0.5">Est. {money(lead.estimated_price_low)}–{money(lead.estimated_price_high)}</p>
                  )}
                </div>
                <Button size="sm" onClick={() => startFromLead(lead)} className="gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Create Contract
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contracts */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Contracts ({contracts.length})</h2>
          <Button size="sm" onClick={() => setEditing({ lead: null })} className="gap-1">
            <Plus className="h-4 w-4" /> New Contract
          </Button>
        </div>
        <div className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && contracts.length === 0 && <p className="text-sm text-muted-foreground">No contracts yet.</p>}
          {contracts.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{c.project_title}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status] || ''}`}>{c.status}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {c.client_name || c.client_email} · {money(c.price_total)} · dep {money(c.deposit_amount)}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ contract: c })}>
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
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.contract ? 'Edit Contract' : 'New Contract'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <ContractForm
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
    pricing_mode: 'custom_quote',
    default_deposit_mode: 'fixed_percent',
    default_deposit_percent: 50,
    standard_terms: '',
    packages: [],
    addons: [],
  });
  const update = (f, v) => setS((p) => ({ ...p, [f]: v }));

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Hourly rate ($)</Label>
          <Input type="number" value={s.rate_per_hour} onChange={(e) => update('rate_per_hour', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
          <Label>Default deposit</Label>
          <Select value={s.default_deposit_mode} onValueChange={(v) => update('default_deposit_mode', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed_percent">Fixed %</SelectItem>
              <SelectItem value="tiered">% by tier</SelectItem>
              <SelectItem value="custom_amount">Custom amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {s.default_deposit_mode === 'fixed_percent' && (
        <div className="space-y-1.5">
          <Label>Deposit %</Label>
          <Input type="number" value={s.default_deposit_percent} onChange={(e) => update('default_deposit_percent', Number(e.target.value))} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Standard terms (pre-filled on new contracts)</Label>
        <Textarea rows={4} value={s.standard_terms || ''} onChange={(e) => update('standard_terms', e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button onClick={() => onSave(s)}>Save Settings</Button>
      </div>
    </div>
  );
}