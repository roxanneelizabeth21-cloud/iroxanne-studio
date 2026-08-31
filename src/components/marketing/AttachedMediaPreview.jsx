import { useState, useEffect } from 'react';
import { AlertTriangle, Replace, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// The persistent Media Preview for an attached graphic or video. Renders the
// real attached URL, never autoplays, and reports a load failure instead of
// silently treating a broken URL as valid.
export default function AttachedMediaPreview({ media, post, onChange, onRemove, removing }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [media?.url]);

  const isVideo = media.mediaType === 'video';
  const label = isVideo ? 'Video attached' : 'Graphic attached';

  return (
    <div className="space-y-2">
      {failed ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 space-y-1.5">
          <p className="text-sm font-medium text-destructive inline-flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Media failed to load
          </p>
          <p className="text-xs text-muted-foreground break-all">
            {media.source === 'clip' || media.source === 'legacy_clip'
              ? `Clip reference ${media.clipId} → ${media.url}`
              : media.url}
          </p>
          <Button type="button" size="sm" variant="secondary" onClick={onChange} className="gap-1.5">
            <Replace className="h-3.5 w-3.5" /> Replace Media
          </Button>
        </div>
      ) : isVideo ? (
        <video
          src={media.url}
          controls
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          className="w-full max-h-[420px] rounded-lg bg-black object-contain"
        />
      ) : (
        <img
          src={media.url}
          alt={post?.hook || 'Attached post graphic'}
          onError={() => setFailed(true)}
          className="w-full max-h-[420px] rounded-lg bg-muted object-contain"
        />
      )}

      {!failed && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{label}</span>
          <Button type="button" size="sm" variant="outline" onClick={onChange} className="gap-1.5">
            <Replace className="h-3.5 w-3.5" /> Change
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onRemove} disabled={removing} className="gap-1.5 text-destructive">
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove
          </Button>
        </div>
      )}
    </div>
  );
}