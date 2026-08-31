import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Volume2, VolumeX, Music } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function GlobalAudioPlayer() {
  const { currentTrack, isPlaying, progress, duration, volume, togglePlay, seek, closePlayer, setVolume } = useAudioPlayer();

  const hasAudio = !!(currentTrack?.audio_snippet || currentTrack?.preview_url);
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          key="audio-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed bottom-14 lg:bottom-0 left-0 right-0 z-50 safe-area-bottom no-select"
        >
          {/* Progress bar at very top of player */}
          <div className="relative h-1 bg-border/40 cursor-pointer group" onClick={(e) => {
            if (!hasAudio) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            seek(ratio * duration);
          }}>
            <div
              className="h-full bg-primary transition-all duration-150 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
            </div>
          </div>

          {/* Player body */}
          <div className="glass border-t border-border/50 backdrop-blur-2xl px-4 py-3">
            <div className="max-w-6xl mx-auto flex items-center gap-3">

              {/* Cover art */}
              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 glow-blue-sm">
                {currentTrack.cover_image ? (
                  <img src={currentTrack.cover_image} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <Music className="h-5 w-5 text-primary/60" />
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground">
                  {hasAudio
                    ? `${formatTime(progress)} / ${formatTime(duration)}`
                    : 'No preview available — listen on streaming platforms'}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Volume toggle (desktop only) */}
                <button
                  onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                  className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle mute"
                >
                  {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>

                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  disabled={!hasAudio}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors glow-blue-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                </button>

                {/* Close */}
                <button
                  onClick={closePlayer}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close player"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}