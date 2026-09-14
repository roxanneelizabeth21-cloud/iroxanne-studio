import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { estimateProject } from '@/lib/estimateProject';

const FEATURE_OPTIONS = [
  'Online booking / scheduling',
  'Contact form / lead capture',
  'Photo gallery or portfolio',
  'Payment processing / invoicing',
  'Client portal / login area',
  'Email notifications',
  'Admin dashboard',
  'Social media links & embeds',
  'Blog or news section',
  'E-commerce / product listings',
  'AI assistant or smart features',
  'Inventory or order management',
  'Contracts / proposals / e-sign',
  'Budget or expense tracking',
];

const INTEGRATION_OPTIONS = [
  'Payments (Stripe/Square/Wix)',
  'Gmail / Google Calendar',
  'Zapier',
  'Email marketing (SendGrid/Mailchimp)',
  'SMS (Twilio)',
  'AI features (assistant, generator, insights)',
  'Other third-party API',
  'None yet',
];

const STEPS = ['About You', 'What You Need', 'Features & Integrations', 'Budget & Timeline'];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  business_name: '',
  business_type: '',
  website: '',
  quick_pitch: '',
  problem_to_solve: '',
  must_have_features: [],
  nice_to_have_features: [],
  integrations_needed: [],
  existing_tools: '',
  design_style: '',
  design_inspiration: '',
  ideal_launch_date: '',
  ongoing_support_needed: false,
  budget_range: '',
};

const BUDGET_LABELS = {
  under_1500: 'Under $1,500',
  '1500_3000': '$1,500 – $3,000',
  '3000_5000': '$3,000 – $5,000',
  '5000_8000': '$5,000 – $8,000',
  '8000_plus': '$8,000+',
  not_sure: 'Not sure yet',
};

export default function GetQuote() {
  const [step, setStep] = useState(0);
  const [verification,setVerification]=useState(null);
  const [emailVerified,setEmailVerified]=useState(false);
  const [verificationBusy,setVerificationBusy]=useState(false);
  const [emailCode,setEmailCode]=useState('');
  const [verificationMessage,setVerificationMessage]=useState('');
  const verifyEmail=async(action)=>{
    const email=form.email.trim().toLowerCase();
    if(!isEmailValid(email)){setVerificationMessage('Please enter a valid email address.');return;}
    setVerificationBusy(true);setVerificationMessage('');
    try{
      const response=await base44.functions.invoke('quoteEmailVerification',{action,email,...(action==='verify'?{id:verification?.id,secret:verification?.secret,code:emailCode}:{})});
      const result=response.data||response;
      if(result.error)throw new Error(result.error);
      if(action==='send'){setVerification(result);setEmailVerified(false);setEmailCode('');setVerificationMessage('Code sent. Check your inbox and spam folder. It expires in 10 minutes.');}
      else{setEmailVerified(true);setVerificationMessage('Email verified. Thank you!');}
    }catch(e){setVerificationMessage(e?.response?.data?.error||e.message||'Please try again.');}
    finally{setVerificationBusy(false);}
  };
  const [form, setForm] = useState(emptyForm);
  const [support, setSupport] = useState(() => {
    const choice = new URLSearchParams(window.location.search).get('support');
    return ['build', 'guidance'].includes(choice) ? choice : 'not_sure';
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingLink,setBookingLink] = useState('');
  const [bookingEnabled,setBookingEnabled] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(null);

  React.useEffect(() => {
    base44.functions.invoke('quoteCallBooking',{action:'config'}).then(r=>setBookingEnabled(!!(r.data||r).enabled)).catch(()=>{});
    base44.entities.PricingSettings.list()
      .then((list) => { if (list?.[0]?.rate_per_hour) setHourlyRate(list[0].rate_per_hour); })
      .catch(() => {});
  }, []);

  const update = (field, value) => {
    if(field==='email'){setVerification(null);setEmailVerified(false);setEmailCode('');setVerificationMessage('');}
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const toggleInList = (field, value) => {
    setForm((prev) => {
      const list = prev[field];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [field]: next };
    });
  };
  const isEmailValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const canAdvance = () => {
    if (step === 0) return form.name.trim() && form.email.trim() && isEmailValid(form.email) && emailVerified;
    if (step === 1) return form.quick_pitch.trim().length >= 5;
    return true;
  };
  const goNext = () => {
    if (!canAdvance()) {
      if (step === 0 && form.email.trim() && !isEmailValid(form.email)) { toast.error('Please enter a valid email address.'); return; }
      if(step===0&&!emailVerified){toast.error('Please verify your email using the code we send you.');return;}
      toast.error('Please fill in the required fields before continuing'); return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goBack = () => { setStep((s) => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const PHONE_DIGITS = (form.phone.match(/\d/g) || []).length;
  const handleSubmit = async () => {
    if (!emailVerified || !verification) { setStep(0); toast.error('Please verify your email first.'); return; }
    if (!form.budget_range) { toast.error('Please select a budget range'); return; }
    if (form.phone && PHONE_DIGITS < 7) { toast.error('Please enter a valid phone number, or leave it blank.'); return; }
    setSubmitting(true);
    try {
      const estimate = estimateProject({ mustHave: form.must_have_features, niceToHave: form.nice_to_have_features, integrations: form.integrations_needed, rate: hourlyRate });
      const bookingToken=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
      const response=await base44.functions.invoke('quoteEmailVerification',{action:'submit',id:verification.id,secret:verification.secret,email:form.email,lead:{
        booking_token:bookingToken,
        email: form.email, name: form.name, interested_apps: ['service_inquiry'], source: 'get_quote_form', request_type: 'quote_request', status: 'new',
        phone: form.phone, business_name: form.business_name, business_type: form.business_type, website: form.website, quick_pitch: `Support requested: ${support === 'build' ? 'App design and build' : support === 'guidance' ? 'Guidance while I build myself' : 'Help deciding'}\n\n${form.quick_pitch}`, problem_to_solve: form.problem_to_solve,
        must_have_features: form.must_have_features, nice_to_have_features: form.nice_to_have_features, integrations_needed: form.integrations_needed, existing_tools: form.existing_tools,
        design_style: form.design_style, design_inspiration: form.design_inspiration, ideal_launch_date: form.ideal_launch_date, ongoing_support_needed: form.ongoing_support_needed, budget_range: form.budget_range,
        estimated_tier: estimate.tier, estimated_hours_low: estimate.hoursLow, estimated_hours_high: estimate.hoursHigh, estimated_price_low: estimate.priceLow, estimated_price_high: estimate.priceHigh,
      }});
      const lead=response.data||response;
      if(lead.error)throw new Error(lead.error);
      setBookingLink('/book-call?lead='+encodeURIComponent(lead.id)+'&t='+encodeURIComponent(lead.booking_token));
      setSubmitted(true);
      base44.analytics.track({ eventName: 'quote_form_submitted' });
      toast.success("Got it! We'll follow up within 2 business days.");
    } catch (error) { console.error('Get a Quote submission error:', error); toast.error(error?.response?.data?.error||error.message||'Something went wrong. Please try again.'); if(error?.response?.status===403){setEmailVerified(false);setStep(0);} }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (<div className="min-h-screen flex items-center justify-center px-4 ir-app-bg"><div className="max-w-md text-center bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[22px] p-10 border border-black/5 dark:border-white/10 shadow-lg"><CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-green-500" /><h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Thanks, {form.name.split(' ')[0] || 'there'}!</h1><p className="text-gray-600 dark:text-gray-400">We've got your project details and verified your email address. We'll follow up within 2 business days to discuss your idea and next steps.</p>{bookingEnabled && <div className="mt-6 pt-6 border-t border-black/10"><p className="text-sm text-gray-600 mb-3">Want to talk through your project? Choose an available time for an optional call.</p><Button asChild className="rounded-full"><a href={bookingLink}>Schedule an optional call</a></Button><p className="text-xs text-gray-500 mt-3">You can also use the booking link in your confirmation email.</p></div>}</div></div>);
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[13px] font-medium text-[#B8942E] tracking-wide mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Get a Quote</p>
          <h1 className="text-[34px] md:text-[42px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Let’s Bring Your Idea to Life</h1>
          <p className="text-[15px] text-muted-foreground mt-3" style={{ fontFamily: "'Inter', sans-serif" }}>Starting with an idea, launching something new, or improving an existing business? You are welcome here. Share what you know; I can help you work out the rest. Only starred fields are required.</p>
        </div>
        <div className="flex items-center gap-2 mb-8">{STEPS.map((label, i) => (<div key={label} className="flex-1"><div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} /></div>))}</div>
        <p className="text-xs text-muted-foreground mb-6 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        <div className="bg-card text-card-foreground rounded-2xl p-6 md:p-8 border border-border shadow-sm space-y-5">
          {step === 0 && (<><div className="grid sm:grid-cols-2 gap-4"><Field label="Your name *" htmlFor="gq-name"><Input id="gq-name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jane Smith" /></Field><Field label="Email *" htmlFor="gq-email"><Input id="gq-email" type="email" autoComplete="email" disabled={verificationBusy} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jane@business.com" /></Field></div><div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm">Confirm this is the inbox where we can reach you.</p>
            {!emailVerified && <Button type="button" variant="outline" disabled={verificationBusy||!isEmailValid(form.email)} onClick={()=>verifyEmail('send')}>{verificationBusy?'Please wait…':verification?'Resend code':'Send verification code'}</Button>}
            {verification&&!emailVerified&&<div className="flex flex-wrap gap-2 items-end"><Field label="Six-digit email code" htmlFor="gq-code"><Input id="gq-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={emailCode} onChange={e=>setEmailCode(e.target.value.replace(/[^0-9]/g,''))} /></Field><Button type="button" disabled={verificationBusy||emailCode.length!==6} onClick={()=>verifyEmail('verify')}>Verify email</Button></div>}
            {emailVerified&&<p className="text-sm font-medium">✓ Email verified</p>}
            {verificationMessage&&<p role="status" className="text-sm">{verificationMessage}</p>}
            <p className="text-xs text-muted-foreground">Wrong address? Edit the email above and request a new code.</p>
          </div><div className="grid sm:grid-cols-2 gap-4"><Field label="Phone" htmlFor="gq-phone"><Input id="gq-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 555-5555" /></Field><Field label="Business or project name (optional)" htmlFor="gq-business-name"><Input id="gq-business-name" value={form.business_name} onChange={(e) => update('business_name', e.target.value)} placeholder="A working name is fine — or leave blank" /></Field></div><div className="grid sm:grid-cols-2 gap-4"><Field label="What area is your idea in? (optional)" htmlFor="gq-business-type"><Input id="gq-business-type" value={form.business_type} onChange={(e) => update('business_type', e.target.value)} placeholder="e.g. event planning, beauty, retail" /></Field><Field label="Existing website (if any)" htmlFor="gq-website"><Input id="gq-website" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" /></Field></div></>)}
          {step === 1 && (<><Field label="How would you like to work together?" htmlFor="gq-support"><Select value={support} onValueChange={setSupport}><SelectTrigger id="gq-support" aria-label="How would you like to work together?"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="build">I would like you to build my app</SelectItem><SelectItem value="guidance">I want to build it myself, with guidance</SelectItem><SelectItem value="not_sure">I am not sure yet — help me decide</SelectItem></SelectContent></Select></Field><Field label="Tell me about your idea, even if it is still taking shape *" htmlFor="gq-quick-pitch"><Textarea id="gq-quick-pitch" rows={3} value={form.quick_pitch} onChange={(e) => update('quick_pitch', e.target.value)} placeholder="e.g. I want to start a service for local families, but I need help deciding what the app should do." /></Field><Button type="button" variant="outline" onClick={() => update('quick_pitch', form.quick_pitch ? form.quick_pitch + '\nI would like help shaping the idea and choosing a first version.' : 'I have an early idea and need help deciding what to build.')}>I need help shaping my idea</Button><Field label="Who would this help, or what would you like to make possible?" htmlFor="gq-problem"><Textarea id="gq-problem" rows={2} value={form.problem_to_solve} onChange={(e) => update('problem_to_solve', e.target.value)} placeholder="Describe a goal, a problem, or the people you want to help. It is okay if you are still exploring." /></Field></>)}
          {step === 2 && (<><p className="text-sm text-foreground">Not sure what features or tools you need? Leave these blank and continue. We can choose a useful first version together.</p><Field label="Features you are considering (optional)"><CheckboxGrid options={FEATURE_OPTIONS} selected={form.must_have_features} onToggle={(v) => toggleInList('must_have_features', v)} /></Field><Field label="Nice-to-haves (fine to add later)"><CheckboxGrid options={FEATURE_OPTIONS.filter((f) => !form.must_have_features.includes(f))} selected={form.nice_to_have_features} onToggle={(v) => toggleInList('nice_to_have_features', v)} /></Field><Field label="Other tools the app might connect to (optional)"><CheckboxGrid options={INTEGRATION_OPTIONS} selected={form.integrations_needed} onToggle={(v) => toggleInList('integrations_needed', v)} /></Field><Field label="Existing tools or questions you need help with (optional)" htmlFor="gq-existing-tools"><Textarea id="gq-existing-tools" rows={2} value={form.existing_tools} onChange={(e) => update('existing_tools', e.target.value)} placeholder="Starting from scratch? Say so here, or share anything you need help choosing." /></Field></>)}
          {step === 3 && (<><Field label="Budget range *" htmlFor="gq-budget"><Select value={form.budget_range} onValueChange={(v) => update('budget_range', v)}><SelectTrigger id="gq-budget"><SelectValue placeholder="Select a range" /></SelectTrigger><SelectContent>{Object.entries(BUDGET_LABELS).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent></Select></Field><div className="grid sm:grid-cols-2 gap-4"><Field label="Design style" htmlFor="gq-design-style"><Select value={form.design_style} onValueChange={(v) => update('design_style', v)}><SelectTrigger id="gq-design-style"><SelectValue placeholder="Choose a style" /></SelectTrigger><SelectContent><SelectItem value="modern_minimal">Modern / minimal</SelectItem><SelectItem value="bold_creative">Bold / creative</SelectItem><SelectItem value="elegant_luxury">Elegant / luxury</SelectItem><SelectItem value="not_sure">Not sure, help me decide</SelectItem></SelectContent></Select></Field><Field label="Ideal launch date" htmlFor="gq-launch-date"><Input id="gq-launch-date" value={form.ideal_launch_date} onChange={(e) => update('ideal_launch_date', e.target.value)} placeholder="e.g. next month, flexible, or not sure yet" /></Field></div><Field label="Sites or apps you love the look of" htmlFor="gq-inspiration"><Input id="gq-inspiration" value={form.design_inspiration} onChange={(e) => update('design_inspiration', e.target.value)} placeholder="Paste links or describe the vibe" /></Field><div className="flex items-center justify-between rounded-[12px] border border-gray-200/60 dark:border-white/10 p-4"><span className="text-sm font-medium text-gray-900 dark:text-gray-100">Want ongoing support after launch?</span><Switch checked={form.ongoing_support_needed} onCheckedChange={(v) => update('ongoing_support_needed', v)} /></div><p className="text-xs text-muted-foreground">Scope, pricing, and payment terms depend on whether you need a full build or guidance. We will agree on these before paid work begins.</p></>)}
          <div className="flex items-center justify-between pt-4 border-t border-border"><Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || submitting} className="gap-1 rounded-full border-border"><ArrowLeft className="w-4 h-4" /> Back</Button>{step < STEPS.length - 1 ? (<Button type="button" onClick={goNext} className="gap-1 rounded-full bg-[#2D2A4A] text-white hover:bg-[#3D3A5A]">Next <ArrowRight className="w-4 h-4" /></Button>) : (<Button type="button" onClick={handleSubmit} disabled={submitting} className="gap-1 rounded-full bg-[#2D2A4A] text-white hover:bg-[#3D3A5A]">{submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>) : (<>Submit</>)}</Button>)}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }) { return (<div className="space-y-1.5"><label htmlFor={htmlFor} className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>{children}</div>); }
function CheckboxGrid({ options, selected, onToggle }) { return (<div className="grid sm:grid-cols-2 gap-2">{options.map((option) => (<label key={option} className="flex items-center gap-2 cursor-pointer bg-card text-card-foreground backdrop-blur-sm px-3 py-2 rounded-2xl hover:bg-accent transition-colors border border-black/5 dark:border-white/10"><Checkbox checked={selected.includes(option)} onCheckedChange={() => onToggle(option)} /><span className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{option}</span></label>))}</div>); }