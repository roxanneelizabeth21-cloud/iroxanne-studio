import { motion } from 'framer-motion';
import { Music, Star, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { useMusicReleaseChildren } from '@/hooks/useMusicReleaseChildren';
import { resolveTrackPlayback, releaseIsPlayable } from '@/lib/trackPlayback';
import ReleaseShareButton from '@/components/release-landing/ReleaseShareButton';
import TrackList from '@/components/TrackList';
import PlatformLogo, { hasPlatformLogo } from '@/components/release-landing/PlatformLogo';

function comingLabel(d) {
  if (!d) return 'Coming soon';
  try {
    return 'Coming ' + new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return 'Coming soon'; }
}

// Featured release banner for the homepage + Music page, rendered from a
// MusicRelease record. Streaming buttons come from MusicPlatformLink; plays the
// release snippet (or the first track's audio) via the global audio player.
export default function MusicReleaseFeaturedBanner({ release }) {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const { tracks, platforms } = useMusicReleaseChildren(release.id);
  if (!release) return null;

  const cover = release.cover_image_url;
  const upcoming = release.status === 'upcoming';
  const sortedTracks = [...tracks].sort((a, b) => (a.track_number || 0) - (b.track_number || 0));
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden rounded-2xl glass glow-blue">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4 md:p-6">
        <div className="w-full max-w-56 mx-auto md:w-48 lg:w-56 md:max-w-none shrink-0">
          <div className={`aspect-square rounded-xl overflow-hidden glow-blue-sm relative group ${playable ? 'cursor-pointer' : 'cursor-default'}`} onClick={handlePlay}>
            {cover ? (
              <img src={cover} alt={release.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Music className="h-16 w-16 text-primary/50" />
              </div>
            )}
            {playable && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isActive ? 'bg-primary' : 'bg-black/60'}`}>
                {isActive && isPlaying ? <Pause className="h-7 w-7 text-white fill-white" /> : <Play className="h-7 w-7 text-white fill-white ml-1" />}
              </div>
            </div>
            )}
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Star className="h-3 w-3" /> Featured Release
          </div>
          {upcoming && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 text-xs font-semibold mb-3 ml-0 md:ml-2">
              {comingLabel(release.release_date)}
            </div>
          )}
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2">{release.title}</h2>
          {release.description && (
            <p className="text-muted-foreground text-sm mb-4 max-w-lg leading-relaxed">{release.description}</p>
          )}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {playable && (
              <Button size="sm" variant={isActive && isPlaying ? 'secondary' : 'default'} className="gap-2 glow-blue-sm" onClick={handlePlay}>
                {isActive && isPlaying ? <><Pause className="h-4 w-4 fill-current" /> Pause Preview</> : <><Play className="h-4 w-4 fill-current ml-0.5" /> Play Preview</>}
              </Button>
            )}
            {platforms.map((p) => {
              const label = upcoming ? (p.subtext || p.name) : p.name;
              return (
                <a key={p.name} href={p.url.startsWith('http') ? p.url : `https://${p.url}`} target="_blank" rel="noopener noreferrer">
                  {upcoming ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#28A49C' }}>
                      {hasPlatformLogo(p.platformType) ? <PlatformLogo platformType={p.platformType} className="h-3.5 w-3.5" /> : null}
                      {label}
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-2 border-border/50">
                      {hasPlatformLogo(p.platformType) ? <PlatformLogo platformType={p.platformType} className="h-3.5 w-3.5" /> : null}
                      {p.name}
                    </Button>
                  )}
                </a>
              );
            })}
            <ReleaseShareButton slug={release.slug} title={release.title} />
          </div>
          {sortedTracks.length > 0 && (
            <div className="mt-4 text-left">
              <TrackList tracks={sortedTracks} release={shareRelease} columns={2} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}