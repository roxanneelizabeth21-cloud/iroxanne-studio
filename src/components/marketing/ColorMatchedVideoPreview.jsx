import { useState } from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDominantColor } from '@/hooks/useDominantColor';

// Shows an uploaded video inside a player frame whose colors are pulled from the
// release's cover art. The color match is optional and on by default when art exists.
export default function ColorMatchedVideoPreview({ src, coverUrl, className = '' }) {
  const { dominant } = useDominantColor(coverUrl);
  const [matched, setMatched] = useState(true);
  const on = matched && !!dominant;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div
        className="rounded-lg p-2 transition-colors"
        style={
          on
            ? {
                background: `linear-gradient(160deg, ${dominant} 0%, rgba(0,0,0,0.85) 100%)`,
                boxShadow: `0 0 24px ${dominant}55`,
              }
            : { background: 'rgb(0 0 0 / 0.9)' }
        }
      >
        <video
          src={src}
          controls
          muted
          className="w-full max-h-64 rounded-md bg-black"
          style={on ? { border: `1px solid ${dominant}` } : undefined}
        />
      </div>
      {dominant && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setMatched((v) => !v)} className="gap-1.5">
          <Palette className="h-3.5 w-3.5" />
          {matched ? 'Color match on' : 'Color match off'}
          <span className="h-3 w-3 rounded-full border border-border" style={{ background: dominant }} />
        </Button>
      )}
    </div>
  );
}