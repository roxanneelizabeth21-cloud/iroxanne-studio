import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { parseUTMParams, isValidEmail } from '@/lib/analytics';
import { subscribeFan } from '@/hooks/useFanSubscribe';

// Reusable email-capture section for release landing pages.
// Subscribes a fan via the subscribeFan backend function (slug as source_slug),
// captures UTM params, fires the Meta Pixel "Lead" event, and shows a consent
// line linking to /privacy. Used as the primary CTA for upcoming releases and
// as a secondary sign-up for released ones.
export default function EmailCaptureSection({ theme, headline, subtext, slug, ctaLabel = 'Get Updates' }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    const { utm_source, utm_medium, utm_campaign } = parseUTMParams(window.location.search);
    try {
      const { created } = await subscribeFan({
        email: email.trim().toLowerCase(),
        name: name.trim() || undefined,
        source_slug: slug,
        utm_source,
        utm_medium,
        utm_campaign,
      });
      // Meta Pixel: fire Lead exactly once — only on a brand-new subscription,
      // not on a duplicate (already-subscribed) email.
      if (created && typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('track', 'Lead');
      }
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative px-4 py-12 sm:py-14">
      <div className="max-w-md mx-auto text-center">
        {submitted ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <CheckCircle2 className="h-11 w-11 mx-auto mb-4" style={{ color: theme.accent }} />
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2" style={{ color: theme.text }}>You're on the list</h2>
            <p style={{ color: theme.textMuted }}>Watch your inbox — we'll be in touch soon.</p>
          </motion.div>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-[0.3em] mb-2" style={{ color: theme.accent }}>Join the list</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2" style={{ color: theme.text }}>{headline}</h2>
            {subtext && <p className="mb-6 text-sm sm:text-base" style={{ color: theme.textMuted }}>{subtext}</p>}
            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name (optional)"
                className="w-full h-12 px-4 rounded-xl border bg-transparent outline-none transition-colors"
                style={{ borderColor: theme.border, color: theme.text, background: theme.cardBg }}
                autoComplete="given-name"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com"
                required
                className="w-full h-12 px-4 rounded-xl border bg-transparent outline-none transition-colors"
                style={{ borderColor: error ? '#e57373' : theme.border, color: theme.text, background: theme.cardBg }}
                autoComplete="email"
              />
              {error && <p className="text-sm" style={{ color: '#e57373' }}>{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: theme.accentGradient, color: theme.btnText }}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{ctaLabel} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
            <p className="text-xs mt-4 flex items-center justify-center gap-1.5" style={{ color: theme.textMuted }}>
              <Mail className="h-3 w-3" /> No spam. Unsubscribe anytime.
            </p>
            <p className="text-xs mt-3 text-center leading-relaxed" style={{ color: theme.textMuted }}>
              By signing up, you agree to receive email updates from Roxsan. See our{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }} className="underline">Privacy Policy</a>.
            </p>
          </>
        )}
      </div>
    </section>
  );
}