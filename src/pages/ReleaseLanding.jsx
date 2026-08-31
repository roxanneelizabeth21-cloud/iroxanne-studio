import { useParams, Navigate, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Music, Calendar, ChevronLeft } from 'lucide-react';
import { useReleasePlatformLinks } from '@/hooks/useReleasePlatformLinks';
import PlatformLogo, { hasPlatformLogo } from '@/components/release-landing/PlatformLogo';
import YouTubeEmbedPlaceholder from '@/components/release-landing/YouTubeEmbedPlaceholder';
import FollowLinks from '@/components/release-landing/FollowLinks';
import ShareLinks from '@/components/release-landing/ShareLinks';
import LandingFooter from '@/components/release-landing/LandingFooter';
import EmailCaptureSection from '@/components/release-landing/EmailCaptureSection';
import BehindTheSongSection from '@/components/release-landing/BehindTheSongSection';
import { getReleaseTheme } from '@/lib/releaseThemes';
import { useDominantColor } from '@/hooks/useDominantColor';
import { buildDynamicTheme } from '@/lib/releaseDynamicTheme';
import { lighten, darken } from '@/lib/colorUtils';
import { RELEASE_SOCIAL_LINKS, artistLinksToFollow } from '@/lib/releaseSocialLinks';
import { base44 } from '@/api/base44Client';
import DocumentMeta from '@/components/DocumentMeta';
import { canonicalUrl, DEFAULT_SHARE_IMAGE } from '@/lib/siteMeta';
import PromoBannerStack from '@/components/PromoBannerStack';

// Dynamic release landing page. Route: /release/:slug — standalone (no AppLayout).
// Renders entirely from the MusicRelease record + related platform links.
// Released → streaming buttons, YouTube, email capture, connect/share.
// Upcoming → coming-soon badge, email capture as primary CTA, YouTube teaser, pre-save links, connect/share.
// Unknown / inactive slug → redirect to /music.
function formatDate(d) {
  if (!d) return 'soon';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

export default function ReleaseLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { release, platforms, youtubeEmbedUrl, isLoading } = useReleasePlatformLinks(slug);
  const { data: artistLinks = [] } = useQuery({ queryKey: ['artist-profile-links'], queryFn: () => base44.entities.ArtistProfileLink.list('sort_order'), staleTime: 60000 });
  const followLinks = artistLinksToFollow(artistLinks);
  const connectLinks = followLinks.length ? followLinks : RELEASE_SOCIAL_LINKS;
  const { dominant } = useDominantColor(release?.cover_image_url || release?.hero_image_url);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#061318' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#A67B3F' }} />
      </main>
    );
  }

  if (!release) {
    return <Navigate to="/music" replace />;
  }

  const fallbackTheme = getReleaseTheme(release.theme_preset);
  const theme = dominant ? buildDynamicTheme(dominant, fallbackTheme) : fallbackTheme;
  // Split hero: dark dominant color on the left (artwork), lighter tint on the right (content).
  const leftBg = dominant || theme.bg;
  const rightBg = dominant ? lighten(dominant, 0.72) : theme.cardBg;
  const rightText = dominant ? darken(dominant, 0.6) : theme.text;
  const rightMuted = dominant ? darken(dominant, 0.4) : theme.textMuted;
  const rightAccent = dominant ? darken(dominant, 0.15) : theme.accent;
  const upcoming = release.status === 'upcoming';
  const cover = release.cover_image_url || release.hero_image_url;
  const artistName = release.artist_name || 'ROXSAN';
  const title = release.title || 'New Music';
  const tagline = release.tagline || release.description || '';
  const showEmail = release.show_email_capture !== false;

  return (
    <main className="min-h-screen scroll-smooth font-sans antialiased overflow-x-hidden" style={{ background: theme.bg, color: theme.text }}>
      <DocumentMeta
        title={`${title} — ${artistName}`}
        description={release.share_description || release.description || release.tagline}
        image={release.social_share_image || release.cover_image_url || release.hero_image_url || DEFAULT_SHARE_IMAGE}
        url={canonicalUrl(`/release/${slug}`)}
        type="music.song"
        siteName="Roxsan Music"
        imageAlt={`${title} — cover art`}
      />
      <PromoBannerStack pageKey="release" />
      <button
        onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/music'))}
        className="fixed left-4 top-[calc(var(--safe-top)+1rem)] z-50 w-10 h-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-secondary/50 transition-colors no-select"
        aria-label="Go back"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Hero — split layout: full-bleed cover left, platform card right on the cover's dominant color */}
      <section className="relative min-h-[60vh] md:min-h-[calc(100vh-var(--safe-top))] flex flex-col md:flex-row overflow-hidden">
        {/* Left: cover art on the dark dominant color */}
        <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto md:min-h-[calc(100vh-var(--safe-top))]" style={{ background: leftBg }}>
          {cover ? (
            <img src={cover} alt={`${title} — cover art`} className="absolute inset-0 w-full h-full object-contain p-4 sm:p-8 md:p-12" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: leftBg }}>
              <Music className="h-12 w-12" style={{ color: theme.accent }} />
            </div>
          )}
        </div>

        {/* Right: content column on a lighter tint of the dominant color */}
        <div className="relative w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-10 py-10 md:py-0" style={{ background: rightBg, color: rightText }}>
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em] mb-2" style={{ color: rightAccent }}>{artistName}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight uppercase" style={{ color: rightText }}>{title}</h1>
            {tagline && <p className="mt-2 text-sm sm:text-base" style={{ color: rightMuted }}>{tagline}</p>}

            {upcoming && (
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full border" style={{ borderColor: rightMuted, background: '#ffffff' }}>
                <Calendar className="h-4 w-4" style={{ color: rightAccent }} />
                <span className="text-sm font-medium" style={{ color: rightText }}>Coming {formatDate(release.release_date)}</span>
              </div>
            )}

            {platforms.length > 0 ? (
              <div className="mt-6 rounded-2xl p-3 sm:p-4 shadow-lg" style={{ background: '#ffffff', color: '#1a1a1a' }}>
                {platforms.map((p) => (
                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-[#D1D1D1] hover:shadow-md transition-shadow mb-2 last:mb-0">
                    <span className="shrink-0 flex items-center justify-center text-black">
                      {hasPlatformLogo(p.platformType) ? <PlatformLogo platformType={p.platformType} className="h-6 w-6" /> : p.Icon ? <p.Icon className="h-5 w-5" /> : null}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-sm font-semibold text-black">{p.name}</span>
                    <span className="shrink-0 px-3 py-1 rounded-md bg-white border border-[#D1D1D1] text-xs font-bold text-black">{upcoming ? (p.platformType === 'itunes' ? 'Buy' : 'Pre-Save') : 'Play'}</span>
                  </a>
                ))}
              </div>
            ) : (
              !upcoming && <p className="mt-6 text-sm" style={{ color: rightMuted }}>Listening links coming soon.</p>
            )}

            <div className="mt-5 flex justify-center">
              <Link to="/shop" className="px-8 py-3 rounded-lg bg-white border-2 border-black text-sm font-bold text-black hover:bg-black hover:text-white transition-colors">Shop Merch</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming: email capture is the primary CTA, right after the hero */}
      {upcoming && showEmail && (
        <EmailCaptureSection
          theme={theme}
          slug={slug}
          headline={`Be the first to hear '${title}'`}
          subtext={release.release_date ? `Releasing ${formatDate(release.release_date)}.` : "Drop your email and we'll send it the moment it's out."}
          ctaLabel="Notify Me"
        />
      )}

      {/* YouTube embed (teaser for upcoming, watch for released) */}
      {youtubeEmbedUrl && <YouTubeEmbedPlaceholder theme={theme} embedUrl={youtubeEmbedUrl} />}

      {/* Upcoming: Apple Music embed (pre-save links live in the hero card) */}
      {upcoming && release.apple_embed_url && (
        <section className="relative px-4 py-10 sm:py-12">
          <div className="max-w-2xl mx-auto flex justify-center">
            <iframe
              allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
              frameBorder="0"
              height="450"
              style={{ width: '100%', maxWidth: '660px', overflow: 'hidden', borderRadius: '10px', border: '0' }}
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
              src={release.apple_embed_url}
              title={`${title} — Apple Music`}
            />
          </div>
        </section>
      )}

      {/* Released: email capture after YouTube */}
      {!upcoming && showEmail && (
        <EmailCaptureSection
          theme={theme}
          slug={slug}
          headline="Get updates from Roxsan"
          subtext="New music, videos, and behind-the-scenes — straight to your inbox."
          ctaLabel="Join the List"
        />
      )}

      <BehindTheSongSection theme={theme} text={release.behind_the_scenes} />

      <FollowLinks theme={theme} links={connectLinks} />
      <ShareLinks theme={theme} title={title} slug={slug} />
      <LandingFooter theme={theme} />
    </main>
  );
}