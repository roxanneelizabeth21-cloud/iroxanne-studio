import WorkflowSection from '@/components/admin/WorkflowSection';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

import { isRushDate, RUSH_TERMS } from '@/lib/studioDelivery';

import PaymentScheduleEditor, {scheduleError} from '@/components/admin/PaymentScheduleEditor';
import {scheduleText,withHandoffTerms} from '@/lib/paymentSchedule';

const money = (n) => (typeof n === 'number' && !isNaN(n) ? n : 0);

export default function ContractForm({ initial, settings, onSave, saving }) {
  const [form, setForm] = useState(() => buildInitial(initial, settings));

  useEffect(() => {
    setForm(buildInitial(initial, settings));
  }, [initial]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const total = (form.line_items || []).reduce((sum, li) => sum + money(li.amount), 0);

  const addLine = () =>
    setForm((p) => ({ ...p, line_items: [...(p.line_items || []), { description: '', quantity: 1, amount: 0 }] }));
  const removeLine = (i) =>
    setForm((p) => ({ ...p, line_items: (p.line_items || []).filter((_, idx) => idx !== i) }));
  const updateLine = (i, field, value) =>
    setForm((p) => ({
      ...p,
      line_items: (p.line_items || []).map((li, idx) => (idx === i ? { ...li, [field]: value } : li)),
    }));

  const computeDeposit = (price) => {
    if(form.payment_installments?.length) return form.payment_installments[0].amount;
    const p = money(price);
    const pct = form.deposit_percent ?? settings?.default_deposit_percent ?? 50;
    return Math.min(p, form.deposit_amount ?? Math.round(p * pct) / 100);
  };

  const submit = () => {
    if(scheduleError(form.payment_installments,total) || !Number.isFinite(computeDeposit(total)) || computeDeposit(total)<=0) return;
    const payload = {
      ...form,
      price_total: total,
      terms: withHandoffTerms(form.terms),
      payment_schedule: form.payment_installments?.length ? scheduleText(form.payment_installments) : form.payment_schedule,
      deposit_amount: computeDeposit(total),
      deposit_percent: computeDeposit(total)/total*100,
    };
    onSave(payload);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Work through these three sections. Saving does not email the client.</p>
      <WorkflowSection title="1. Client & project" open>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Client name</Label>
          <Input value={form.client_name || ''} onChange={(e) => update('client_name', e.target.value)} placeholder="Jane Smith" />
        </div>
        <div className="space-y-1.5">
          <Label>Client email *</Label>
          <Input type="email" value={form.client_email || ''} onChange={(e) => update('client_email', e.target.value)} placeholder="jane@business.com" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Project title *</Label>
        <Input value={form.project_title || ''} onChange={(e) => update('project_title', e.target.value)} placeholder="Booking & scheduling app" />
      </div>

      </WorkflowSection>
      <WorkflowSection title="2. Scope & delivery schedule">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-1.5 text-sm">Target launch date<Input type="date" value={form.target_launch_date || ''} onChange={e=>setForm(p=>({...p,target_launch_date:e.target.value,contract_variant:isRushDate(e.target.value)?'rush':'standard',rush_terms:p.rush_terms || settings?.rush_terms || RUSH_TERMS}))}/></label>
        <label className="space-y-1.5 text-sm">Contract schedule<select className="w-full rounded-md border bg-background p-2" value={form.contract_variant || 'standard'} onChange={e=>update('contract_variant',e.target.value)}><option value="standard">Standard</option><option value="rush">Rush / expedited</option></select></label>
      </div>
      <p className="text-xs text-muted-foreground">Dates under 30 days away select rush terms. You can change the selection. Pricing stays as entered below.</p>
      {form.contract_variant==='rush' && <label className="block text-sm space-y-2">Rush schedule addendum<Textarea rows={7} maxLength={8000} value={form.rush_terms || ''} onChange={e=>update('rush_terms',e.target.value)}/></label>}
      <div className="space-y-1.5">
        <Label>Scope of work</Label>
        <Textarea
          rows={4}
          value={form.scope_summary || ''}
          onChange={(e) => update('scope_summary', e.target.value)}
          placeholder="Describe what will be built and delivered..."
        />
      </div>

      </WorkflowSection>
      <WorkflowSection title="3. Price, payments & agreement terms">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Pricing mode</Label>
          <Select value={form.pricing_mode} onValueChange={(v) => update('pricing_mode', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="custom_quote">Custom quote (itemized)</SelectItem>
              <SelectItem value="fixed_packages">Fixed package</SelectItem>
              <SelectItem value="packages_addons">Package + add-ons</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      {settings?.packages?.length > 0 && form.pricing_mode !== 'custom_quote' && (
        <div className="space-y-1.5">
          <Label>Selected package</Label>
          <Select value={form.selected_package || ''} onValueChange={v=>{const pkg=settings.packages.find(p=>p.name===v);if(!pkg)return;setForm(p=>({...p,selected_package:v,estimated_tier:v==='Business Website'?'starter':(['starter','business','custom'].includes(v.toLowerCase())?v.toLowerCase():'custom'),line_items:[{description:pkg.name+' — '+(pkg.description||''),quantity:1,amount:pkg.price},...(p.line_items||[]).slice(1)],deposit_amount:p.payment_installments?.[0]?.amount||Math.round((pkg.price+(p.line_items||[]).slice(1).reduce((s,i)=>s+money(i.amount),0))*(p.deposit_percent??settings?.default_deposit_percent??50))/100}));}}>
            <SelectTrigger><SelectValue placeholder="Choose a package" /></SelectTrigger>
            <SelectContent>
              {settings.packages.map((pkg) => (
                <SelectItem key={pkg.name} value={pkg.name}>{pkg.name} — ${pkg.price.toLocaleString()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Line items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add line
          </Button>
        </div>
        {(form.line_items || []).map((li, i) => (
          <div key={i} className="flex gap-2 items-end">
            <Input
              className="flex-1"
              value={li.description}
              onChange={(e) => updateLine(i, 'description', e.target.value)}
              placeholder="Description"
            />
            <Input
              type="number"
              className="w-28"
              value={li.amount}
              onChange={(e) => updateLine(i, 'amount', Number(e.target.value))}
              placeholder="Amount"
            />
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeLine(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {(!form.line_items || form.line_items.length === 0) && (
          <p className="text-xs text-muted-foreground">No line items — total will be $0 unless you add some.</p>
        )}
        <div className="flex justify-between rounded-lg bg-secondary/40 px-4 py-2.5 text-sm">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-primary">${total.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{form.payment_installments?.length ? 'First payment' : 'Deposit ($)'}</Label>
          <Input type="number" min="0.01" step="0.01" disabled={!!form.payment_installments?.length} value={form.deposit_amount ?? computeDeposit(total)} onChange={e=>update('deposit_amount',Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Payment schedule</Label>
          <Input disabled={!!form.payment_installments?.length} value={form.payment_installments?.length ? 'See dated payment plan below' : form.payment_schedule || ''} onChange={(e) => update('payment_schedule', e.target.value)} placeholder="Deposit shown above due at signing; remaining balance within 7 days after completed deliverables are presented for final review under Section 6. Voluntary early payments are welcome." />
        </div>
      </div>

      <div className="space-y-1.5">
        <PaymentScheduleEditor value={form.payment_installments || []} total={total} onChange={v=>update('payment_installments',v)}/>
        <Label>Terms &amp; conditions</Label>
        <Textarea
          rows={5}
          value={form.terms || ''}
          onChange={(e) => update('terms', e.target.value)}
          placeholder="Standard terms, scope boundaries, revision policy, etc."
        />
      </div>

      </WorkflowSection>
      <p className="text-sm text-muted-foreground">Before saving: add the client email and project title, a positive deposit and a valid payment schedule. Rush agreements also need rush terms.</p>
      <div className="irx-form-footer flex justify-end pt-2 border-t border-border">
        <Button onClick={submit} disabled={saving || !Number.isFinite(computeDeposit(total)) || computeDeposit(total)<=0 || !!scheduleError(form.payment_installments,total) || !form.client_email || !form.project_title || (form.contract_variant==='rush' && !form.rush_terms?.trim())}>
          {saving ? 'Saving...' : 'Save Contract'}
        </Button>
      </div>
    </div>
  );
}

function buildInitial(initial, settings) {
  if (initial && initial.id && initial.quick_pitch === undefined && initial.client_email) {
    return { contract_variant:'standard',rush_terms:settings?.rush_terms || RUSH_TERMS,...initial };
  }
  return {
    lead_id: initial?.lead_id || initial?.id || '',
    client_name: initial?.client_name || initial?.name || '',
    client_email: initial?.client_email || initial?.email || '',
    project_title: initial?.project_title || initial?.quick_pitch?.slice(0, 60) || '',
    scope_summary: initial?.scope_summary || buildScopeFromLead(initial),
    pricing_mode: settings?.pricing_mode || 'packages_addons',
    selected_package: initial?.selected_package || '',
    line_items: initial?.selected_package==='Business Website' ? [{description:'Business Website — up to four pages, service-request form, owner dashboard, social links, supported call scheduling, one revision round and launch handoff. Third-party costs and add-ons separate.',quantity:1,amount:650}] : initial?.estimated_price_low
      ? [{ description: 'Project build (estimated)', quantity: 1, amount: initial.estimated_price_low }]
      : [],
    deposit_amount: Math.round((initial?.selected_package==='Business Website'?650:Number(initial?.estimated_price_low||0))*(settings?.default_deposit_percent??50))/100,
    payment_schedule: 'Deposit shown above due at signing; remaining balance within 7 days after completed deliverables are presented for final review under Section 6. Voluntary early payments are welcome.',
    terms: settings?.standard_terms || '',
    contract_variant: 'standard',
    rush_terms: settings?.rush_terms || RUSH_TERMS,
    estimated_tier: initial?.estimated_tier || 'starter',
  };
}

function buildScopeFromLead(lead) {
  if (!lead) return '';
  const parts = [];
  if (lead.quick_pitch) parts.push(lead.quick_pitch);
  if (lead.must_have_features?.length) parts.push(`Requested add-ons for review — include only after scope and price are agreed: ${lead.must_have_features.join(', ')}`);
  if (lead.integrations_needed?.length) parts.push(`Integrations: ${lead.integrations_needed.join(', ')}`);
  if (lead.estimated_tier) parts.push(`Estimated tier: ${lead.estimated_tier} (${lead.estimated_hours_low}–${lead.estimated_hours_high} hrs)`);
  return parts.join('\n\n');
}