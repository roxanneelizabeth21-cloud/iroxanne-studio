import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Music, Disc3 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

// Fallback defaults
const DEFAULT_TITLE = 'Roxsan';
const DEFAULT_TAGLINE = 'Music for the soul. Stories from the heart.';
const DEFAULT_PRIMARY = { text: 'Listen Now', url: '/music' };
const DEFAULT_SECONDARY = { text: 'Watch Videos', url: '/videos' };

function GlowBg({ intensity = 10 }) {
  const opacity = Math.min(20, Math.max(1, intensity));
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 rounded-full blur-[120px] animate-glow-pulse"
        style={{ width: 600, height: 600, background: `hsla(39,48%,56%,${opacity / 100})` }}
      />
      <div
        className="absolute bottom-1/4 left-1/4 rounded-full blur-[100px] animate-glow-pulse"
        style={{ width: 400, height: 400, background: `hsla(176,61%,40%,${opacity / 200})`, animationDelay: '2s' }}
      />
      <div
        className="absolute top-1/3 right-1/4 rounded-full blur-[80px] animate-glow-pulse"
        style={{ width: 300, height: 300, background: `hsla(35,55%,50%,${opacity / 150})`, animationDelay: '1s' }}
      />
    </div>
  );
}

function HeroCTAs({ s }) {
  const primary = { text: s.hero_primary_button_text || DEFAULT_PRIMARY.text, url: s.hero_primary_button_url || DEFAULT_PRIMARY.url };
  const secondary = { text: s.hero_secondary_button_text || DEFAULT_SECONDARY.text, url: s.hero_secondary_button_url || DEFAULT_SECONDARY.url };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.45 }}
      className="flex flex-wrap items-center gap-4"
    >
      <Link to={primary.url}>
        <Button size="lg" className="h-12 px-8 glow-blue gap-2 text-sm">
          <Play className="h-4 w-4 fill-current" /> {primary.text}
        </Button>
      </Link>
      <Link to={secondary.url}>
        <Button variant="outline" size="lg" className="h-12 px-8 gap-2 text-sm border-border/50 hover:border-primary/50">
          {secondary.text}
        </Button>
      </Link>
    </motion.div>
  );
}

function HeroTextBlock({ s, align }) {
  const alignClass = align === 'left' ? 'text-left items-start' : align === 'right' ? 'text-right items-end' : 'text-center items-center';
  const title = s.hero_title || DEFAULT_TITLE;
  const tagline = s.hero_tagline || DEFAULT_TAGLINE;

  const justifyClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div className={`flex flex-col gap-6 ${alignClass}`}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
          <Disc3 className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-sm text-muted-foreground">New Music Available</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className={`flex ${justifyClass}`}
      >
        <BrandLogo className="w-32 sm:w-36 lg:w-40 max-w-full h-auto" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed font-light"
      >
        {tagline}
      </motion.p>
      <HeroCTAs s={s} />
    </div>
  );
}

// ── Layout variants ──────────────────────────────────────────────────────────

function CenteredLayout({ s }) {
  const overlayOpacity = (s.hero_overlay_opacity ?? 40) / 100;
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {s.hero_background_image ? (
        <>
          <img src={s.hero_background_image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-background" style={{ opacity: overlayOpacity }} />
        </>
      ) : (
        <GlowBg intensity={s.hero_glow_intensity} />
      )}
      {s.hero_overlay_image && (
        <img src={s.hero_overlay_image} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-20" />
      )}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <HeroTextBlock s={s} align="center" />
      </div>
    </section>
  );
}

function ArtistSplitLayout({ s, artistLeft }) {
  const overlayOpacity = (s.hero_overlay_opacity ?? 40) / 100;
  const artistImg = s.hero_artist_image;
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {s.hero_background_image ? (
        <>
          <img src={s.hero_background_image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-background" style={{ opacity: overlayOpacity }} />
        </>
      ) : (
        <GlowBg intensity={s.hero_glow_intensity} />
      )}
      <div className={`relative z-10 w-full max-w-6xl mx-auto px-6 py-20 flex flex-col ${artistLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
        {/* Artist image */}
        <motion.div
          initial={{ opacity: 0, x: artistLeft ? -40 : 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          className="w-full lg:w-1/2 flex justify-center"
        >
          {artistImg ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl scale-110 animate-glow-pulse" />
              <img
                src={artistImg}
                alt="Roxsan"
                className="relative w-72 h-72 sm:w-96 sm:h-96 object-cover rounded-2xl glow-blue shadow-2xl"
              />
            </div>
          ) : (
            <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-2xl glass flex items-center justify-center glow-blue">
              <Music className="h-24 w-24 text-primary/30" />
            </div>
          )}
        </motion.div>
        {/* Text */}
        <div className="w-full lg:w-1/2">
          <HeroTextBlock s={s} align={artistLeft ? 'left' : 'left'} />
        </div>
      </div>
    </section>
  );
}

function CinematicBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
      <Disc3 className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: '8s' }} />
      <span className="text-sm text-muted-foreground">New Music Available</span>
    </div>
  );
}

function CinematicLayout({ s }) {
  const bgImg = s.hero_artist_image || s.hero_background_image;
  const title = s.hero_title || 'Roxsan';
  const tagline = s.hero_tagline || 'Music for the soul. Stories from the heart.';

  // Frosted glass card overlaying the cinematic banner: title, tagline, CTAs.
  const renderCard = (compact) => (
    <div className={`rounded-2xl border border-primary/25 bg-black/45 backdrop-blur-xl ${compact ? 'p-5' : 'p-6 sm:p-8'} text-center shadow-[0_8px_40px_rgba(0,0,0,0.55)]`}>
      <CinematicBadge />
      <div className="flex justify-center mt-4">
        <BrandLogo className="w-32 sm:w-36 lg:w-40 max-w-full h-auto" />
      </div>
      <p className="text-base sm:text-lg text-white/70 mt-3 max-w-xl mx-auto font-light">{tagline}</p>
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <Link to={s.hero_primary_button_url || '/music'}>
          <Button size="lg" className="h-12 px-8 glow-blue gap-2 text-sm">
            <Play className="h-4 w-4 fill-current" /> {s.hero_primary_button_text || 'Listen Now'}
          </Button>
        </Link>
        <Link to={s.hero_secondary_button_url || '/videos'}>
          <Button variant="outline" size="lg" className="h-12 px-8 gap-2 text-sm border-white/30 hover:border-primary/60 text-white hover:text-white">
            {s.hero_secondary_button_text || 'Watch Videos'}
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP (sm+): glass card over the banner ── */}
      <section className="relative hidden sm:block w-full overflow-hidden bg-black">
        {bgImg ? (
          <div className="relative w-full">
            <img src={bgImg} alt="Roxsan" className="block w-full h-auto" loading="eager" style={{ transform: 'scale(1.14) translateY(-10%)', transformOrigin: 'top center' }} />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-8 sm:pb-10">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl mx-auto">
                {renderCard(false)}
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
            <GlowBg intensity={s.hero_glow_intensity} />
            <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-10">
              <div className="max-w-3xl mx-auto">{renderCard(false)}</div>
            </div>
          </div>
        )}
      </section>

      {/* ── MOBILE (<sm): glass card overlapping the banner ── */}
      <section className="sm:hidden w-full bg-black">
        {bgImg ? (
          <>
            <div className="relative w-full">
              <img src={bgImg} alt="Roxsan" className="block w-full h-auto" loading="eager" style={{ transform: 'scale(1.14) translateY(-10%)', transformOrigin: 'top center' }} />
            </div>
            <div className="px-4 py-6 bg-gradient-to-t from-black to-transparent -mt-12 relative z-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                {renderCard(true)}
              </motion.div>
            </div>
          </>
        ) : (
          <div className="h-72 relative">
            <GlowBg intensity={s.hero_glow_intensity} />
            <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6">{renderCard(true)}</div>
          </div>
        )}
      </section>
    </>
  );
}

function AlbumCoverLayout({ s }) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <GlowBg intensity={s.hero_glow_intensity} />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9 }}
          className="shrink-0"
        >
          {s.hero_artist_image ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-3xl scale-110 animate-float" />
              <img src={s.hero_artist_image} alt="" className="relative w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-2xl glow-blue shadow-2xl" />
            </div>
          ) : (
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl glass glow-blue flex items-center justify-center">
              <Music className="h-20 w-20 text-primary/30" />
            </div>
          )}
        </motion.div>
        <div className="flex-1 text-center lg:text-left">
          <HeroTextBlock s={s} align="left" />
        </div>
      </div>
    </section>
  );
}

function VideoBgLayout({ s }) {
  const videoSrc = s.background_video_file || null;
  const overlayOpacity = (s.hero_overlay_opacity ?? 50) / 100;
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {videoSrc ? (
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
        />
      ) : s.hero_background_image ? (
        <img src={s.hero_background_image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      ) : null}
      <div className="absolute inset-0 bg-background" style={{ opacity: overlayOpacity }} />
      <GlowBg intensity={s.hero_glow_intensity} />
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <HeroTextBlock s={s} align="center" />
      </div>
    </section>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function HeroSection({ settings }) {
  const s = settings || {};
  // If a background image is set, always use cinematic — never overlay text on the artwork
  const layout = (s.hero_background_image || s.hero_artist_image)
    ? 'cinematic'
    : (s.hero_layout_style || 'centered');

  if (layout === 'cinematic') return <CinematicLayout s={s} />;
  if (layout === 'artist_left') return <ArtistSplitLayout s={s} artistLeft={true} />;
  if (layout === 'artist_right') return <ArtistSplitLayout s={s} artistLeft={false} />;
  if (layout === 'album_cover') return <AlbumCoverLayout s={s} />;
  if (layout === 'video_bg') return <VideoBgLayout s={s} />;
  return <CenteredLayout s={s} />;
}