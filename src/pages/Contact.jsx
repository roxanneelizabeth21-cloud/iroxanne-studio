import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2 } from 'lucide-react';
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
    try { await base44.entities.ContactMessage.create(form); setDone(true); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A4A]">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-5 md:px-8 pt-[130px] pb-20">
        <p className="text-[13px] font-medium text-[#B8942E] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Contact</p>
        <h1 className="text-[34px] md:text-[42px] font-semibold text-[#2D2A4A] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Get in touch</h1>
        <p className="mt-3 text-[15px] text-[#2D2A4A]/50 leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
          Have a question or an idea? Send a message. I read every one personally and reply within 1 business day.
        </p>

        {done ? (
          <div className="mt-10 rounded-2xl border border-[#B8942E]/20 bg-white p-10 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#B8942E]" />
            <p className="mt-4 text-[18px] font-semibold text-[#2D2A4A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Thanks, your message is on its way.</p>
            <p className="mt-1 text-[14px] text-[#2D2A4A]/45" style={{ fontFamily: "'Inter', sans-serif" }}>I'll get back to you within 1 business day.</p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#2D2A4A]/6 bg-white p-6 md:p-8 shadow-sm">
            <form onSubmit={submit} className="space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[13px] text-[#2D2A4A]/70" htmlFor="c-name">Name *</Label><Input id="c-name" value={form.name} onChange={(e) => update('name', e.target.value)} required className="border-[#2D2A4A]/10 bg-[#FAF7F0]/50 focus:border-[#B8942E] focus:ring-[#B8942E]/20" /></div>
                <div className="space-y-1.5"><Label className="text-[13px] text-[#2D2A4A]/70" htmlFor="c-email">Email *</Label><Input id="c-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="border-[#2D2A4A]/10 bg-[#FAF7F0]/50 focus:border-[#B8942E] focus:ring-[#B8942E]/20" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[13px] text-[#2D2A4A]/70">Inquiry type</Label><Select value={form.inquiry_type} onValueChange={(v) => update('inquiry_type', v)}><SelectTrigger className="border-[#2D2A4A]/10 bg-[#FAF7F0]/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="project">New project</SelectItem><SelectItem value="collaboration">Collaboration</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-[13px] text-[#2D2A4A]/70" htmlFor="c-subject">Subject</Label><Input id="c-subject" value={form.subject} onChange={(e) => update('subject', e.target.value)} className="border-[#2D2A4A]/10 bg-[#FAF7F0]/50 focus:border-[#B8942E] focus:ring-[#B8942E]/20" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[13px] text-[#2D2A4A]/70" htmlFor="c-msg">Message *</Label><Textarea id="c-msg" rows={5} value={form.message} onChange={(e) => update('message', e.target.value)} required className="border-[#2D2A4A]/10 bg-[#FAF7F0]/50 focus:border-[#B8942E] focus:ring-[#B8942E]/20" /></div>
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