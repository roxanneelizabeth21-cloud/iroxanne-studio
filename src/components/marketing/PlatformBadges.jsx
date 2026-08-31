import { getPlatform, normalizePlatformList } from '@/lib/socialPlatforms';
import { publishTargets, platformResult } from '@/lib/postValidation';

const RESULT_LABEL = {
  Published: 'published',
  Publishing: 'publishing',
  Failed: 'failed',
  'Connection Required': 'connection required',
  'Permission Required': 'permission required',
  Ready: 'ready',
  'Not Selected': 'selected',
};

// Platform icons for a post. Every icon comes from the shared platform config,
// so Instagram, Facebook, TikTok and YouTube each render their own distinct mark.
// An unrecognised platform value is skipped rather than falling back to another
// platform's icon (that fallback is what produced two identical marks).
export default function PlatformBadges({ post, size = 'sm' }) {
  const targets = publishTargets(post);
  const ids = normalizePlatformList(targets.length ? targets : [post?.platform]);
  const cls = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <div className="flex items-center gap-1">
      {ids.map((id) => {
        const cfg = getPlatform(id);
        if (!cfg) return null;
        const result = cfg.canPublish ? platformResult(post, cfg.entityValue) : 'Not Selected';
        const suffix = cfg.canPublish
          ? (result !== 'Not Selected' ? ` — ${RESULT_LABEL[result] || result}` : '')
          : ' — manual sharing only';
        const label = `${cfg.label}${suffix}`;
        return (
          <span
            key={id}
            title={label}
            className={`inline-flex items-center justify-center rounded p-0.5 ${cfg.color.bg} ${cfg.color.text}`}
          >
            <cfg.Icon className={cls} aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </span>
        );
      })}
    </div>
  );
}