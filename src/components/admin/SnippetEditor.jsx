import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Scissors, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function SnippetEditor({ fullAudioUrl, onSnippetChange, initialStart = 0, initialEnd = 30 }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [confirmed, setConfirmed] = useState(false);

  // Keep refs in sync so timeupdate callback always has latest values without re-registering listeners
  const previewModeRef = useRef(false);
  const endTimeRef = useRef(endTime);
  const startTimeRef = useRef(startTime);
  useEffect(() => { previewModeRef.current = previewMode; }, [previewMode]);
  useEffect(() => { endTimeRef.current = endTime; }, [endTime]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);

  useEffect(() => {
    if (!fullAudioUrl || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = fullAudioUrl;
    audio.load();
    const onMeta = () => setTotalDuration(audio.duration);
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (previewModeRef.current && audio.currentTime >= endTimeRef.current) {
        audio.pause();
        audio.currentTime = startTimeRef.current;
        setIsPlaying(false);
        setPreviewMode(false);
        previewModeRef.current = false;
      }
    };
    const onEnded = () => { setIsPlaying(false); setPreviewMode(false); previewModeRef.current = false; };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, [fullAudioUrl]);

  const playSnippet = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && previewMode) {
      audio.pause();
      setIsPlaying(false);
      setPreviewMode(false);
    } else {
      audio.currentTime = startTime;
      setPreviewMode(true);
      setIsPlaying(true);
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
        setPreviewMode(false);
      }
    }
  };

  const handleStartChange = (val) => {
    const s = Math.max(0, Math.min(val[0], endTime - 5));
    setStartTime(s);
    setConfirmed(false);
  };

  const handleEndChange = (val) => {
    const e = Math.max(startTime + 5, Math.min(val[0], totalDuration));
    setEndTime(e);
    setConfirmed(false);
  };

  const applyPreset = (dur) => {
    setEndTime(Math.min(startTime + dur, totalDuration));
    setConfirmed(false);
  };

  const confirmSnippet = () => {
    onSnippetChange({
      audio_snippet: fullAudioUrl,
      snippet_start: Math.round(startTime * 10) / 10,
      snippet_end: Math.round(endTime * 10) / 10,
      snippet_duration: Math.round((endTime - startTime) * 10) / 10,
    });
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 3000);
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const startPercent = totalDuration > 0 ? (startTime / totalDuration) * 100 : 0;
  const endPercent = totalDuration > 0 ? (endTime / totalDuration) * 100 : 100;
  const snippetDuration = endTime - startTime;

  if (!fullAudioUrl) {
    return (
      <div className="border-2 border-dashed border-border/40 rounded-xl p-6 text-center">
        <Scissors className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Upload a full song file above to set a preview snippet</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <audio ref={audioRef} preload="metadata" className="hidden" />

      <p className="text-sm text-muted-foreground">
        Drag the handles to select which part of the song plays as a preview. Then click <strong>Confirm Snippet</strong>.
      </p>

      {/* Timeline bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{fmt(currentTime)}</span>
          <span>Total: {fmt(totalDuration)}</span>
        </div>
        <div className="relative h-8 bg-secondary/60 rounded-lg overflow-hidden">
          {/* Snippet region */}
          <div
            className="absolute top-0 bottom-0 bg-primary/25 border-l-2 border-r-2 border-primary"
            style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
          />
          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-white/80" style={{ left: `${progressPercent}%` }} />
          {/* Start label */}
          <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${startPercent}%` }}>
            <div className="-ml-4 text-xs bg-primary text-white px-1.5 py-0.5 rounded font-mono">{fmt(startTime)}</div>
          </div>
          {/* End label */}
          <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${endPercent}%` }}>
            <div className="-ml-4 text-xs bg-primary text-white px-1.5 py-0.5 rounded font-mono">{fmt(endTime)}</div>
          </div>
        </div>
      </div>

      {/* Start / End sliders */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>Start</span><span className="font-mono text-foreground">{fmt(startTime)}</span>
          </label>
          <Slider min={0} max={totalDuration || 100} step={0.5} value={[startTime]} onValueChange={handleStartChange} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>End</span><span className="font-mono text-foreground">{fmt(endTime)}</span>
          </label>
          <Slider min={0} max={totalDuration || 100} step={0.5} value={[endTime]} onValueChange={handleEndChange} />
        </div>
      </div>

      {/* Duration + presets + preview */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-primary">{fmt(snippetDuration)} preview</span>
        <span className="text-muted-foreground text-xs">Quick set:</span>
        {[15, 30, 45].map((d) => (
          <button
            key={d}
            onClick={() => applyPreset(d)}
            className="px-2.5 py-1 text-xs rounded-md border border-border/60 hover:border-primary/60 hover:text-primary transition-colors"
          >
            {d}s
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={playSnippet} className="ml-auto gap-2 text-xs">
          {isPlaying && previewMode ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isPlaying && previewMode ? 'Stop Preview' : 'Preview'}
        </Button>
      </div>

      {/* Confirm button */}
      <Button onClick={confirmSnippet} disabled={snippetDuration < 1} className="w-full gap-2">
        {confirmed ? <><Check className="h-4 w-4" /> Snippet Set!</> : <><Scissors className="h-4 w-4" /> Confirm Snippet ({fmt(snippetDuration)})</>}
      </Button>
    </div>
  );
}