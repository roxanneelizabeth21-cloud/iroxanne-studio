import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, Upload, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import BrandedPageHeader, { BrandedFooter } from '@/components/BrandedPageHeader';

import { intakeSteps, readableIntake } from '@/lib/intakeJourney';

const SECTION_LABELS = {
  basics: 'Your Idea / Business', brand: 'Brand & Design', home: 'Home Page',
  about: 'About Page', services: 'Services & Pricing', gallery: 'Gallery / Portfolio',
  testimonials: 'Testimonials', contact: 'Contact Info', legal: 'Legal & Policies',
  workflow: 'How Your App Could Work', data: 'Data & Automations', documents: 'Documents & Templates', notes: 'Anything Else',
};

const SECTION_DESCRIPTIONS = {
  basics: 'Share what you know. A working name is enough; contact details and socials for your new project can come later.',
  brand: 'Share existing branding or describe what you like. No logo or colors yet? Tell me you need help choosing.',
  home: 'Hero section — the first thing visitors see.',
  about: 'Your story, bio, and credentials.',
  services: 'What you offer, descriptions, and pricing (if public).',
  gallery: 'Upload any relevant photos you already have. Starting out with no portfolio? Leave this section blank.',
  testimonials: 'Existing client quotes and reviews, if you have them. New projects can skip this section.',
  contact: 'How clients should reach you.',
  legal: 'Terms, privacy policy, refund policy — paste if you have them.',
  workflow: 'Describe what you imagine someone doing in your app. You do not need an existing business process or a technical plan.',
  data: 'What you might need to keep track of or automate. It is fine to ask for recommendations.',
  documents: 'Upload documents you already have, if any. Leave this blank if you are starting from scratch.',
  notes: 'Anything else you want us to know.',
};

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function FileUploadField({ label, hint, multiple, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const handleChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url: url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(url);
      }
      onUpload(urls);
      toast.success(`${urls.length} file(s) uploaded`);
    } catch (err) { toast.error('Upload failed — try again'); }
    finally { setUploading(false); e.target.value = ''; }
  };
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:border-purple-400 transition-colors w-full justify-center">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Choose files'}
          <input type="file" className="hidden" multiple={multiple} onChange={handleChange} disabled={uploading} />
        </label>
      </div>
    </Field>
  );
}

function Section({ label, description, children }) {
  return <section className="rounded-3xl border border-border bg-card text-card-foreground p-6 sm:p-8 shadow-sm"><h2 className="font-display text-2xl mb-2">{label}</h2><p className="text-sm text-muted-foreground mb-7 leading-relaxed">{description}</p><div className="space-y-5">{children}</div></section>;
}
function Choices({ label, value, options, onChange, multiple = false }) {
  return <fieldset className="space-y-3"><legend className="font-medium mb-3">{label}</legend><div className="grid sm:grid-cols-2 gap-3">{options.map(([key,text])=><label key={key} className="flex items-center gap-3 rounded-2xl border border-border p-4 cursor-pointer has-[:checked]:border-[#B69A59] has-[:checked]:bg-secondary"><input type={multiple?'checkbox':'radio'} name={label} checked={multiple?(value||[]).includes(key):value===key} onChange={()=>onChange(multiple?((value||[]).includes(key)?value.filter(v=>v!==key):[...(value||[]),key]):key)} className="accent-[#6B4B68]"/><span className="text-sm">{text}</span></label>)}</div></fieldset>;
}

export default function ClientIntakeForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = params.get('t') || '';

  const [intake, setIntake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState('welcome');
  const [dirty, setDirty] = useState(false);
  useEffect(() => { const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('intakeJourney', { action: 'get', id, token });
        const match = res.data.record;
        setStep(intakeSteps(match.journey_profile).includes(match.journey_step) ? match.journey_step : 'welcome');
        if (!match) { setError('Invalid or expired link.'); return; }
        if (match.status === 'submitted' || match.status === 'reviewed') { setSubmitted(true); }
        setIntake(match);
      } catch (e) { setError('Could not load the intake form.'); }
      finally { setLoading(false); }
    })();
  }, [id, token]);

  const patch = useCallback((field, value) => {
    setDirty(true); setIntake((prev) => ({ ...prev, [field]: value }));
  }, []);
  const patchNested = useCallback((section, field, value) => {
    setDirty(true); setIntake((prev) => ({ ...prev, [section]: { ...(prev[section] || {}), [field]: value } }));
  }, []);

  const handleSave = async (final = false, nextStep = step) => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('intakeJourney', { action: final ? 'submit' : 'save', id, token, answers: { ...intake, journey_step: nextStep } });
      if (res.data.error) throw new Error(res.data.error);
      setDirty(false);
      if (final) { setSubmitted(true); toast.success('Submitted! We\'ll review and get started.'); }
      else { toast.success('Progress saved'); }
      return true;
    } catch (e) { toast.error('Save failed. Your answers are still here; please try again.'); return false; }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center ir-app-bg"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center ir-app-bg px-4"><div className="max-w-md text-center bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[22px] p-10 border border-black/5 dark:border-white/10 shadow-lg"><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{error}</p></div></div>;
  if (submitted) return <div className="min-h-screen flex items-center justify-center ir-app-bg px-4"><div className="max-w-md text-center bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[22px] p-10 border border-black/5 dark:border-white/10 shadow-lg"><CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-green-500" /><h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">All set, {intake.client_name?.split(' ')[0] || 'there'}!</h1><p className="text-gray-600 dark:text-gray-400">We've received your content. We'll review everything and reach out if we have any questions before we start building.</p></div></div>;

  const profile = intake.journey_profile || {};
  const steps = intakeSteps(profile);
  const position = Math.max(0, steps.indexOf(step));
  const sections = [step];
  const isCustom = true;
  const isBusiness = true;
  const toggleSection = () => {};
  const openSections = Object.fromEntries(steps.map(s => [s,true]));
  const go = async next => { if (await handleSave(false,next)) { setStep(next); window.scrollTo({top:0,behavior:'smooth'}); } };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <BrandedPageHeader
            title="Tell me about your project"
            subtitle="A little at a time. We’ll work through the rest together."
            projectTitle={intake.project_title}
            clientName={intake.client_name}
          />
          <p className="text-sm text-muted-foreground mt-4">An early idea is enough. You do not need a logo, website, customers, finished copy, or a feature list. Write “not sure yet” wherever you need guidance.</p>
        </div>

        <div aria-live="polite" className="space-y-3"><p className="text-xs tracking-widest uppercase text-muted-foreground">Step {position+1} of {steps.length} · {step==='welcome'?'Welcome':step==='idea'?'Your idea':step==='review'?'Review':SECTION_LABELS[step]}</p><div role="progressbar" aria-label="Intake progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={position+1} className="h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-[#B69A59] transition-all" style={{width:((position+1)/steps.length*100)+'%'}}/></div></div>
        {step==='welcome' && <Section label="A good place to begin" description="You don’t need to have everything figured out. These choices help me ask only what matters to your project.">
          <Choices label="Where are you starting?" value={profile.start} onChange={v=>patchNested('journey_profile','start',v)} options={[["idea","I have an idea"],["new","I’m starting a business"],["business","I run a business"],["existing","I already started an app"]]}/>
          <Choices label="Do you have content to share?" value={profile.content} onChange={v=>patchNested('journey_profile','content',v)} options={[["ready","Yes, I have some content or files"],["help","I need help putting it together"]]}/>
          <Choices label="Will we connect tools you already use?" value={profile.connections} onChange={v=>patchNested('journey_profile','connections',v)} options={[["yes","Yes, I have tools to connect"],["unsure","Not sure yet / starting fresh"]]}/>
          <Choices multiple label="Which content would you like to include? (Optional)" value={profile.features} onChange={v=>patchNested('journey_profile','features',v)} options={[["services","Services or packages"],["gallery","Photos or portfolio"],["testimonials","Reviews I already have"],["contact","Public contact details"]]}/>
          <p className="text-sm text-muted-foreground">Unsure? Continue with the shorter path. You can come back and change these choices.</p>
        </Section>}
        {step==='idea' && <Section label="Your idea" description="A few sentences are enough. A working name is welcome, too.">
          <Field label="Business or project name"><Input value={intake.business_name||''} onChange={e=>patch('business_name',e.target.value)} placeholder="Working name or not decided yet"/></Field>
          <Field label="What would you like to create or improve?"><Textarea rows={4} value={profile.idea||''} onChange={e=>patchNested('journey_profile','idea',e.target.value)} placeholder="Tell me in your own words. No technical terms needed."/></Field>
          <Field label="Who would this help?"><Textarea rows={3} value={profile.audience||''} onChange={e=>patchNested('journey_profile','audience',e.target.value)} placeholder="Your customers, a community, your team, or still exploring"/></Field>
        </Section>}
        {step==='review' && <Section label="Ready when you are" description="Review what you’ve shared. Blank answers are fine. Use Back to make changes, or send this to Roxanne.">
          {Object.entries(intake).filter(([k,v])=>!['id','client_name','project_title','project_tier','status','journey_step'].includes(k)&&readableIntake(v)).map(([k,v])=><div key={k} className="border-b border-border pb-4"><h3 className="text-sm font-semibold capitalize mb-1">{k.replaceAll('_',' ')}</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{readableIntake(v)}</p></div>)}
          <Button variant="outline" disabled={saving} onClick={()=>go('welcome')}>Edit my choices</Button>
        </Section>}
        {sections.includes('basics') && (
          <Section id="basics" label={SECTION_LABELS.basics} description={SECTION_DESCRIPTIONS.basics} open={!!openSections.basics} onToggle={() => toggleSection('basics')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Business or project name (optional)"><Input value={intake.business_name || ''} onChange={(e) => patch('business_name', e.target.value)} placeholder="Working name, undecided, or leave blank" /></Field>
              <Field label="Tagline or slogan (if you have one)"><Input value={intake.tagline || ''} onChange={(e) => patch('tagline', e.target.value)} placeholder="e.g. Custom apps for small businesses" /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Phone"><Input value={intake.phone || ''} onChange={(e) => patch('phone', e.target.value)} placeholder="(555) 555-5555" /></Field>
              <Field label="Email to show on site"><Input value={intake.email_for_site || ''} onChange={(e) => patch('email_for_site', e.target.value)} placeholder="hello@yourbusiness.com" /></Field>
            </div>
            <Field label="Business address (if applicable)"><Input value={intake.address || ''} onChange={(e) => patch('address', e.target.value)} placeholder="City, State or full address" /></Field>
            <Field label="Social media links" hint="Paste your URLs — Instagram, Facebook, TikTok, YouTube, LinkedIn, etc."><Textarea rows={3} value={typeof intake.social_links === 'string' ? intake.social_links : JSON.stringify(intake.social_links || '', null, 2)} onChange={(e) => patch('social_links', { links: e.target.value })} placeholder="Instagram: https://instagram.com/yourbiz&#10;Facebook: https://facebook.com/yourbiz" /></Field>
          </Section>
        )}

        {sections.includes('brand') && (
          <Section id="brand" label={SECTION_LABELS.brand} description={SECTION_DESCRIPTIONS.brand} open={!!openSections.brand} onToggle={() => toggleSection('brand')}>
            <FileUploadField label="Logo" hint="Optional. If you already have a logo, PNG or SVG is preferred." onUpload={(urls) => patch('logo_url', urls[0])} />
            {intake.logo_url && <img src={intake.logo_url} alt="Logo" className="h-16 object-contain rounded-lg" />}
            <FileUploadField label="Headshot / portrait" hint="A professional photo of you for the About page" onUpload={(urls) => patch('headshot_url', urls[0])} />
            {intake.headshot_url && <img src={intake.headshot_url} alt="Headshot" className="h-20 w-20 object-cover rounded-full" />}
            <Field label="Brand colors" hint="Hex codes, color names, or just describe the vibe (e.g. 'teal, gold, and cream')"><Input value={intake.brand_colors || ''} onChange={(e) => patch('brand_colors', e.target.value)} placeholder="#2D2A4A, #C9A84C, cream" /></Field>
            <Field label="Design notes" hint="Fonts you love, mood/vibe, websites you admire, anything about how it should look and feel"><Textarea rows={3} value={intake.design_notes || ''} onChange={(e) => patch('design_notes', e.target.value)} placeholder="I want it to feel elegant but approachable. I love the look of creativelyhisevents.com." /></Field>
          </Section>
        )}

        {sections.includes('home') && (
          <Section id="home" label={SECTION_LABELS.home} description={SECTION_DESCRIPTIONS.home} open={!!openSections.home} onToggle={() => toggleSection('home')}>
            <Field label="Hero headline" hint="The big text visitors see first"><Input value={intake.page_home?.hero_headline || ''} onChange={(e) => patchNested('page_home', 'hero_headline', e.target.value)} placeholder="e.g. Custom Event Staging That Tells Your Story" /></Field>
            <Field label="Hero subtext" hint="1-2 sentences below the headline"><Textarea rows={2} value={intake.page_home?.hero_subtext || ''} onChange={(e) => patchNested('page_home', 'hero_subtext', e.target.value)} placeholder="From concept to execution, we bring your vision to life..." /></Field>
            <Field label="Call-to-action button text"><Input value={intake.page_home?.hero_cta_text || ''} onChange={(e) => patchNested('page_home', 'hero_cta_text', e.target.value)} placeholder="e.g. Book a Consultation, Get a Quote, Shop Now" /></Field>
            <FileUploadField label="Hero image" hint="The main background or banner image" onUpload={(urls) => patchNested('page_home', 'hero_image_url', urls[0])} />
            <Field label="Additional sections or text for the home page"><Textarea rows={3} value={intake.page_home?.sections || ''} onChange={(e) => patchNested('page_home', 'sections', e.target.value)} placeholder="Any other sections — featured services, recent work, stats, etc." /></Field>
          </Section>
        )}

        {sections.includes('about') && (
          <Section id="about" label={SECTION_LABELS.about} description={SECTION_DESCRIPTIONS.about} open={!!openSections.about} onToggle={() => toggleSection('about')}>
            <Field label="Your bio / story" hint="Who you are, how you started, your mission. Write as much as you want — we'll format it."><Textarea rows={5} value={intake.page_about?.bio || ''} onChange={(e) => patchNested('page_about', 'bio', e.target.value)} placeholder="I started this business because..." /></Field>
            <Field label="Credentials, awards, certifications"><Textarea rows={2} value={intake.page_about?.credentials || ''} onChange={(e) => patchNested('page_about', 'credentials', e.target.value)} placeholder="e.g. 10+ years in event design, certified florist, featured in..." /></Field>
            <FileUploadField label="Additional photos for the About page" hint="Team photos, workspace, behind-the-scenes" multiple onUpload={(urls) => patchNested('page_about', 'photo_urls', [...(intake.page_about?.photo_urls || []), ...urls])} />
            {(intake.page_about?.photo_urls || []).length > 0 && <p className="text-xs text-green-600">{intake.page_about.photo_urls.length} photo(s) uploaded</p>}
          </Section>
        )}

        {sections.includes('services') && (
          <Section id="services" label={SECTION_LABELS.services} description={SECTION_DESCRIPTIONS.services} open={!!openSections.services} onToggle={() => toggleSection('services')}>
            <Field label="Services list" hint="List each service with a description. Include pricing if you want it public."><Textarea rows={6} value={intake.page_services?.services_text || ''} onChange={(e) => patchNested('page_services', 'services_text', e.target.value)} placeholder="1. Full Event Styling — Complete design and setup from concept to strike. Starting at $X.&#10;2. Partial Styling — You provide the vision, we execute day-of.&#10;3. Rental Only — Inventory rental with delivery and pickup." /></Field>
            <Field label="Packages or bundles (if applicable)"><Textarea rows={3} value={intake.page_services?.packages_text || ''} onChange={(e) => patchNested('page_services', 'packages_text', e.target.value)} placeholder="Gold Package: includes X, Y, Z — $X&#10;Silver Package: includes..." /></Field>
          </Section>
        )}

        {sections.includes('gallery') && (
          <Section id="gallery" label={SECTION_LABELS.gallery} description={SECTION_DESCRIPTIONS.gallery} open={!!openSections.gallery} onToggle={() => toggleSection('gallery')}>
            <FileUploadField label="Gallery images" hint="Optional. Upload available photos, or skip if you are just starting." multiple onUpload={(urls) => patchNested('page_gallery', 'photo_urls', [...(intake.page_gallery?.photo_urls || []), ...urls])} />
            {(intake.page_gallery?.photo_urls || []).length > 0 && <p className="text-xs text-green-600">{intake.page_gallery.photo_urls.length} photo(s) uploaded</p>}
            <Field label="Captions or descriptions" hint="Describe what's in the photos — event names, product names, etc."><Textarea rows={3} value={intake.page_gallery?.captions || ''} onChange={(e) => patchNested('page_gallery', 'captions', e.target.value)} placeholder="Photo 1: Johnson Wedding — gold and ivory theme&#10;Photo 2: Corporate gala at The Grand Hall" /></Field>
            <Field label="How should the gallery be organized?" hint="By event type, product category, date, etc."><Input value={intake.page_gallery?.categories || ''} onChange={(e) => patchNested('page_gallery', 'categories', e.target.value)} placeholder="e.g. Weddings, Corporate, Birthday Parties" /></Field>
          </Section>
        )}

        {sections.includes('testimonials') && (
          <Section id="testimonials" label={SECTION_LABELS.testimonials} description={SECTION_DESCRIPTIONS.testimonials} open={!!openSections.testimonials} onToggle={() => toggleSection('testimonials')}>
            <Field label="Client testimonials" hint="Paste quotes with the client's name. One per line or paragraph."><Textarea rows={5} value={intake.page_testimonials?.testimonials_text || ''} onChange={(e) => patchNested('page_testimonials', 'testimonials_text', e.target.value)} placeholder="&quot;Katrina transformed our venue into something magical. Every detail was perfect.&quot; — Sarah J., Bride&#10;&#10;&quot;Professional, creative, and easy to work with.&quot; — Marcus T., Corporate Event Manager" /></Field>
          </Section>
        )}

        {sections.includes('contact') && (
          <Section id="contact" label={SECTION_LABELS.contact} description={SECTION_DESCRIPTIONS.contact} open={!!openSections.contact} onToggle={() => toggleSection('contact')}>
            <Field label="Preferred contact method"><Input value={intake.page_contact?.preferred_contact_method || ''} onChange={(e) => patchNested('page_contact', 'preferred_contact_method', e.target.value)} placeholder="e.g. Email, Phone, Instagram DM" /></Field>
            <Field label="Contact form fields" hint="What should clients fill out when they reach out?"><Textarea rows={2} value={intake.page_contact?.contact_form_fields || ''} onChange={(e) => patchNested('page_contact', 'contact_form_fields', e.target.value)} placeholder="Name, email, event date, event type, budget range, message" /></Field>
            <Field label="Office hours / availability"><Input value={intake.page_contact?.office_hours || ''} onChange={(e) => patchNested('page_contact', 'office_hours', e.target.value)} placeholder="Mon-Fri 9am-5pm EST, weekends by appointment" /></Field>
          </Section>
        )}

        {sections.includes('legal') && (
          <Section id="legal" label={SECTION_LABELS.legal} description={SECTION_DESCRIPTIONS.legal} open={!!openSections.legal} onToggle={() => toggleSection('legal')}>
            <Field label="Terms of service / agreement"><Textarea rows={4} value={intake.page_legal?.terms_text || ''} onChange={(e) => patchNested('page_legal', 'terms_text', e.target.value)} placeholder="Paste your terms here, or write 'need help creating these'" /></Field>
            <Field label="Privacy policy"><Textarea rows={3} value={intake.page_legal?.privacy_text || ''} onChange={(e) => patchNested('page_legal', 'privacy_text', e.target.value)} placeholder="Paste or write 'need help'" /></Field>
            <Field label="Refund / cancellation policy"><Textarea rows={3} value={intake.page_legal?.refund_policy || ''} onChange={(e) => patchNested('page_legal', 'refund_policy', e.target.value)} placeholder="Describe your refund and cancellation policy" /></Field>
          </Section>
        )}

        {sections.includes('workflow') && (
          <Section id="workflow" label={SECTION_LABELS.workflow} description={SECTION_DESCRIPTIONS.workflow} open={!!openSections.workflow} onToggle={() => toggleSection('workflow')}>
            <Field label="What would you like someone to do in your app?" hint="Describe a possible first visit, booking, purchase, or other goal. If you are unsure, say what you want to achieve and I will help map the steps."><Textarea rows={8} value={intake.workflow_description || ''} onChange={(e) => patch('workflow_description', e.target.value)} placeholder="1. Client fills out an inquiry form on my website&#10;2. I review and send a quote within 24 hours&#10;3. Client approves quote, pays 50% retainer via Square&#10;4. I begin work — usually takes 2-3 weeks&#10;5. Client reviews, we do 1-2 rounds of changes&#10;6. Final payment, then I hand over everything" /></Field>
            <Field label="User roles" hint="Who uses the system and what should each role be able to do?"><Textarea rows={4} value={intake.user_roles || ''} onChange={(e) => patch('user_roles', e.target.value)} placeholder="Admin (me): see everything, manage orders, send invoices&#10;Client: view their order, track status, upload photos&#10;Staff: view assigned tasks, update status" /></Field>
            <Field label="Business rules" hint="Pricing rules, deposit %, rush fees, discounts, deadlines — anything the system should know"><Textarea rows={4} value={intake.business_rules || ''} onChange={(e) => patch('business_rules', e.target.value)} placeholder="50% deposit required to start&#10;Rush fee: 25% extra for under 2 weeks&#10;10% discount for returning clients" /></Field>
          </Section>
        )}

        {sections.includes('data') && (
          <Section id="data" label={SECTION_LABELS.data} description={SECTION_DESCRIPTIONS.data} open={!!openSections.data} onToggle={() => toggleSection('data')}>
            <Field label="What might you need to keep track of?" hint="For example: people, bookings, orders or messages. Existing systems are not required; not sure yet is a useful answer."><Textarea rows={4} value={intake.data_tracked || ''} onChange={(e) => patch('data_tracked', e.target.value)} placeholder="I track orders in a Google Sheet, invoices in QuickBooks, appointments in Google Calendar, inventory on paper" /></Field>
            <Field label="What should happen automatically?" hint="Emails when someone books? Status updates? Payment reminders? Low stock alerts?"><Textarea rows={4} value={intake.automations_wanted || ''} onChange={(e) => patch('automations_wanted', e.target.value)} placeholder="Send confirmation email when client pays&#10;Remind me 3 days before an event&#10;Alert me when inventory is low" /></Field>
            <Field label="Existing tools to keep or replace (skip if starting fresh)"><Textarea rows={3} value={intake.existing_tools || ''} onChange={(e) => patch('existing_tools', e.target.value)} placeholder="Keep: Square for payments, Google Calendar&#10;Replace: the spreadsheet, the paper contracts" /></Field>
          </Section>
        )}

        {sections.includes('documents') && (
          <Section id="documents" label={SECTION_LABELS.documents} description={SECTION_DESCRIPTIONS.documents} open={!!openSections.documents} onToggle={() => toggleSection('documents')}>
            <FileUploadField label="Upload documents" hint="Contracts, agreements, checklists, intake forms, price lists — anything you currently give to clients" multiple onUpload={(urls) => patch('documents_urls', [...(intake.documents_urls || []), ...urls])} />
            {(intake.documents_urls || []).length > 0 && <p className="text-xs text-green-600">{intake.documents_urls.length} document(s) uploaded</p>}
            <Field label="What is each document and how do you use it?" hint="Help us understand what each uploaded file is for"><Textarea rows={4} value={intake.documents_notes || ''} onChange={(e) => patch('documents_notes', e.target.value)} placeholder="1. Standard Agreement — sent to every client after they approve the quote&#10;2. Day-Of Checklist — used at delivery and pickup to track inventory&#10;3. Media Release — signed by clients to use event photos in marketing" /></Field>
          </Section>
        )}

        {sections.includes('notes') && (
          <Section id="notes" label={SECTION_LABELS.notes} description={SECTION_DESCRIPTIONS.notes} open={!!openSections.notes} onToggle={() => toggleSection('notes')}>
            <Field label="Additional pages or sections"><Textarea rows={3} value={intake.additional_pages || ''} onChange={(e) => patch('additional_pages', e.target.value)} placeholder="e.g. FAQ page, blog, booking calendar, track-your-order page" /></Field>
            <Field label="What do you need help figuring out?" hint="Your idea, audience, features, branding, content or launch plan — tell me where you would like guidance."><Textarea rows={3} value={intake.additional_notes || ''} onChange={(e) => patch('additional_notes', e.target.value)} placeholder="Anything we haven't covered that you want us to know" /></Field>
          </Section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="ghost" disabled={saving||position===0} onClick={()=>go(steps[position-1])}><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button>
          <Button variant="outline" disabled={saving} onClick={()=>handleSave(false)}>Save & return later</Button>
          <Button disabled={saving} className="rounded-full px-6" onClick={()=>step==='review'?handleSave(true):go(steps[position+1])}>{saving?<Loader2 className="w-4 h-4 animate-spin"/>:step==='review'?'Send to Roxanne':<>Continue<ArrowRight className="w-4 h-4 ml-2"/></>}</Button>
        </div>
        <p role="status" className="text-xs text-center text-muted-foreground">{dirty?'You have unsaved answers.':'Your saved answers will be here when you return using the same private link.'} Continue saves your progress.</p>
        <BrandedFooter />
      </div>
    </div>
  );
}
