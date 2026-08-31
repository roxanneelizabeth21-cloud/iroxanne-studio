import { Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { publishTargets } from '@/lib/postValidation';
import {
  PUBLISHING_PLATFORMS, MANUAL_PLATFORMS, normalizePlatformList, profileUrl,
} from '@/lib/socialPlatforms';

// Compact card actions, all icons and labels from the shared platform config:
//  · general Share (neutral share icon)
//  · Publish to Instagram / Facebook — only for platforms selected on the post
//  · Open TikTok Profile / Open YouTube Channel — manual only, only when a
//    profile URL is saved and that platform is on the post
//  · More (everything else lives in the post's detail panel)
export default function CardShareActions({ post, brandProfile, onShare, onPublish, onManual, onMore, onDelete }) {
  const targets = publishTargets(post);
  const selected = normalizePlatformList([...targets, post?.platform]);
  const stop = (fn) => (e) => { e.stopPropagation(); fn && fn(); };

  const btn = 'inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="flex items-center gap-0.5">
      <button type="button" className={btn} onClick={stop(onShare)} title="Share using another app" aria-label="Share this post using another app">
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {PUBLISHING_PLATFORMS.filter((p) => targets.includes(p.entityValue)).map((p) => (
        <button
          key={p.id}
          type="button"
          className={btn}
          onClick={stop(() => onPublish && onPublish([p.entityValue]))}
          title={p.tooltip}
          aria-label={`${p.actionLabel} — opens final review`}
        >
          <p.Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}

      {MANUAL_PLATFORMS.filter((p) => selected.includes(p.id) && profileUrl(brandProfile, p.id)).map((p) => (
        <button
          key={p.id}
          type="button"
          className={btn}
          onClick={stop(() => onManual && onManual(p.id))}
          title={p.tooltip}
          aria-label={`${p.actionLabel} — manual sharing, does not publish`}
        >
          <p.Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}

      {onDelete && (
        <button
          type="button"
          className={`${btn} hover:text-destructive`}
          onClick={stop(onDelete)}
          title="Delete this post"
          aria-label="Delete this post"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}

      <button type="button" className={btn} onClick={stop(onMore)} title="More actions" aria-label="More actions for this post">
        <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}