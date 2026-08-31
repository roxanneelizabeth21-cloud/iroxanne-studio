import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { useMusicReleaseChildren } from '@/hooks/useMusicReleaseChildren';
import { resolveTrackPlayback, releaseIsPlayable } from '@/lib/trackPlayback';
import TrackList from '@/components/TrackList';
import ShareButton from '@/components/ShareButton';
import PlatformLogo, { hasPlatformLogo } from '@/components/release-landing/PlatformLogo';

function comingLabel(d) {
  if (!d) return 'Coming soon';
  try {
    return 'Coming ' + new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return 'Coming soon'; }
}
function dateLabel(d) {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; }
}

// Horizontal release card for the Music page + homepage "Latest Music".
// Renders from a MusicRelease record; links to /release/:slug; expands an
// inline tracklist with the global audio player + streaming buttons from
// MusicPlatformLink. Shows a "Coming [full month day, year]" badge when
// status === 'upcoming'.
export default function MusicReleaseCard({ release }) {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const { tracks, platforms } = useMusicReleaseChildren(release.id);
  const [showTracks, setShowTracks] = useState(false);

  const cover = release.cover_image_url;
  const upcoming = release.status === 'upcoming';
  const sortedTracks = [...tracks].sort((a, b) => (a.track_number || 0) - (b.track_number || 0));
  const hasTracks = sortedTracks.length > 0;
  const hasReleaseAudio = releaseIsPlayable(release) && !!release.audio_snippet;
  const firstPlayableTrack = releaseIsPlayable(release) ? sortedTracks.find((t) => resolveTrackPlayback(t, release).playable) : null;
  const playable = hasReleaseAudio || !!firstPlayableTrack;
  const isActive = currentTrack?.id === release.id || sortedTracks.some((t) => t.id === currentTrack?.id);
  const shareRelease = { ...release, cover_image: cover };

  const handlePlay = () => {
    if (!playable) return;
    if (hasReleaseAudio) {
      playTrack({
        id: release.id,
        title: release.title,
        cover_image: cover,
        audio_snippet: release.audio_snippet,
        preview_url: null,
        snippet_start: release.snippet_start || 0,
        snippet_end: release.snippet_end || null,
      });
    } else if (firstPlayableTrack) {
      const pb = resolveTrackPlayback(firstPlayableTrack, release);
      playTrack({
        id: firstPlayableTrack.id,
        title: firstPlayableTrack.title,
        cover_image: cover,
        audio_snippet: pb.src,
        preview_url: null,
        snippet_start: pb.snippetStart,
        snippet_end: pb.snippetEnd,
        fade: pb.fade,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group glass rounded-lg overflow-hidden glass-hover flex"
    >
      <Link to={`/release/${release.slug}`} className="w-24 h-24 shrink-0 relative overflow-hidden block">
        {cover ? (
          <img src={cover} alt={release.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Music className="h-6 w-6 text-primary/40" />
          </div>
        )}
        {playable && (
          <button
            onClick={(e) => { e.preventDefault(); handlePlay(); }}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${isActive ? 'bg-primary glow-blue' : 'bg-black/50 hover:bg-primary'}`}>
              {isActive && isPlaying ? <Pause className="h-4 w-4 text-white fill-white" /> : <Play className="h-4 w-4 text-white fill-white ml-0.5" />}
            </div>
          </button>
        )}
        {upcoming && (
          <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white font-medium">Upcoming</span>
        )}
      </Link>

      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link to={`/release/${release.slug}`} className="min-w-0">
              <h3 className="font-display text-sm font-semibold leading-tight truncate hover:text-primary transition-colors">{release.title}</h3>
            </Link>
            {playable && (
              <button
                onClick={handlePlay}
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all text-xs ${isActive && isPlaying ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary hover:text-white text-muted-foreground'}`}
                aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
              >
                {isActive && isPlaying ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current ml-0.5" />}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {release.release_type && <span className="text-xs text-muted-foreground/80">{release.release_type}</span>}
            {upcoming ? (
              <span className="text-xs text-amber-600 font-medium">{comingLabel(release.release_date)}</span>
            ) : release.release_date ? (
              <span className="text-xs text-muted-foreground">{dateLabel(release.release_date)}</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {hasTracks && (
            <Button variant="outline" size="sm" className="text-xs h-6 gap-1 px-2 border-border/50 hover:border-primary/50 hover:text-primary" onClick={() => setShowTracks(!showTracks)}>
              <ListMusic className="h-3 w-3" /> Tracks ({tracks.length})
            </Button>
          )}
          {platforms.map((p) => {
            // Upcoming releases render as teal pre-save buttons using display_label
            // (falling back to platform_name), matching the landing page's pre-save
            // section. Released releases keep outline streaming buttons with platform names.
            const label = upcoming ? (p.subtext || p.name) : p.name;
            return (
              <a key={p.name} href={p.url.startsWith('http') ? p.url : `https://${p.url}`} target="_blank" rel="noopener noreferrer">
                {upcoming ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#28A49C' }}>
                    {hasPlatformLogo(p.platformType) ? <PlatformLogo platformType={p.platformType} className="h-3 w-3" /> : null}
                    {label}
                  </span>
                ) : (
                  <Button variant="outline" size="sm" className="text-xs h-6 gap-1 px-2 border-border/50 hover:border-primary/50 hover:text-primary">
                    {hasPlatformLogo(p.platformType) ? <PlatformLogo platformType={p.platformType} className="h-3 w-3" /> : null}
                    {p.name}
                  </Button>
                )}
              </a>
            );
          })}
          <ShareButton release={shareRelease} />
        </div>

        <AnimatePresence>
          {showTracks && hasTracks && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <TrackList tracks={sortedTracks} release={shareRelease} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}