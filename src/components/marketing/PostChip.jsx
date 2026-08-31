import { Lock, AlertTriangle, Clock, Zap, GripVertical } from 'lucide-react';
import { platformColor, STATUS_STYLES } from '@/lib/marketing';
import { getPostMedia } from '@/lib/postMedia';
import { getPlatform } from '@/lib/socialPlatforms';

function Thumb({ media, post, size }) {
  if (media && media.url) {
    if (media.type === 'video') {
      return (
        <video
          src={media.url}
          muted
          playsInline
          preload="metadata"
          className="rounded bg-black object-cover shrink-0"
          style={{ width: size, height: size }}
        />
      );
    }
    return (
      <img
        src={media.url}
        alt=""
        loading="lazy"
        className="rounded object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const pc = platformColor(post.platform);
  return (
    <div
      className={`rounded flex items-center justify-center text-center px-0.5 leading-none ${pc.bg} ${pc.text} shrink-0`}
      style={{ width: size, height: size }}
    >
      <span className="text-[8px] line-clamp-2">{(post.hook || post.caption || '').slice(0, 18)}</span>
    </div>
  );
}

// PostChip — a calendar chip. `view` controls density:
//   'month' = compact single line with a tiny square thumbnail
//   'week'  = enlarged card with a visible thumbnail, status badge, time
export default function PostChip({
  post,
  clips = [],
  view = 'month',
  onClick,
  draggable = true,
  onDragStart,
  onDragEnd,
  dragHandleProps,
  dragging = false,
  moving = false,
}) {
  const media = getPostMedia(post, clips);
  const pc = platformColor(post.platform);
  const posted = post.status === 'Posted';
  const skipped = post.status === 'Skipped';
  const autoPublish = post.publish_mode === 'auto' && !posted;
  const firstLine = (post.hook || post.caption || post.platform || '').split('\n')[0];
  const canDrag = draggable && !posted && moving !== post.id;

  // Drag handle sits beside the chip (never inside it — a button can't nest a button).
  const Handle = ({ size = 'h-3 w-3' }) => (
    !canDrag || !dragHandleProps ? null : (
      <button
        type="button"
        {...dragHandleProps}
        className={`shrink-0 text-muted-foreground hover:text-foreground ${dragging ? 'text-primary' : ''}`}
        title="Drag to another day to reschedule"
        aria-label="Drag to reschedule this post"
      >
        <GripVertical className={size} aria-hidden="true" />
      </button>
    )
  );

  if (view === 'month') {
    return (
      <div className="flex items-center gap-0.5">
      <Handle />
      <button
        type="button"
        data-post-id={post.id}
        draggable={canDrag}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={`w-full flex items-center gap-1 text-left text-[10px] sm:text-[11px] rounded px-1 py-0.5 ${pc.bg} ${pc.text} hover:opacity-80 ${dragging ? 'opacity-40' : ''} ${posted ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${moving === post.id ? 'animate-pulse' : ''}`}
        title={`${post.platform} · ${post.format}${posted ? ' (posted — locked)' : ' — drag to reschedule'}`}
      >
        <Thumb media={media} post={post} size={16} />
        {(() => { const cfg = getPlatform(post.platform); return cfg ? <cfg.Icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" /> : null; })()}
        <span className="sr-only">{post.platform}</span>
        <span className="truncate flex-1">{firstLine}</span>
        {autoPublish && <Zap className="h-2.5 w-2.5 shrink-0 text-amber-500" />}
        {posted && <Lock className="h-2.5 w-2.5 shrink-0" />}
        {skipped && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
      </button>
      </div>
    );
  }

  // week (enlarged)
  return (
    <div className="flex items-start gap-0.5">
    <Handle size="h-4 w-4" />
    <button
      type="button"
      data-post-id={post.id}
      draggable={canDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`w-full flex gap-2 text-left rounded-lg p-1.5 border border-border/40 ${pc.bg} hover:shadow-sm transition-shadow ${dragging ? 'opacity-40' : ''} ${posted ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${moving === post.id ? 'animate-pulse' : ''}`}
      title={`${post.platform} · ${post.format}${posted ? ' (posted — locked)' : ' — drag to reschedule'}`}
    >
      <Thumb media={media} post={post} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          {(() => { const cfg = getPlatform(post.platform); return cfg ? <cfg.Icon className={`h-2.5 w-2.5 shrink-0 ${pc.text}`} aria-hidden="true" /> : <span className={`w-2 h-2 rounded-full ${pc.dot} shrink-0`} />; })()}
          <span className="text-[10px] font-medium truncate">{post.platform}</span>
          {post.scheduled_time && (
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 shrink-0">
              <Clock className="h-2 w-2" />{post.scheduled_time}
            </span>
          )}
          {autoPublish && <Zap className="h-2.5 w-2.5 text-amber-500 shrink-0" />}
          <span className={`ml-auto text-[8px] px-1 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[post.status] || ''}`}>{post.status}</span>
        </div>
        <p className="text-[11px] leading-tight line-clamp-2">{firstLine}</p>
        {posted && (
          <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            <Lock className="h-2.5 w-2.5" /> posted
          </span>
        )}
        {skipped && (
          <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
            <AlertTriangle className="h-2.5 w-2.5" /> skipped
          </span>
        )}
      </div>
    </button>
    </div>
  );
}