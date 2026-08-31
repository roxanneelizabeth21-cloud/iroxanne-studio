import { Check, Film } from 'lucide-react';

// Pick the clips for the reel, in the order they were tapped — that order
// becomes the shot list in the assembly brief.
export default function ReelClipPicker({ clips, selectedIds, onToggle }) {
  if (clips.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
        <Film className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
        No clips saved yet. Upload footage in the Clips library first.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {clips.map((c) => {
        const order = selectedIds.indexOf(c.id);
        const picked = order > -1;
        const isVideo = /\.(mp4|mov|webm|m4v)(\?|$)/i.test(c.file || '');
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            aria-pressed={picked}
            className={`group relative overflow-hidden rounded-xl border text-left transition-colors ${picked ? 'border-primary' : 'border-border/70 hover:border-primary/50'}`}
          >
            <div className="aspect-[9/16] bg-secondary/50">
              {c.file ? (
                isVideo ? (
                  <video src={c.file} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  <img src={c.file} alt="" className="h-full w-full object-cover" />
                )
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Film className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
            </div>
            {picked && (
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {order + 1}
              </span>
            )}
            <div className="p-2">
              <p className="truncate text-xs font-medium">{c.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {c.orientation || '—'}{c.duration_seconds ? ` · ${c.duration_seconds}s` : ''}
              </p>
            </div>
            {picked && <Check className="sr-only" />}
          </button>
        );
      })}
    </div>
  );
}