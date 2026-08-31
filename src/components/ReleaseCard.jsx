import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ExternalLink, Play, Pause, ScrollText, ListMusic } from 'lucide-react';
import TrackList from '@/components/TrackList';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import ShareButton from '@/components/ShareButton';
import LyricsModal from '@/components/LyricsModal';
import PlatformLogo, { hasPlatformLogo } from '@/components/release-landing/PlatformLogo';

const platforms = [
  { key: 'spotify_url', label: 'Spotify', platformType: 'spotify' },
  { key: 'apple_music_url', label: 'Apple Music', platformType: 'apple_music' },
  { key: 'youtube_url', label: 'YouTube', platformType: 'youtube' },
  { key: 'amazon_music_url', label: 'Amazon', platformType: 'amazon_music' },
  { key: 'tiktok_url', label: 'TikTok', platformType: 'tiktok_instagram' },
];

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function ReleaseCard({ release, tracks }) {
  const { playTrack, currentTrack, isPlaying, progress, duration } = useAudioPlayer();
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

  const snippetDuration = release.snippet_end && release.snippet_start
    ? release.snippet_end - release.snippet_start
    : release.snippet_duration || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group glass rounded-2xl overflow-hidden glass-hover"
    >
      {/* Cover */}
      <div className="aspect-square relative overflow-hidden">
        {release.cover_image ? (
          <img
            src={release.cover_image}
            alt={release.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Music className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button */}
        {hasAudio && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label={isActive && isPlaying ? 'Pause' : 'Play preview'}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${isActive ? 'bg-primary glow-blue' : 'bg-black/50 hover:bg-primary'}`}>
              {isActive && isPlaying
                ? <Pause className="h-6 w-6 text-white fill-white" />
                : <Play className="h-6 w-6 text-white fill-white ml-0.5" />
              }
            </div>
          </button>
        )}

        {/* Now playing indicator */}
        {isActive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/90 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-xs text-white font-medium">Now Playing</span>
          </div>
        )}
      </div>

      {/* Progress bar when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            className="h-0.5 bg-secondary origin-left"
          >
            <div
              className="h-full bg-primary transition-all duration-150"
              style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : '0%' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-lg font-semibold leading-tight">{release.title}</h3>
          {hasAudio && (
            <button
              onClick={handlePlay}
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${isActive && isPlaying ? 'bg-primary text-white' : 'bg-secondary hover:bg-primary hover:text-white text-muted-foreground'}`}
            >
              {isActive && isPlaying
                ? <Pause className="h-4 w-4 fill-current" />
                : <Play className="h-4 w-4 fill-current ml-0.5" />
              }
            </button>
          )}
        </div>

        {release.release_date && (
          <p className="text-xs text-muted-foreground mb-1">
            {new Date(release.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}

        {snippetDuration && (
          <p className="text-xs text-primary/70 mb-2">{Math.round(snippetDuration)}s preview</p>
        )}

        {release.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{release.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
        {hasTracks && (
          <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5 border-border/50 hover:border-primary/50 hover:text-primary" onClick={() => setShowTracks(!showTracks)}>
            <ListMusic className="h-3 w-3" />
            Tracks ({tracks.length})
          </Button>
        )}
          {platforms.map((p) =>
            release[p.key] ? (
              <a key={p.key} href={release[p.key].startsWith('http') ? release[p.key] : `https://${release[p.key]}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5 border-border/50 hover:border-primary/50 hover:text-primary">
                  {hasPlatformLogo(p.platformType)
                    ? <PlatformLogo platformType={p.platformType} className="h-3.5 w-3.5" />
                    : <ExternalLink className="h-3 w-3" />}
                  {p.label}
                </Button>
              </a>
            ) : null
          )}
          {release.lyrics && (
            <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5 border-border/50 hover:border-primary/50 hover:text-primary" onClick={() => setLyricsOpen(true)}>
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