import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// AudioPreviewButton — small inline play/pause control that lets the admin
// hear the audio_file currently attached to a song, so they can verify which
// track belongs to which title.
export default function AudioPreviewButton({ src, label = 'Preview' }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => () => {
    const el = ref.current;
    if (el) { el.pause(); el.currentTime = 0; }
  }, []);

  if (!src) return null;

  const toggle = async () => {
    const el = ref.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    try {
      setLoading(true);
      el.currentTime = 0;
      await el.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <audio
        ref={ref}
        src={src}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={toggle}
        disabled={loading}
        className="gap-1.5"
        title={playing ? 'Pause preview' : 'Play attached audio'}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {playing ? 'Stop' : label}
      </Button>
    </>
  );
}