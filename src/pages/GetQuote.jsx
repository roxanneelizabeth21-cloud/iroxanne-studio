import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { estimateProject } from '@/lib/estimateProject';

const FEATURE_OPTIONS = [
  'Client/customer portal',
  'Online proposals & e-signatures',
  'Payment processing / invoicing',
  'Scheduling & booking',
  'Team/staff management with roles',
  'Admin dashboard & reports',
  'Email notifications',
  'SMS notifications',
  'File/document uploads',
  'Content or media library',
  'Multi-location / multi-team support',
  'Public-facing marketing pages',
  'Search & filtering',
  'Custom forms',
];

const INTEGRATION_OPTIONS = [
  'Payments (Stripe/Square)',
  'Gmail / Google Calendar',
  'Zapier',
  'Email marketing (SendGrid/Mailchimp)',
  'SMS (Twilio)',
  'QuickBooks',
  'Other third-party API',
  'None yet',
];

const STEPS = ['About You', 'The Idea', 'Features & Workflow', 'Integrations', 'Design & Timeline', 'Budget'];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  business_name: '',
  business_type: '',
  website: '',
  quick_pitch: '',
  problem_to_solve: '',
  business_model: '',
  initial_users: '',
  projected_growth: '',
  competitors: '',
  primary_workflows: '',
  user_types: '',
  data_to_collect: '',
  reports_needed: '',
  must_have_features: [],
  nice_to_have_features: [],
  out_of_scope: '',
  existing_tools: '',
  integrations_needed: [],
  compliance_needs: '',
  design_style: '',
  design_inspiration: '',
  device_focus: '',
  accessibility_needs: '',
  ideal_launch_date: '',
  revision_expectations: '',
  training_needed: false,
  ongoing_support_needed: false,
  budget_range: '',
  pricing_model_preference: '',
  payment_schedule_preference: '',
};

const BUDGET_LABELS = {
  under_5k: 'Under $5,000',
  '5k_10k': '$5,000 – $10,000',
  '10k_20k': '$10,000 – $20,000',
  '20k_50k': '$20,000 – $50,000',
  '50k_plus': '$50,000+',
  not_sure: 'Not sure yet',
};

export default function GetQuote() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleInList = (field, value) => {
    setForm((prev) => {
      const list = prev[field];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [field]: next };
    });
  };

  const canAdvance = () => {
    if (step === 0) return form.name.trim() && form.email.trim();
    if (step === 1) return form.quick_pitch.trim().length >= 5;
    return true;
  };

  const goNext = () => {
    if (!canAdvance()) {
      toast.error('Please fill in the required fields before continuing');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!form.budget_range) {
      toast.error('Please select a budget range');
      return;
    }

    setSubmitting(true);

    try {
      const estimate = estimateProject({
        mustHave: form.must_have_features,
        niceToHave: form.nice_to_have_features,
        integrations: form.integrations_needed,
        compliance: form.compliance_needs,
      });

      await base44.entities.Lead.create({
        email: form.email,
        name: form.name,
        interested_apps: ['service_inquiry'],
        source: 'get_quote_form',
        request_type: 'quote_request',
        status: 'new',
        phone: form.phone,
        business_name: form.business_name,
        business_type: form.business_type,
        website: form.website,
        quick_pitch: form.quick_pitch,
        business_model: form.business_model,
        problem_to_solve: form.problem_to_solve,
        initial_users: form.initial_users,
        projected_growth: form.projected_growth,
        competitors: form.competitors,
        primary_workflows: form.primary_workflows,
        user_types: form.user_types,
        data_to_collect: form.data_to_collect,
        reports_needed: form.reports_needed,
        must_have_features: form.must_have_features,
        nice_to_have_features: form.nice_to_have_features,
        out_of_scope: form.out_of_scope,
        existing_tools: form.existing_tools,
        integrations_needed: form.integrations_needed,
        compliance_needs: form.compliance_needs,
        design_style: form.design_style,
        design_inspiration: form.design_inspiration,
        device_focus: form.device_focus,
        accessibility_needs: form.accessibility_needs,
        ideal_launch_date: form.ideal_launch_date,
        revision_expectations: form.revision_expectations,
        training_needed: form.training_needed,
        ongoing_support_needed: form.ongoing_support_needed,
        budget_range: form.budget_range,
        pricing_model_preference: form.pricing_model_preference,
        payment_schedule_preference: form.payment_schedule_preference,
        estimated_tier: estimate.tier,
        estimated_hours_low: estimate.hoursLow,
        estimated_hours_high: estimate.hoursHigh,
        estimated_price_low: estimate.priceLow,
        estimated_price_high: estimate.priceHigh,
      });

      // Confirmation email to the client (Core.SendEmail integration).
      // Reaching a non-registered address requires a connected custom domain
      // on a paid plan; a failure here must not roll back the saved Lead.
      try {
        await base44.integrations.Core.SendEmail({
          to: form.email,
          subject: "We've got your project details!",
          body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4C2A63 0%, #7A3D5C 50%, #C97064 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Thanks, ${form.name.split(' ')[0] || 'there'}!</h1>
            </div>
            <div style="padding: 40px 20px; background: #f9f9f9;">
              <p style="font-size: 16px; color: #333; line-height: 1.6;">We've received your project details. We'll review everything and follow up within 2 business days with a custom proposal.</p>
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #4C2A63;">
                <p style="margin: 0; color: #666;"><strong>What you told us:</strong></p>
                <p style="margin: 10px 0 0 0; color: #333; white-space: pre-wrap;">${form.quick_pitch}</p>
              </div>
              <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 30px;">Talk soon,<br><strong>iRoxanne Studio</strong></p>
            </div>
            <div style="padding: 20px; text-align: center; background: #333; color: white; font-size: 12px; border-radius: 0 0 10px 10px;">
              <p style="margin: 0;">© 2025 iRoxanne Studio. All rights reserved.</p>
            </div>
          </div>
        `,
        });
      } catch (emailError) {
        console.warn('Confirmation email could not be sent:', emailError);
      }

      // Internal Gmail notification is now handled automatically by the
      // "Notify Quote Requested" workflow (entity trigger on Lead.create with
      // request_type === 'quote_request'), which emails Roxanne from her own
      // connected Gmail account — so nothing extra to run here on submit.

      setSubmitted(true);
      toast.success("Got it! We'll follow up within 2 business days.");
    } catch (error) {
      console.error('Get a Quote submission error:', error);
      toast.error('Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 ir-app-bg">
        <div className="max-w-md text-center bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[22px] p-10 border border-black/5 dark:border-white/10 shadow-lg">
          <CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Thanks, {form.name.split(' ')[0] || 'there'}!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            We've got your project details and sent you a confirmation email. We'll follow up within 2 business days with a custom proposal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ir-app-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 rounded-full mb-4 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold ir-gradient-text">Get a Quote</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Tell Us About Your Project</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Six short sections, one sitting. The more detail you give us, the more accurate your proposal will be.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-gradient-to-r from-purple-700 to-purple-400' : 'bg-gray-200 dark:bg-gray-800'}`} />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-6 text-center">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[22px] p-6 md:p-8 border border-black/5 dark:border-white/10 shadow-lg space-y-5">
          {step === 0 && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Your name *">
                  <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jane Smith" />
                </Field>
                <Field label="Email *">
                  <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jane@business.com" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Phone">
                  <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 555-5555" />
                </Field>
                <Field label="Business name">
                  <Input value={form.business_name} onChange={(e) => update('business_name', e.target.value)} placeholder="Your business name" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Business type / industry">
                  <Input value={form.business_type} onChange={(e) => update('business_type', e.target.value)} placeholder="e.g. event planning, wellness, retail" />
                </Field>
                <Field label="Existing website (if any)">
                  <Input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" />
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="In 2-3 sentences, what does your app need to do? *">
                <Textarea rows={3} value={form.quick_pitch} onChange={(e) => update('quick_pitch', e.target.value)} placeholder="A rough idea is fine — we'll dig into detail below." />
              </Field>
              <Field label="What problem or pain point is driving this?">
                <Textarea rows={2} value={form.problem_to_solve} onChange={(e) => update('problem_to_solve', e.target.value)} />
              </Field>
              <Field label="How does your business operate today? Who are your customers?">
                <Textarea rows={2} value={form.business_model} onChange={(e) => update('business_model', e.target.value)} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Expected users at launch">
                  <Input value={form.initial_users} onChange={(e) => update('initial_users', e.target.value)} placeholder="e.g. 20 clients" />
                </Field>
                <Field label="Growth expected in 12 months">
                  <Input value={form.projected_growth} onChange={(e) => update('projected_growth', e.target.value)} placeholder="e.g. 100+ clients" />
                </Field>
              </div>
              <Field label="Any competitors? What do they do well or poorly?">
                <Textarea rows={2} value={form.competitors} onChange={(e) => update('competitors', e.target.value)} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Top workflows users need to complete">
                <Textarea rows={2} value={form.primary_workflows} onChange={(e) => update('primary_workflows', e.target.value)} placeholder="e.g. Create proposal → send to client → track approval" />
              </Field>
              <Field label="Who uses the app? (admin, staff, customers...) Do they need different views?">
                <Textarea rows={2} value={form.user_types} onChange={(e) => update('user_types', e.target.value)} />
              </Field>
              <Field label="What information must the app capture and store?">
                <Textarea rows={2} value={form.data_to_collect} onChange={(e) => update('data_to_collect', e.target.value)} />
              </Field>
              <Field label="What do you need to see in dashboards/reports?">
                <Textarea rows={2} value={form.reports_needed} onChange={(e) => update('reports_needed', e.target.value)} />
              </Field>

              <Field label="Must-have features for launch">
                <CheckboxGrid
                  options={FEATURE_OPTIONS}
                  selected={form.must_have_features}
                  onToggle={(v) => toggleInList('must_have_features', v)}
                />
              </Field>
              <Field label="Nice-to-have features (fine to launch without)">
                <CheckboxGrid
                  options={FEATURE_OPTIONS.filter((f) => !form.must_have_features.includes(f))}
                  selected={form.nice_to_have_features}
                  onToggle={(v) => toggleInList('nice_to_have_features', v)}
                />
              </Field>
              <Field label="Explicitly out of scope (what you do NOT need)">
                <Textarea rows={2} value={form.out_of_scope} onChange={(e) => update('out_of_scope', e.target.value)} placeholder="e.g. no mobile app, no inventory management" />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Tools you currently use (Stripe, Square, Gmail, Zapier, etc.) and any pain points">
                <Textarea rows={2} value={form.existing_tools} onChange={(e) => update('existing_tools', e.target.value)} />
              </Field>
              <Field label="Integrations you'll need">
                <CheckboxGrid
                  options={INTEGRATION_OPTIONS}
                  selected={form.integrations_needed}
                  onToggle={(v) => toggleInList('integrations_needed', v)}
                />
              </Field>
              <Field label="Compliance/legal requirements, if any (HIPAA, GDPR, PCI...)">
                <Input value={form.compliance_needs} onChange={(e) => update('compliance_needs', e.target.value)} placeholder="e.g. none, or HIPAA" />
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Design style">
                  <Select value={form.design_style} onValueChange={(v) => update('design_style', v)}>
                    <SelectTrigger><SelectValue placeholder="Choose a style" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern_minimal">Modern / minimal</SelectItem>
                      <SelectItem value="professional_corporate">Professional / corporate</SelectItem>
                      <SelectItem value="playful_creative">Playful / creative</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Device focus">
                  <Select value={form.device_focus} onValueChange={(v) => update('device_focus', v)}>
                    <SelectTrigger><SelectValue placeholder="Choose a focus" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile_first">Mobile-first</SelectItem>
                      <SelectItem value="desktop_first">Desktop-first</SelectItem>
                      <SelectItem value="both">Both equally</SelectItem>
                      <SelectItem value="not_sure">Not sure</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Design inspiration (links to sites/apps you like)">
                <Input value={form.design_inspiration} onChange={(e) => update('design_inspiration', e.target.value)} />
              </Field>
              <Field label="Accessibility needs, if any">
                <Input value={form.accessibility_needs} onChange={(e) => update('accessibility_needs', e.target.value)} placeholder="e.g. none, or WCAG AA" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Ideal launch date">
                  <Input value={form.ideal_launch_date} onChange={(e) => update('ideal_launch_date', e.target.value)} placeholder="e.g. ASAP, or a date" />
                </Field>
                <Field label="Revisions you're expecting">
                  <Input value={form.revision_expectations} onChange={(e) => update('revision_expectations', e.target.value)} placeholder="e.g. 2 rounds" />
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-gray-200/60 dark:border-white/10 p-4">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Need training/documentation for your team?</span>
                <Switch checked={form.training_needed} onCheckedChange={(v) => update('training_needed', v)} />
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-gray-200/60 dark:border-white/10 p-4">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Want ongoing post-launch support included?</span>
                <Switch checked={form.ongoing_support_needed} onCheckedChange={(v) => update('ongoing_support_needed', v)} />
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <Field label="Budget range *">
                <Select value={form.budget_range} onValueChange={(v) => update('budget_range', v)}>
                  <SelectTrigger><SelectValue placeholder="Select a range" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BUDGET_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Preferred pricing model">
                <Select value={form.pricing_model_preference} onValueChange={(v) => update('pricing_model_preference', v)}>
                  <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed project price</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="not_sure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Preferred payment schedule">
                <Select value={form.payment_schedule_preference} onValueChange={(v) => update('payment_schedule_preference', v)}>
                  <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fifty_fifty">50% upfront, 50% on launch</SelectItem>
                    <SelectItem value="thirds">Split across 3 milestones</SelectItem>
                    <SelectItem value="full_upfront">Full amount upfront</SelectItem>
                    <SelectItem value="not_sure">Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Payment itself (deposit, invoicing) is handled after we agree on a proposal — we'll follow up with details.
              </p>
            </>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 dark:border-white/10">
            <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || submitting} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} className="gap-1 bg-purple-600 hover:bg-purple-700">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitting} className="gap-1 bg-purple-600 hover:bg-purple-700">
                {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>) : (<>Submit Project Details</>)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>
      {children}
    </div>
  );
}

function CheckboxGrid({ options, selected, onToggle }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-2 cursor-pointer bg-white/60 dark:bg-white/5 backdrop-blur-sm px-3 py-2 rounded-2xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/10"
        >
          <Checkbox checked={selected.includes(option)} onCheckedChange={() => onToggle(option)} />
          <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{option}</span>
        </label>
      ))}
    </div>
  );
}