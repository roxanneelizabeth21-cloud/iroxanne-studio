import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, Upload, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import BrandedPageHeader, { PrintButton, BrandedFooter } from '@/components/BrandedPageHeader';

const TIER_LABELS = { starter: 'Starter', business: 'Business', custom: 'Custom' };

const SECTION_ORDER = {
  starter: ['basics', 'brand', 'home', 'about', 'gallery', 'contact', 'notes'],
  business: ['basics', 'brand', 'home', 'about', 'services', 'gallery', 'testimonials', 'contact', 'legal', 'notes'],
  custom: ['basics', 'brand', 'home', 'about', 'services', 'gallery', 'testimonials', 'contact', 'legal', 'workflow', 'data', 'documents', 'notes'],
};

const SECTION_LABELS = {
  basics: 'Business Info', brand: 'Brand & Design', home: 'Home Page',
  about: 'About Page', services: 'Services & Pricing', gallery: 'Gallery / Portfolio',
  testimonials: 'Testimonials', contact: 'Contact Info', legal: 'Legal & Policies',
  workflow: 'How Your Business Works', data: 'Data & Automations', documents: 'Documents & Templates', notes: 'Anything Else',
};

const SECTION_DESCRIPTIONS = {
  basics: 'The essentials — name, tagline, contact details, socials.',
  brand: 'Logo, colors, fonts, and design direction.',
  home: 'Hero section — the first thing visitors see.',
  about: 'Your story, bio, and credentials.',
  services: 'What you offer, descriptions, and pricing (if public).',
  gallery: 'Photos of your work — upload as many as you have.',
  testimonials: 'Client quotes and reviews.',
  contact: 'How clients should reach you.',
  legal: 'Terms, privacy policy, refund policy — paste if you have them.',
  workflow: 'Walk us through what happens when a client books, buys, or signs up. The more detail here, the faster we build.',
  data: 'What you track today, what should be automated, and which tools to integrate or replace.',
  documents: 'Upload your existing contracts, checklists, agreements, intake forms — anything you currently use on paper or in docs.',
  notes: 'Anything else you want us to know.',
};

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-500">{hint}</p>}
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
        const { url } = await base44.storage.uploadFile(file);
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

function Section({ id, label, description, open, onToggle, children }) {
  return (
    <div className="rounded-[18px] border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-xl overflow-hidden">
      <button type="button" onClick={onToggle} className="flex items-center justify-between w-full px-6 py-4 text-left">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{label}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{description}</p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 space-y-4 border-t border-black/5 dark:border-white/10 pt-4">{children}</div>}
    </div>
  );
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
  const [openSections, setOpenSections] = useState({ basics: true });

  useEffect(() => {
    (async () => {
      try {
        const records = await base44.entities.ClientIntake.list();
        const match = records.find((r) => r.id === id && r.access_token === token);
        if (!match) { setError('Invalid or expired link.'); return; }
        if (match.status === 'submitted' || match.status === 'reviewed') { setSubmitted(true); }
        setIntake(match);
      } catch (e) { setError('Could not load the intake form.'); }
      finally { setLoading(false); }
    })();
  }, [id, token]);

  const patch = useCallback((field, value) => {
    setIntake((prev) => ({ ...prev, [field]: value }));
  }, []);
  const patchNested = useCallback((section, field, value) => {
    setIntake((prev) => ({ ...prev, [section]: { ...(prev[section] || {}), [field]: value } }));
  }, []);
  const toggleSection = (s) => setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const handleSave = async (final = false) => {
    setSaving(true);
    try {
      const updates = { ...intake };
      delete updates.id; delete updates.created_date; delete updates.updated_date; delete updates.created_by;
      if (final) { updates.status = 'submitted'; updates.submitted_at = new Date().toISOString(); }
      else { updates.status = 'in_progress'; }
      await base44.entities.ClientIntake.update(intake.id, updates);
      if (final) { setSubmitted(true); toast.success('Submitted! We\'ll review and get started.'); }
      else { toast.success('Progress saved'); }
    } catch (e) { toast.error('Save failed — please try again'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center ir-app-bg"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center ir-app-bg px-4"><div className="max-w-md text-center bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[22px] p-10 border border-black/5 dark:border-white/10 shadow-lg"><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{error}</p></div></div>;
  if (submitted) return <div className="min-h-screen flex items-center justify-center ir-app-bg px-4"><div className="max-w-md text-center bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-[22px] p-10 border border-black/5 dark:border-white/10 shadow-lg"><CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-green-500" /><h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">All set, {intake.client_name?.split(' ')[0] || 'there'}!</h1><p className="text-gray-600 dark:text-gray-400">We've received your content. We'll review everything and reach out if we have any questions before we start building.</p></div></div>;

  const tier = intake.project_tier || 'business';
  const sections = SECTION_ORDER[tier] || SECTION_ORDER.business;
  const isCustom = tier === 'custom';
  const isBusiness = tier === 'business' || isCustom;

  return (
    <div className="min-h-screen ir-app-bg py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <BrandedPageHeader
            title="Content Intake"
            subtitle={`${TIER_LABELS[tier]} Project — fill in each section with your content, upload files, and save anytime.`}
            projectTitle={intake.project_title}
            clientName={intake.client_name}
          />
          <div className="flex justify-end mb-2"><PrintButton /></div>
        </div>

        {sections.includes('basics') && (
          <Section id="basics" label={SECTION_LABELS.basics} description={SECTION_DESCRIPTIONS.basics} open={!!openSections.basics} onToggle={() => toggleSection('basics')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Business name"><Input value={intake.business_name || ''} onChange={(e) => patch('business_name', e.target.value)} placeholder="Your business name" /></Field>
              <Field label="Tagline or slogan"><Input value={intake.tagline || ''} onChange={(e) => patch('tagline', e.target.value)} placeholder="e.g. Custom apps for small businesses" /></Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Phone"><Input value={intake.phone || ''} onChange={(e) => patch('phone', e.target.value)} placeholder="(555) 555-5555" /></Field>
              <Field label="Email to show on site"><Input value={intake.email_for_site || ''} onChange={(e) => patch('email_for_site', e.target.value)} placeholder="hello@yourbusiness.com" /></Field>
            </div>
            <Field label="Business address (if applicable)"><Input value={intake.address || ''} onChange={(e) => patch('address', e.target.value)} placeholder="City, State or full address" /></Field>
            <Field label="Social media links" hint="Paste your URLs — Instagram, Facebook, TikTok, YouTube, LinkedIn, etc."><Textarea rows={3} value={typeof intake.social_links === 'string' ? intake.social_links : JSON.stringify(intake.social_links || '', null, 2)} onChange={(e) => patch('social_links', e.target.value)} placeholder="Instagram: https://instagram.com/yourbiz&#10;Facebook: https://facebook.com/yourbiz" /></Field>
          </Section>
        )}

        {sections.includes('brand') && (
          <Section id="brand" label={SECTION_LABELS.brand} description={SECTION_DESCRIPTIONS.brand} open={!!openSections.brand} onToggle={() => toggleSection('brand')}>
            <FileUploadField label="Logo" hint="PNG or SVG preferred, transparent background if possible" onUpload={(urls) => patch('logo_url', urls[0])} />
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
            <FileUploadField label="Gallery images" hint="Upload your best work — 5-20 photos recommended" multiple onUpload={(urls) => patchNested('page_gallery', 'photo_urls', [...(intake.page_gallery?.photo_urls || []), ...urls])} />
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
            <Field label="Your process, step by step" hint="Walk us through what happens from first contact to delivery. This is the most important section for Custom projects."><Textarea rows={8} value={intake.workflow_description || ''} onChange={(e) => patch('workflow_description', e.target.value)} placeholder="1. Client fills out an inquiry form on my website&#10;2. I review and send a quote within 24 hours&#10;3. Client approves quote, pays 50% retainer via Square&#10;4. I begin work — usually takes 2-3 weeks&#10;5. Client reviews, we do 1-2 rounds of changes&#10;6. Final payment, then I hand over everything" /></Field>
            <Field label="User roles" hint="Who uses the system and what should each role be able to do?"><Textarea rows={4} value={intake.user_roles || ''} onChange={(e) => patch('user_roles', e.target.value)} placeholder="Admin (me): see everything, manage orders, send invoices&#10;Client: view their order, track status, upload photos&#10;Staff: view assigned tasks, update status" /></Field>
            <Field label="Business rules" hint="Pricing rules, deposit %, rush fees, discounts, deadlines — anything the system should know"><Textarea rows={4} value={intake.business_rules || ''} onChange={(e) => patch('business_rules', e.target.value)} placeholder="50% deposit required to start&#10;Rush fee: 25% extra for under 2 weeks&#10;10% discount for returning clients" /></Field>
          </Section>
        )}

        {sections.includes('data') && (
          <Section id="data" label={SECTION_LABELS.data} description={SECTION_DESCRIPTIONS.data} open={!!openSections.data} onToggle={() => toggleSection('data')}>
            <Field label="What do you currently track?" hint="Orders, clients, inventory, finances, appointments — what lives in spreadsheets or notebooks today?"><Textarea rows={4} value={intake.data_tracked || ''} onChange={(e) => patch('data_tracked', e.target.value)} placeholder="I track orders in a Google Sheet, invoices in QuickBooks, appointments in Google Calendar, inventory on paper" /></Field>
            <Field label="What should happen automatically?" hint="Emails when someone books? Status updates? Payment reminders? Low stock alerts?"><Textarea rows={4} value={intake.automations_wanted || ''} onChange={(e) => patch('automations_wanted', e.target.value)} placeholder="Send confirmation email when client pays&#10;Remind me 3 days before an event&#10;Alert me when inventory is low" /></Field>
            <Field label="Existing tools to keep or replace"><Textarea rows={3} value={intake.existing_tools || ''} onChange={(e) => patch('existing_tools', e.target.value)} placeholder="Keep: Square for payments, Google Calendar&#10;Replace: the spreadsheet, the paper contracts" /></Field>
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
            <Field label="Anything else"><Textarea rows={3} value={intake.additional_notes || ''} onChange={(e) => patch('additional_notes', e.target.value)} placeholder="Anything we haven't covered that you want us to know" /></Field>
          </Section>
        )}

        <div className="flex items-center justify-between gap-4 pt-2">
          <Button type="button" variant="outline" onClick={() => handleSave(false)} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Progress
          </Button>
          <Button type="button" onClick={() => handleSave(true)} disabled={saving} className="gap-1.5 bg-purple-600 hover:bg-purple-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Submit
          </Button>
        </div>
        <p className="text-xs text-center text-gray-500 dark:text-gray-500">You can save your progress and come back anytime using this same link.</p>
        <BrandedFooter />
      </div>
    </div>
  );
}
