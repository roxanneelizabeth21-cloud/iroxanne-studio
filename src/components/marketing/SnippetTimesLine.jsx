import { useState } from 'react';
import { Music4, Copy, Check } from 'lucide-react';
import { formatDuration, copyText } from '@/lib/marketing';

// Shows the music snippet chosen for a post as "Sound 0:12 → 0:42" and copies
// those times so they can be pasted straight into CapCut / Canva.
export default function SnippetTimesLine({ post, trackTitle = '', className = '' }) {
  const [done, setDone] = useState(false);
  const start = post?.music_start_seconds;
  const end = post?.music_end_seconds;
  if (start == null || end == null) return null;

  const times = `${formatDuration(start)} → ${formatDuration(end)}`;

  const handle = async (e) => {
    e.stopPropagation();
    const ok = await copyText(`${trackTitle ? `${trackTitle} — ` : ''}${times}`);
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      title="Copy these snippet times for CapCut"
      className={`text-[10px] text-muted-foreground inline-flex items-center gap-1 hover:text-foreground ${className}`}
    >
      <Music4 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
      <span className="truncate">Sound {times}</span>
      {done ? <Check className="h-2.5 w-2.5" aria-hidden="true" /> : <Copy className="h-2.5 w-2.5" aria-hidden="true" />}
    </button>
  );
}