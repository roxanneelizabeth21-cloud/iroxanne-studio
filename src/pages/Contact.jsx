import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, PhoneCall, ArrowRight } from 'lucide-react';
import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', inquiry_type: 'general', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitting(true);
    try {
      const created = await base44.entities.ContactMessage.create(form);
      // Fire the admin email notification — non-blocking so the user isn't
      // delayed by email delivery. The record is already saved in the backend.
      base44.functions.invoke('sendContactNotification', {
        data: { ...created, id: created.id, created_date: created.created_date },
      }).catch(() => {});
      setDone(true);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-5 md:px-8 pt-[130px] pb-20">
        <p className="text-[13px] font-medium text-[#B8942E] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Contact</p>
        <h1 className="text-[34px] md:text-[42px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Get in touch</h1>
        <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
          Have a question or an idea? Send a message. I read every one personally and reply within 1 business day.
        </p>

        <div className="mt-6 flex items-start gap-4 rounded-2xl border border-[#2D2A4A]/10 bg-[#2D2A4A]/[0.03] p-5">
          <PhoneCall className="h-5 w-5 shrink-0 text-[#B8942E] mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Prefer to talk it through?</p>
            <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>Share a few details about your project, then pick a time for an optional call.</p>
            <a href="/quote" className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-[#2D2A4A] hover:text-[#3D3A5A] transition" style={{ fontFamily: "'Inter', sans-serif" }}>
              Schedule a call <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {done ? (
          <div className="mt-10 rounded-2xl border border-[#B8942E]/20 bg-card text-card-foreground p-10 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#B8942E]" />
            <p className="mt-4 text-[18px] font-semibold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Thanks, your message is on its way.</p>
            <p className="mt-1 text-[14px] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>I'll get back to you within 1 business day.</p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#2D2A4A]/6 bg-card text-card-foreground p-6 md:p-8 shadow-sm">
            <form onSubmit={submit} className="space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[13px] text-muted-foreground" htmlFor="c-name">Name *</Label><Input id="c-name" value={form.name} onChange={(e) => update('name', e.target.value)} required className="border-[#2D2A4A]/10 bg-background text-foreground focus:border-[#B8942E] focus:ring-[#B8942E]/20" /></div>
                <div className="space-y-1.5"><Label className="text-[13px] text-muted-foreground" htmlFor="c-email">Email *</Label><Input id="c-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="border-[#2D2A4A]/10 bg-background text-foreground focus:border-[#B8942E] focus:ring-[#B8942E]/20" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[13px] text-muted-foreground">Inquiry type</Label><Select value={form.inquiry_type} onValueChange={(v) => update('inquiry_type', v)}><SelectTrigger className="border-[#2D2A4A]/10 bg-background text-foreground"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="project">New project</SelectItem><SelectItem value="collaboration">Collaboration</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-[13px] text-muted-foreground" htmlFor="c-subject">Subject</Label><Input id="c-subject" value={form.subject} onChange={(e) => update('subject', e.target.value)} className="border-[#2D2A4A]/10 bg-background text-foreground focus:border-[#B8942E] focus:ring-[#B8942E]/20" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[13px] text-muted-foreground" htmlFor="c-msg">Message *</Label><Textarea id="c-msg" rows={5} value={form.message} onChange={(e) => update('message', e.target.value)} required className="border-[#2D2A4A]/10 bg-background text-foreground focus:border-[#B8942E] focus:ring-[#B8942E]/20" /></div>
              <Button type="submit" disabled={submitting} className="w-full h-12 rounded-full bg-[#2D2A4A] text-white text-[14px] font-semibold hover:bg-[#3D3A5A] shadow-sm">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Send Message
              </Button>
            </form>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}