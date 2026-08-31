import { FIELD_LABEL } from '@/components/marketing/postEditorFields';
import { LINK_TARGETS, defaultLinkTarget, shareablePageUrl } from '@/lib/postLink';

// Chooses which link is appended at the bottom of the post's caption.
export default function PostLinkTargetSelect({ value, onChange, release, streamLink = '' }) {
  const effective = value || defaultLinkTarget(release);
  const preview = effective === 'Streaming link' ? streamLink : shareablePageUrl(release, effective);

  return (
    <div className="space-y-1.5">
      <label className={FIELD_LABEL}>Link at the bottom of the post</label>
      <select
        value={effective}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        {LINK_TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      {preview ? (
        <p className="text-[11px] text-muted-foreground break-all">{preview}</p>
      ) : effective !== 'None' ? (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          {release ? 'This release has no page link yet.' : 'Pick a release for this post to use its page link.'}
        </p>
      ) : null}
    </div>
  );
}