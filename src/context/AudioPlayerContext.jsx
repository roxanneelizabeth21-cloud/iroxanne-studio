import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(new Audio());
  const volumeRef = useRef(0.8);

  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      const current = audio.currentTime;
      setProgress(current);

      // Tail fade for fallback previews: ramp volume down over the last 2s.
      if (audio._fadeStart != null && current >= audio._fadeStart && audio._fadeStart < audio._snippetEnd) {
        const span = (audio._snippetEnd - audio._fadeStart) || 2;
        const frac = Math.max(0, 1 - (current - audio._fadeStart) / span);
        audio.volume = Math.max(0, (volumeRef.current ?? 0.8) * frac);
      }

      // Auto-stop at snippet end if defined
      if (audio._snippetEnd && current >= audio._snippetEnd) {
        audio.pause();
        audio.volume = volumeRef.current ?? 0.8;
        audio.currentTime = audio._snippetStart || 0;
        setIsPlaying(false);
        setProgress(audio._snippetStart || 0);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      audio.volume = volumeRef.current ?? 0.8;
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    volumeRef.current = volume;
    audioRef.current.volume = volume;
  }, [volume]);

  const playTrack = useCallback((track) => {
    const audio = audioRef.current;

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        const p = audio.play();
        if (p !== undefined) p.then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }

    audio.pause();
    audio.volume = volumeRef.current ?? 0.8;
    setProgress(0);
    setDuration(0);
    setCurrentTrack(track);

    // Use audio_snippet if available, fallback to preview_url
    const src = track.audio_snippet || track.preview_url || null;

    if (src) {
      audio.src = src;
      audio._snippetStart = track.snippet_start || 0;
      audio._snippetEnd = track.snippet_end || null;
      // Tail fade for fallback previews (2s before the snippet end).
      audio._fadeStart = track.fade && audio._snippetEnd != null ? Math.max(audio._snippetStart || 0, audio._snippetEnd - 2) : null;
      audio.load();
      const snippetStart = track.snippet_start || 0;
      const startAndPlay = () => {
        if (snippetStart > 0) audio.currentTime = snippetStart;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => setIsPlaying(true)).catch((err) => {
            if (err.name !== 'AbortError') setIsPlaying(false);
          });
        }
      };
      if (audio.readyState >= 1) {
        startAndPlay();
      } else {
        audio.addEventListener('loadedmetadata', function onMeta() {
          audio.removeEventListener('loadedmetadata', onMeta);
          startAndPlay();
        });
      }
    } else {
      audio._snippetStart = 0;
      audio._snippetEnd = null;
      audio._fadeStart = null;
      setIsPlaying(false);
    }
  }, [currentTrack, isPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!currentTrack) return;
    const src = currentTrack.audio_snippet || currentTrack.preview_url;
    if (!src) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const p = audio.play();
      if (p !== undefined) p.then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying, currentTrack]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    audio.currentTime = time;
    setProgress(time);
  }, []);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    audio.pause();
    audio._snippetStart = 0;
    audio._snippetEnd = null;
    audio._fadeStart = null;
    audio.volume = volumeRef.current ?? 0.8;
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, []);

  return (
    <AudioPlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      progress,
      duration,
      volume,
      playTrack,
      togglePlay,
      seek,
      closePlayer,
      setVolume,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
}