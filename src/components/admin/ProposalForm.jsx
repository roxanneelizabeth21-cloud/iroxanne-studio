import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

import PaymentScheduleEditor, {scheduleError} from '@/components/admin/PaymentScheduleEditor';

const num = (n) => (typeof n === 'number' && !isNaN(n) ? n : 0);
const money = (n) => `$${num(n).toLocaleString()}`;

const TIER_TIMELINES = {
  starter: '1–2 weeks once your content is delivered',
  business: '2 weeks once your content is delivered',
  custom: '3–4 weeks, scoped in phases',
};

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Build the initial form from either an existing Proposal or a Lead to prefill from.
function buildInitial(initial, settings) {
  const i = initial || {};
  const isLead = !i.id || i.quick_pitch !== undefined;
  const validDays = settings?.proposal_valid_days ?? 3;

  // Lead prefill: seed a line item from the matching package tier.
  let lineItems = i.line_items;
  let selectedPackage = i.selected_package || '';
  const tier = i.estimated_tier || i.tier || '';
  if(!lineItems&&isLead&&i.selected_package==='Business Website') {
    lineItems=[{description:'Business Website — up to four pages, service-request form, owner dashboard, social links, supported call scheduling, one revision round and launch handoff. Third-party costs and add-ons separate.',quantity:1,amount:650}];
  }
  if (!lineItems && isLead && tier && settings?.packages?.length) {
    const pkg = settings.packages.find((p) => p.name?.trim().toLowerCase() === String(tier).trim().toLowerCase());
    if (pkg) {
      selectedPackage = pkg.name;
      lineItems = [{ description: `${pkg.name} package — ${pkg.description || 'custom app build'}`, quantity: 1, amount: pkg.price }];
    }
  }

  return {
    id: i.id && !isLead ? i.id : undefined,
    lead_id: isLead ? i.id || '' : i.lead_id || '',
    client_name: i.client_name || i.name || '',
    client_email: i.client_email || i.email || '',
    business_name: i.business_name || '',
    project_title: i.project_title || (i.business_name ? `${i.business_name} app` : ''),
    intro_note: i.intro_note || '',
    scope_summary: i.scope_summary || i.quick_pitch || '',
    deliverables: i.deliverables || [],
    selected_package: selectedPackage,
    estimated_tier: tier || '',
    line_items: lineItems || [{ description: '', quantity: 1, amount: 0 }],
    payment_installments: i.payment_installments || [],
    deposit_percent: i.deposit_percent ?? settings?.default_deposit_percent ?? 50,
    deposit_amount: i.deposit_amount ?? Math.round((i.price_total || (lineItems||[]).reduce((sum,item)=>sum+num(item.amount),0)) * (settings?.default_deposit_percent ?? 50))/100,
    timeline_estimate: i.timeline_estimate || TIER_TIMELINES[tier] || '',
    saas_replacement_note: i.saas_replacement_note || '',
    valid_until: i.valid_until || addDays(validDays),
    status: i.status || 'draft',
  };
}

export default function ProposalForm({ initial, settings, onSave, saving }) {
  const [form, setForm] = useState(() => buildInitial(initial, settings));
  const [deliverableDraft, setDeliverableDraft] = useState('');

  useEffect(() => {
    setForm(buildInitial(initial, settings));
  }, [initial]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const total = (form.line_items || []).reduce((sum, li) => sum + num(li.amount), 0);
  const depositAmt = form.payment_installments?.[0]?.amount ?? Math.min(total, num(form.deposit_amount));

  const addLine = () =>
    setForm((p) => ({ ...p, line_items: [...(p.line_items || []), { description: '', quantity: 1, amount: 0 }] }));
  const removeLine = (i) =>
    setForm((p) => ({ ...p, line_items: (p.line_items || []).filter((_, idx) => idx !== i) }));
  const updateLine = (i, field, value) =>
    setForm((p) => ({
      ...p,
      line_items: (p.line_items || []).map((li, idx) => (idx === i ? { ...li, [field]: value } : li)),
    }));

  // Selecting a package rewrites the first line item to match the tier price.
  const applyPackage = (name) => {
    const pkg = (settings?.packages || []).find((p) => p.name === name);
    setForm((p) => {
      const rest = (p.line_items || []).slice(1);
      return {
        ...p,
        selected_package: name,
        estimated_tier: name==='Business Website'?'starter':name.toLowerCase(),
        deposit_amount: !p.payment_installments?.length && !p.deposit_amount && pkg ? Math.round((pkg.price+rest.reduce((sum,item)=>sum+num(item.amount),0))*(p.deposit_percent??50))/100 : p.deposit_amount,
        timeline_estimate: p.timeline_estimate || TIER_TIMELINES[name.toLowerCase()] || '',
        line_items: pkg
          ? [{ description: `${pkg.name} package — ${pkg.description || 'custom app build'}`, quantity: 1, amount: pkg.price }, ...rest]
          : p.line_items,
      };
    });
  };

  const addAddon = (name) => {
    const addon = (settings?.addons || []).find((a) => a.name === name);
    if (!addon) return;
    setForm((p) => ({
      ...p,
      line_items: [...(p.line_items || []), { description: addon.name, quantity: 1, amount: addon.price }],
    }));
  };

  const addDeliverable = () => {
    const v = deliverableDraft.trim();
    if (!v) return;
    setForm((p) => ({ ...p, deliverables: [...(p.deliverables || []), v] }));
    setDeliverableDraft('');
  };

  const submit = () => {
    if (scheduleError(form.payment_installments,total)) return;
    onSave({ ...form, price_total: total, deposit_amount: depositAmt, deposit_percent: depositAmt/total*100 });
  };

  const valid = !scheduleError(form.payment_installments,total) && form.client_email?.includes('@') && form.project_title?.trim() && total > 0 && Number.isFinite(form.deposit_amount) && form.deposit_amount > 0 && form.line_items.every(li => li.description?.trim() && Number.isFinite(li.amount) && li.amount >= 0);

  return (
    <div className="space-y-5">
      {initial?.must_have_features?.length>0&&<aside className="rounded-xl border p-3 text-sm"><strong>Requested add-ons — review before quoting</strong><p>{initial.must_have_features.join(', ')}</p><p className="text-muted-foreground mt-2">Add approved items to the scope and price below. Inquiry selections are not included automatically.</p></aside>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Client name</Label>
          <Input value={form.client_name || ''} onChange={(e) => update('client_name', e.target.value)} placeholder="Jordan Avery" />
        </div>
        <div className="space-y-1.5">
          <Label>Client email *</Label>
          <Input type="email" value={form.client_email || ''} onChange={(e) => update('client_email', e.target.value)} placeholder="jordan@example.com" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Business name</Label>
          <Input value={form.business_name || ''} onChange={(e) => update('business_name', e.target.value)} placeholder="Brightside Bakery" />
        </div>
        <div className="space-y-1.5">
          <Label>Project title *</Label>
          <Input value={form.project_title || ''} onChange={(e) => update('project_title', e.target.value)} placeholder="Booking and invoicing app" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Personal intro note</Label>
        <Textarea
          rows={3}
          value={form.intro_note || ''}
          onChange={(e) => update('intro_note', e.target.value)}
          placeholder="Jordan — after our call, here's what I think you need. You're running three systems that don't talk to each other..."
        />
        <p className="text-xs text-muted-foreground">Shown in italics at the top of the proposal. Speak to them directly.</p>
      </div>

      <div className="space-y-1.5">
        <Label>What I'll build</Label>
        <Textarea
          rows={5}
          value={form.scope_summary || ''}
          onChange={(e) => update('scope_summary', e.target.value)}
          placeholder="A single platform that handles bookings, contracts, invoicing, and inventory — replacing your spreadsheet, your Square dashboard, and the contract PDFs you email manually."
        />
      </div>

      {/* Deliverables */}
      <div className="space-y-2">
        <Label>What they get (bullet list)</Label>
        <div className="flex gap-2">
          <Input
            value={deliverableDraft}
            onChange={(e) => setDeliverableDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDeliverable(); } }}
            placeholder="Client booking portal with automated confirmations"
          />
          <Button type="button" variant="outline" onClick={addDeliverable} className="shrink-0 gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        {(form.deliverables || []).length > 0 && (
          <ul className="space-y-1.5">
            {form.deliverables.map((d, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 text-sm">
                <span className="flex-1">{d}</span>
                <button
                  type="button"
                  onClick={() => update('deliverables', form.deliverables.filter((_, j) => j !== i))}
                  className="text-destructive shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pricing */}
      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Package</Label>
            <Select value={form.selected_package || ''} onValueChange={applyPackage}>
              <SelectTrigger><SelectValue placeholder="Choose a package" /></SelectTrigger>
              <SelectContent>
                {(settings?.packages || []).map((p) => (
                  <SelectItem key={p.name} value={p.name}>{p.name} — {money(p.price)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Add an add-on</Label>
            <Select value="" onValueChange={addAddon}>
              <SelectTrigger><SelectValue placeholder="Add-ons" /></SelectTrigger>
              <SelectContent>
                {(settings?.addons || []).map((a) => (
                  <SelectItem key={a.name} value={a.name}>{a.name} — {money(a.price)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Line items</Label>
            <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Add line
            </Button>
          </div>
          {(form.line_items || []).map((li, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Input value={li.description || ''} onChange={(e) => updateLine(i, 'description', e.target.value)} placeholder="Description" />
              </div>
              <div className="w-28 space-y-1">
                <Input type="number" value={li.amount ?? 0} onChange={(e) => updateLine(i, 'amount', Number(e.target.value))} />
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => removeLine(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-primary">{money(total)}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Deposit ($)</Label>
            <Input disabled={!!form.payment_installments?.length} type="number" min="0.01" step="0.01" value={form.payment_installments?.length ? depositAmt : form.deposit_amount} onChange={(e) => update('deposit_amount', Number(e.target.value))} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deposit due</p>
            <p className="text-lg font-semibold">{money(depositAmt)}</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Timeline</Label>
          <Input value={form.timeline_estimate || ''} onChange={(e) => update('timeline_estimate', e.target.value)} placeholder="2 weeks once your content is delivered" />
        </div>
        <div className="space-y-1.5">
          <Label>Proposal validity</Label>
          <p className="text-sm py-2">{settings?.proposal_valid_days ?? 3} days from sending. Change this in contract pricing settings.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <PaymentScheduleEditor value={form.payment_installments} total={total} onChange={v=>update('payment_installments',v)}/>
        <Label>What this replaces (value framing)</Label>
        <Textarea
          rows={3}
          value={form.saas_replacement_note || ''}
          onChange={(e) => update('saas_replacement_note', e.target.value)}
          placeholder="Assembled from off-the-shelf tools, this stack runs roughly $380/mo — a CRM, an invoicing tool, a contract platform, and an inventory add-on. You own this one outright."
        />
        <p className="text-xs text-muted-foreground">Pulls the same lever as your marketing posts — show the SaaS you're replacing.</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={submit} disabled={!valid || saving}>
          {saving ? 'Saving…' : form.id ? 'Save Proposal' : 'Create Proposal'}
        </Button>
      </div>
    </div>
  );
}