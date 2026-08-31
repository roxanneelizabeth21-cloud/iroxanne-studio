import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, Music, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useReleasePlatformLinks } from '@/hooks/useReleasePlatformLinks';
import PlatformButton from '@/components/release-landing/PlatformButton';
import YouTubeEmbedPlaceholder from '@/components/release-landing/YouTubeEmbedPlaceholder';
import LandingFooter from '@/components/release-landing/LandingFooter';
import BehindTheSongSection from '@/components/release-landing/BehindTheSongSection';
import { parseUTMParams, isValidEmail } from '@/lib/analytics';
import { subscribeFan } from '@/hooks/useFanSubscribe';
import DocumentMeta from '@/components/DocumentMeta';
import { canonicalUrl, DEFAULT_SHARE_IMAGE } from '@/lib/siteMeta';

// Dynamic fan-capture landing page for paid traffic (e.g. Facebook ads).
// Route: /go/:slug  — standalone, outside AppLayout (same pattern as release landing pages).
// Email is the primary CTA above the fold; thank-you state reveals streaming links + YouTube.

const theme = {
  bg: '#061318',
  text: '#eaf2f0',
  textMuted: '#8fa9a6',
  accent: '#A67B3F',
  accentGradient: 'linear-gradient(135deg, #C59F59, #A67B3F)',
  btnText: '#0d0d0d',
  glow: 'rgba(40,164,156,0.28)',
  border: 'rgba(40,164,156,0.20)',
  cardBg: 'rgba(10,28,32,0.82)',
  coverFallback: 'linear-gradient(135deg, #0a2329 0%, #1B575D 100%)',
  heroBg:
    'radial-gradient(ellipse 75% 55% at 50% 18%, rgba(40,164,156,0.18), transparent 70%), radial-gradient(ellipse 60% 50% at 50% 95%, rgba(166,123,63,0.12), transparent 70%), linear-gradient(180deg, #061318 0%, #0a2329 50%, #061318 100%)',
};

export default function CapturePage() {
  const { slug } = useParams();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Fetch the release metadata for the hero (title, artist, cover).
  const { data: release, isLoading } = useQuery({
    queryKey: ['music-release', slug],
    queryFn: async () => {
      const results = await base44.entities.MusicRelease.filter({ slug, is_active: true });
      return results[0] || null;
    },
  });

  // Platform links for the thank-you state (reuse existing hook).
  const { platforms, youtubeEmbedUrl } = useReleasePlatformLinks(slug);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    const { utm_source, utm_medium, utm_campaign } = parseUTMParams(window.location.search);
    try {
      const { created } = await subscribeFan({
        email: normalizedEmail,
        name: name.trim() || undefined,
        source_slug: slug,
        utm_source,
        utm_medium,
        utm_campaign,
      });
      // Meta Pixel: Roxsan Music, ID 1723587952279278 — fire Lead exactly once,
      // only on a brand-new subscription (not on a duplicate/already-subscribed email).
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

  const title = release?.title || 'New Music';
  const artistName = release?.artist_name || 'ROXSAN';
  const cover = release?.cover_image_url || release?.hero_image_url;
  const preSavePlatform = platforms[0] || null;

  // The page's own URL is known from the slug alone, so the canonical / og:url
  // are correct from the very first render — a crawler that snapshots this page
  // before the release data arrives must never fall back to the homepage URL.
  const pageUrl = canonicalUrl(`/go/${slug}`);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <DocumentMeta url={pageUrl} siteName="Roxsan Music" type="music.song" image={DEFAULT_SHARE_IMAGE} />
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.accent }} />
      </main>
    );
  }

  // Unmatched slug — redirect home instead of showing a generic placeholder form.
  if (!release) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen scroll-smooth font-sans antialiased overflow-x-hidden" style={{ background: theme.bg, color: theme.text }}>
      <DocumentMeta
        title={`${title} — ${artistName}`}
        description={release.share_description || release.tagline || release.description || `Get early access to ${title} by ${artistName}.`}
        image={release.social_share_image || release.cover_image_url || release.hero_image_url || DEFAULT_SHARE_IMAGE}
        url={pageUrl}
        type="music.song"
        siteName="Roxsan Music"
        imageAlt={`${title} — cover art`}
      />
      {/* Hero + capture form — hidden after a successful submit so the thank-you replaces it */}
      {!submitted && (
      <section className="relative px-4 pt-12 pb-10 sm:pt-16 sm:pb-14" style={{ background: theme.heroBg }}>
        <div className="max-w-md mx-auto text-center">
          {/* Cover art */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border shadow-2xl mb-8"
            style={{ borderColor: theme.border, boxShadow: `0 0 50px ${theme.glow}, 0 20px 40px rgba(0,0,0,0.5)` }}
          >
            {cover ? (
              <img src={cover} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: theme.coverFallback }}>
                <Music className="h-12 w-12" style={{ color: theme.accent }} />
              </div>
            )}
          </motion.div>

          <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: theme.accent }}>{artistName}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: theme.text }}>
            Get <span style={{ color: theme.accent }}>'{title}'</span>
          </h1>
          <p className="text-base sm:text-lg mb-8" style={{ color: theme.textMuted }}>
            …and be the first to hear what's next.
          </p>

          {/* Email form — primary CTA, above the fold */}
          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name (optional)"
              className="w-full h-12 px-4 rounded-xl border bg-transparent outline-none transition-colors focus:border-[var(--tw)]"
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
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Get Early Access <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
          <p className="text-xs mt-4 flex items-center justify-center gap-1.5" style={{ color: theme.textMuted }}>
            <Mail className="h-3 w-3" /> No spam. Unsubscribe anytime.
          </p>
          <p className="text-xs mt-3 text-center leading-relaxed" style={{ color: theme.textMuted }}>
            By signing up, you agree to receive email updates from Roxsan. See our{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }} className="underline">
              Privacy Policy
            </a>.
          </p>
        </div>
      </section>
      )}

      {/* Thank-you state — revealed after a fresh signup OR a duplicate (both friendly) */}
      {submitted && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 py-14 sm:py-16"
        >
          <div className="max-w-md mx-auto text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-5" style={{ color: theme.accent }} />
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: theme.text }}>You're in</h2>
            <p className="mb-8" style={{ color: theme.textMuted }}>Watch your inbox — we'll send what's next the moment it drops.</p>

            {/* Pre-Save the Album — uses the release's first pre-save MusicPlatformLink */}
            {preSavePlatform ? (
              <a
                href={preSavePlatform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02] mb-4"
                style={{ background: theme.accentGradient, color: theme.btnText }}
              >
                Pre-Save the Album <ArrowRight className="h-4 w-4" />
              </a>
            ) : platforms.length > 0 ? (
              <div className="space-y-3 mb-4">
                {platforms.map((p, i) => (
                  <PlatformButton key={p.name} platform={p} index={i} theme={theme} />
                ))}
              </div>
            ) : (
              <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Pre-save links coming soon.</p>
            )}

            {/* Pre-Order on Apple Music — secondary CTA, only when a pre-order URL is set on the release */}
            {release?.apple_preorder_url && (
              <a
                href={release.apple_preorder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-xl font-medium inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02] mb-4 border"
                style={{ borderColor: theme.border, background: 'transparent', color: theme.text }}
              >
                Pre-Order on Apple Music <ArrowRight className="h-4 w-4" />
              </a>
            )}

            {/* Follow-on navigation */}
            <div className="flex items-center justify-center gap-5 text-sm pt-2" style={{ color: theme.accent }}>
              <Link to="/music" className="underline hover:no-underline">Browse Music</Link>
              <span style={{ color: theme.border }}>·</span>
              <Link to="/shop" className="underline hover:no-underline">Visit Shop</Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* Behind the Song — after the pre-save CTAs so it never competes with them */}
      {submitted && <BehindTheSongSection theme={theme} text={release.behind_the_scenes} />}

      {/* YouTube embed (only after thank-you, if present) */}
      {submitted && youtubeEmbedUrl && (
        <YouTubeEmbedPlaceholder embedUrl={youtubeEmbedUrl} theme={theme} />
      )}

      <LandingFooter theme={theme} />
    </main>
  );
}