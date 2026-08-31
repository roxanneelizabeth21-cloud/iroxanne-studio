import { useState } from 'react';
import { Play, Pause, ScrollText, Music } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { resolveTrackPlayback } from '@/lib/trackPlayback';
import LyricsModal from '@/components/LyricsModal';

function fmt(s) {
  if (!s || isNaN(s)) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function TrackList({ tracks, release, columns = 1 }) {
  const { playTrack, currentTrack, isPlaying, progress, duration } = useAudioPlayer();
  const [lyricsTrack, setLyricsTrack] = useState(null);

  if (!tracks || tracks.length === 0) return null;
  const sorted = [...tracks].sort((a, b) => (a.track_number || 0) - (b.track_number || 0));
  const listClass = columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-5' : 'space-y-0';

  const handlePlay = (track) => {
    const pb = resolveTrackPlayback(track, release);
    if (!pb.playable) return;
    playTrack({
      id: track.id,
      title: track.title,
      cover_image: release?.cover_image,
      audio_snippet: pb.src,
      preview_url: null,
      snippet_start: pb.snippetStart,
      snippet_end: pb.snippetEnd,
      fade: pb.fade,
    });
  };

  return (
    <>
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tracklist</span>
          <span className="text-xs text-muted-foreground/60">{sorted.length} {sorted.length === 1 ? 'track' : 'tracks'}</span>
        </div>
        <div className={listClass}>
          {sorted.map((t, i) => {
            const pb = resolveTrackPlayback(t, release);
            const isActive = currentTrack?.id === t.id;
            const activePlaying = isActive && isPlaying;
            return (
              <div key={t.id} className="relative">
                <div className={`flex items-center gap-3 px-2.5 py-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-secondary/60'}`}>
                  {pb.playable ? (
                    <button
                      onClick={() => handlePlay(t)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${activePlaying ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-primary hover:text-white'}`}
                      aria-label={activePlaying ? 'Pause' : 'Play track'}
                    >
                      {activePlaying
                        ? <Pause className="h-3 w-3 fill-current" />
                        : <Play className="h-3 w-3 fill-current ml-0.5" />}
                    </button>
                  ) : (
                    <span className="w-7 h-7 shrink-0 flex items-center justify-center text-muted-foreground/40" aria-hidden="true">
                      <Music className="h-3 w-3" />
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground w-4 text-center tabular-nums">{i + 1}</span>
                  <span className={`text-sm flex-1 ${columns === 2 ? 'line-clamp-2 leading-snug' : 'truncate'} ${isActive ? 'text-primary font-medium' : 'font-medium'}`}>{t.title}</span>
                  {t.lyrics && (
                    <button
                      onClick={() => setLyricsTrack(t)}
                      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors"
                      aria-label="View lyrics"
                    >
                      <ScrollText className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {t.duration ? (
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-10 text-right">{fmt(t.duration)}</span>
                  ) : null}
                </div>
                {isActive && duration > 0 && (
                  <div className="h-0.5 mx-3 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-150" style={{ width: `${(progress / duration) * 100}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <LyricsModal
        release={{ title: lyricsTrack?.title, lyrics: lyricsTrack?.lyrics, cover_image: release?.cover_image }}
        open={!!lyricsTrack}
        onClose={() => setLyricsTrack(null)}
      />
    </>
  );
}