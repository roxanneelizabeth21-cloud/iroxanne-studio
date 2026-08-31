import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseUTMParams, isValidEmail } from '@/lib/analytics';
import { subscribeFan } from '@/hooks/useFanSubscribe';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const { utm_source, utm_medium, utm_campaign } = parseUTMParams(window.location.search);
      await subscribeFan({
        email: email.trim().toLowerCase(),
        source_slug: 'newsletter',
        utm_source,
        utm_medium,
        utm_campaign,
      });
      // Meta Pixel: Roxsan Music, ID 1723587952279278 — fire Lead on newsletter signup.
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('track', 'Lead');
      }
      try { sessionStorage.setItem('roxsan_session_subscribed', '1'); } catch { /* ignore */ }
      toast.success("You're on the list! 💙");
      setEmail('');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-4 py-5">
      <div
        className="max-w-4xl mx-auto rounded-2xl border border-primary/30 p-6 sm:p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
        style={{ background: 'linear-gradient(135deg, hsl(35 45% 45%) 0%, hsl(39 50% 58%) 100%)' }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/15 text-black/80 mb-5">
          <Mail className="h-4 w-4" />
          <span className="text-sm font-medium">Stay Connected</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-black">
          Never Miss a Release
        </h2>
        <p className="text-black/75 mt-3 max-w-lg mx-auto leading-relaxed">
          Be the first to hear new music, get behind-the-scenes stories, and receive exclusive updates.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-6">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 h-12 bg-black/10 border-black/20 text-black placeholder:text-black/50"
          />
          <Button type="submit" disabled={submitting} className="h-12 px-6 bg-black text-primary hover:bg-black/85 hover:text-primary border-0">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Subscribe <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs mt-4 text-black/65 leading-relaxed">
          By signing up, you agree to receive email updates from Roxsan. See our{' '}
          <Link to="/privacy" className="text-black underline">Privacy Policy</Link>.
        </p>
      </div>
    </section>
  );
}