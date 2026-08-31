import { GripVertical, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveMedia, isLocked } from '@/lib/postValidation';
import MediaStatusBadge from '@/components/marketing/MediaStatusBadge';
import PlatformBadges from '@/components/marketing/PlatformBadges';

// Posts with no scheduled date. Published, cancelled, skipped posts never appear here.
export default function UnscheduledQueue({
  posts, clips = [], campaignName, releaseTitle, onOpen, onMove, onDragStart, onDragEnd, dragHandleProps, dragId,
}) {
  return (
    <div className="glass rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Unscheduled queue</h2>
        <span className="text-xs text-muted-foreground">{posts.length}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">Drag onto a date, or use Move post.</p>
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {posts.map((p) => {
          const media = resolveMedia(p, clips);
          const canDrag = !isLocked(p);
          return (
            <div
              key={p.id}
              data-post-id={p.id}
              draggable={canDrag}
              onDragStart={(e) => onDragStart(p, e)}
              onDragEnd={onDragEnd}
              className={`rounded-xl border border-border/60 bg-card p-2 flex gap-2 ${dragId === p.id ? 'opacity-40' : ''} ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <button
                type="button"
                {...(canDrag && dragHandleProps ? dragHandleProps(p) : {})}
                disabled={!canDrag}
                className={`text-muted-foreground hover:text-foreground pt-1 shrink-0 ${dragId === p.id ? 'text-primary' : ''}`}
                title="Drag onto a date to schedule"
                aria-label="Drag to schedule this post"
              >
                <GripVertical className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onOpen(p)}
                className="flex-1 min-w-0 text-left flex gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                aria-label="Open post details"
              >
                {media ? (
                  media.type === 'video'
                    ? <video src={media.url} preload="metadata" muted playsInline className="w-14 aspect-[9/16] rounded object-cover bg-black shrink-0" />
                    : <img src={media.url} alt="" loading="lazy" className="w-14 aspect-[9/16] rounded object-cover shrink-0" />
                ) : (
                  <div className="w-14 aspect-[9/16] rounded bg-muted/60 flex items-center justify-center shrink-0">
                    <MediaStatusBadge post={p} clips={clips} compact />
                  </div>
                )}
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[11px] line-clamp-2">{p.hook || p.caption || p.format}</p>
                  <div className="flex items-center gap-1"><PlatformBadges post={p} /><span className="text-[10px] text-muted-foreground">{p.status}</span></div>
                  {campaignName(p) && <p className="text-[10px] text-muted-foreground truncate">{campaignName(p)}</p>}
                  {releaseTitle(p) && <p className="text-[10px] text-muted-foreground truncate">{releaseTitle(p)}</p>}
                  <p className="text-[10px] text-muted-foreground">Created {new Date(p.created_date).toLocaleDateString()}</p>
                  <MediaStatusBadge post={p} clips={clips} />
                </div>
              </button>
              <Button type="button" size="icon" variant="ghost" onClick={() => onMove(p)} title="Move post to a date" aria-label="Move post to a date">
                <CalendarPlus className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        {!posts.length && <p className="text-xs text-muted-foreground py-4 text-center">Nothing waiting to be scheduled.</p>}
      </div>
    </div>
  );
}