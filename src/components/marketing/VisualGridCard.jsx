import { Play, Lock, Clock, Megaphone, Music2, Zap, ExternalLink, GripVertical } from 'lucide-react';
import { STATUS_STYLES } from '@/lib/marketing';
import { mediaState, isLocked, displayTime, publishTargets, platformResult, shortTimezone } from '@/lib/postValidation';
import PlatformBadges from '@/components/marketing/PlatformBadges';
import MediaStatusBadge from '@/components/marketing/MediaStatusBadge';
import CardShareActions from '@/components/marketing/CardShareActions';
import CardFirstComment from '@/components/marketing/CardFirstComment';
import SnippetTimesLine from '@/components/marketing/SnippetTimesLine';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MediaArea({ post, state, playing, onPlay }) {
  const media = state.media;
  if (!media) {
    return (
      <div className="w-full aspect-[9/16] bg-muted/50 flex flex-col items-center justify-center gap-1 text-center px-2">
        <MediaStatusBadge post={post} clips={[]} />
        <p className="text-[10px] text-muted-foreground line-clamp-3">{post.image_prompt ? 'Image prompt only — not media' : 'Attach a graphic or video'}</p>
      </div>
    );
  }
  if (media.type === 'video') {
    if (playing) {
      return <video src={media.url} controls autoPlay playsInline className="w-full aspect-[9/16] object-contain bg-black" />;
    }
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPlay && onPlay(); }}
        className="relative w-full aspect-[9/16] bg-black group/media focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Preview this video"
        title="Preview this video"
      >
        <video src={media.url} preload="metadata" muted playsInline className="w-full h-full object-cover pointer-events-none" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/60 p-2.5"><Play className="h-5 w-5 text-white" aria-hidden="true" /></span>
        </span>
      </button>
    );
  }
  return (
    <img
      src={media.url}
      alt={post.hook || post.caption?.slice(0, 80) || 'Marketing post graphic'}
      loading="lazy"
      className="w-full aspect-[9/16] object-cover bg-muted"
    />
  );
}

// A vertical visual-calendar card: date header, large media, then status /
// platform / media-type / campaign / share actions.
export default function VisualGridCard({
  post, clips = [], campaignName, releaseTitle, timezone, brandProfile,
  onOpen, onShare, onPublish, onManual, onMore, onDelete, playing, onPlay,
  draggable = true, onDragStart, onDragEnd, dragHandleProps, dragging = false, moving = false,
}) {
  const state = mediaState(post, clips);
  const locked = isLocked(post);
  const canDrag = draggable && !locked && !moving;
  const d = post.scheduled_date ? new Date(`${post.scheduled_date}T00:00:00`) : null;
  const targets = publishTargets(post);
  const failedPlatforms = targets.filter((p) => ['Failed', 'Connection Required', 'Permission Required'].includes(platformResult(post, p)));
  const publishedPlatforms = targets.filter((p) => platformResult(post, p) === 'Published');

  return (
    <div
      data-post-id={post.id}
      draggable={canDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`w-full max-w-[250px] rounded-2xl border border-border/60 bg-card overflow-hidden flex flex-col ${dragging ? 'opacity-40' : ''} ${moving ? 'animate-pulse' : ''} ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1 px-2.5 py-2 border-b border-border/50">
        {canDrag && dragHandleProps && (
          <button
            type="button"
            {...dragHandleProps}
            className={`-ml-1 p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 ${dragging ? 'text-primary bg-primary/10' : ''}`}
            title="Drag to another day to reschedule"
            aria-label="Drag to reschedule this post"
          >
            <GripVertical className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{d ? DOW[d.getDay()] : 'Unscheduled'}</p>
          <p className="text-sm font-semibold leading-tight">
            {d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] flex items-center gap-1 justify-end text-muted-foreground whitespace-nowrap">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {displayTime(post.scheduled_time) || '—'}
          </p>
          <p className="text-[9px] text-muted-foreground whitespace-nowrap" title={post.scheduled_timezone || timezone}>
            {shortTimezone(post.scheduled_timezone || timezone)}
          </p>
        </div>
      </div>

      {/* Media — a div (not a button) so the video play control can nest inside it */}
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen && onOpen(); } }}
        className="block text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open post details for ${post.platform} ${post.format}`}
      >
        <MediaArea post={post} state={state} playing={playing} onPlay={onPlay} />
      </div>

      {/* Footer */}
      <div
        onClick={(e) => { if (!e.target.closest('button, a, input, select, textarea')) onOpen && onOpen(); }}
        className="p-2.5 space-y-1.5 flex-1 flex flex-col cursor-pointer"
      >
        <p className="text-[11px] leading-snug line-clamp-2 text-foreground">{post.hook || post.caption || '—'}</p>

        <div className="flex flex-wrap items-center gap-1">
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[post.status] || 'bg-muted text-muted-foreground'}`}>
            {post.status}
          </span>
          <MediaStatusBadge post={post} clips={clips} />
          {locked && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground" title="Published — locked in place">
              <Lock className="h-2.5 w-2.5" aria-hidden="true" /> locked
            </span>
          )}
          {post.publish_mode === 'auto' && !locked && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400" title="Auto-publishes at its scheduled time">
              <Zap className="h-2.5 w-2.5" aria-hidden="true" /> auto
            </span>
          )}
          {post.approval_status === 'Approved' && (
            <span className="text-[10px] text-teal-700 dark:text-teal-400">approved</span>
          )}
          {post.approval_status === 'Changes Requested' && (
            <span className="text-[10px] text-amber-700 dark:text-amber-400">changes requested</span>
          )}
        </div>

        {(campaignName || releaseTitle) && (
          <div className="space-y-0.5">
            {campaignName && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                <Megaphone className="h-2.5 w-2.5 shrink-0" aria-hidden="true" /> {campaignName}
              </p>
            )}
            {releaseTitle && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                <Music2 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" /> {releaseTitle}
              </p>
            )}
          </div>
        )}

        <SnippetTimesLine post={post} />

        {publishedPlatforms.length > 0 && (
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
            Published on {publishedPlatforms.join(', ')}
            {post.posted_at ? ` · ${new Date(post.posted_at).toLocaleString()}` : ''}
          </p>
        )}
        {failedPlatforms.map((p) => (
          <p key={p} className="text-[10px] text-destructive break-words">{p}: {platformResult(post, p)}</p>
        ))}
        {publishedPlatforms.map((p) => {
          const url = p === 'Instagram' ? post.instagram_post_url : post.facebook_post_url;
          if (!url || !/^https?:/i.test(url)) return null;
          return (
            <a key={p} href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] text-primary inline-flex items-center gap-1">
              <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" /> View on {p}
            </a>
          );
        })}
        <CardFirstComment post={post} />

        {post.manual_metrics?.views ? (
          <p className="text-[10px] text-muted-foreground">{post.manual_metrics.views} views · {post.manual_metrics.likes || 0} likes</p>
        ) : null}

        <div className="flex items-center justify-between pt-1 mt-auto">
          <PlatformBadges post={post} />
          <CardShareActions post={post} brandProfile={brandProfile} onShare={onShare} onPublish={onPublish} onManual={onManual} onMore={onMore} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}