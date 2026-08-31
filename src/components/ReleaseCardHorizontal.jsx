import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ExternalLink, Play, Pause, ScrollText, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import LyricsModal from '@/components/LyricsModal';
import TrackList from '@/components/TrackList';
import ShareButton from '@/components/ShareButton';
import PlatformLogo, { hasPlatformLogo } from '@/components/release-landing/PlatformLogo';

const platforms = [
  { key: 'spotify_url', label: 'Spotify', platformType: 'spotify' },
  { key: 'apple_music_url', label: 'Apple Music', platformType: 'apple_music' },
  { key: 'youtube_url', label: 'YouTube', platformType: 'youtube' },
  { key: 'amazon_music_url', label: 'Amazon', platformType: 'amazon_music' },
  { key: 'tiktok_url', label: 'TikTok', platformType: 'tiktok_instagram' },
];

export default function ReleaseCardHorizontal({ release, tracks }) {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const isActive = currentTrack?.id === release.id;
  const hasAudio = !!(release.audio_snippet || release.preview_url || release.full_audio_file);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [showTracks, setShowTracks] = useState(false);
  const hasTracks = tracks && tracks.length > 0;

  const handlePlay = () => {
    playTrack({
      id: release.id,
      title: release.title,
      cover_image: release.cover_image,
      audio_snippet: release.audio_snippet || release.full_audio_file || null,
      preview_url: release.preview_url || null,
      snippet_start: release.snippet_start || 0,
      snippet_end: release.snippet_end || null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group glass rounded-lg overflow-hidden glass-hover flex"
    >
      {/* Cover - left side */}
      <div className="w-24 h-24 shrink-0 relative overflow-hidden">
        {release.cover_image ? (
          <img
            src={release.cover_image}
            alt={release.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Music className="h-6 w-6 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button */}
        {hasAudio && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${isActive ? 'bg-primary glow-blue' : 'bg-black/50 hover:bg-primary'}`}>
              {isActive && isPlaying
                ? <Pause className="h-4 w-4 text-white fill-white" />
                : <Play className="h-4 w-4 text-white fill-white ml-0.5" />
              }
            </div>
          </button>
        )}
      </div>

      {/* Content - right side */}
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-sm font-semibold leading-tight">{release.title}</h3>
            {hasAudio && (
              <button
                onClick={handlePlay}
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all text-xs ${isActive && isPlaying ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary hover:text-white text-muted-foreground'}`}
              >
                {isActive && isPlaying
                  ? <Pause className="h-3 w-3 fill-current" />
                  : <Play className="h-3 w-3 fill-current ml-0.5" />
                }
              </button>
            )}
          </div>
          {release.release_date && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(release.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {hasTracks && (
            <Button variant="outline" size="sm" className="text-xs h-6 gap-1 px-2 border-border/50 hover:border-primary/50 hover:text-primary" onClick={() => setShowTracks(!showTracks)}>
              <ListMusic className="h-3 w-3" />
              Tracks ({tracks.length})
            </Button>
          )}
          {platforms.map((p) =>
            release[p.key] ? (
              <a key={p.key} href={release[p.key].startsWith('http') ? release[p.key] : `https://${release[p.key]}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="text-xs h-6 gap-1 px-2 border-border/50 hover:border-primary/50 hover:text-primary">
                  {hasPlatformLogo(p.platformType)
                    ? <PlatformLogo platformType={p.platformType} className="h-3 w-3" />
                    : null}
                  {p.label}
                </Button>
              </a>
            ) : null
          )}
          {release.lyrics && (
            <Button variant="outline" size="sm" className="text-xs h-6 gap-1 px-2 border-border/50 hover:border-primary/50 hover:text-primary" onClick={() => setLyricsOpen(true)}>
              <ScrollText className="h-3 w-3" />
              Lyrics
            </Button>
          )}
          <ShareButton release={release} />
        </div>
        <AnimatePresence>
          {showTracks && hasTracks && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <TrackList tracks={tracks} release={release} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <LyricsModal release={release} open={lyricsOpen} onClose={setLyricsOpen} />
    </motion.div>
  );
}