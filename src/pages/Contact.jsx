import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, Mail } from 'lucide-react';
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
      await base44.entities.ContactMessage.create(form);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-6 pt-[140px] pb-20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-sans text-3xl font-bold tracking-tight">Get in touch</h1>
        </div>
        <p className="mt-3 text-muted-foreground">
          Have a question or an idea? Send a message — I read every one personally.
        </p>

        {done ? (
          <div className="mt-10 rounded-2xl border border-green-500/30 bg-green-500/5 p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
            <p className="mt-3 font-semibold">Thanks — your message is on its way.</p>
            <p className="mt-1 text-sm text-muted-foreground">I'll get back to you within 1 business day.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">Name *</Label>
                <Input id="contact-name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">Email *</Label>
                <Input id="contact-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Inquiry type</Label>
                <Select value={form.inquiry_type} onValueChange={(v) => update('inquiry_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="collaboration">Collaboration</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input id="contact-subject" value={form.subject} onChange={(e) => update('subject', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-message">Message *</Label>
              <Textarea id="contact-message" rows={5} value={form.message} onChange={(e) => update('message', e.target.value)} required />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Message
            </Button>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}