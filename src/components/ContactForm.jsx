import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', inquiry_type: 'general', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSending(true);
    await base44.entities.ContactMessage.create(form);
    toast.success('Message sent! We\'ll be in touch. 💙');
    setForm({ name: '', email: '', inquiry_type: 'general', subject: '', message: '' });
    setSending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary/50 border-border/50" />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-secondary/50 border-border/50" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Inquiry Type</Label>
          <Select value={form.inquiry_type} onValueChange={(v) => setForm({ ...form, inquiry_type: v })}>
            <SelectTrigger className="bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="collaboration">Collaboration</SelectItem>
              <SelectItem value="media">Media / Press</SelectItem>
              <SelectItem value="booking">Booking</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input placeholder="What's this about?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="bg-secondary/50 border-border/50" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Message *</Label>
        <Textarea placeholder="Tell me what's on your mind..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="bg-secondary/50 border-border/50 min-h-[140px]" />
      </div>
      <Button type="submit" disabled={sending} className="w-full sm:w-auto glow-blue-sm h-12 px-8">
        {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
        Send Message
      </Button>
    </form>
  );
}