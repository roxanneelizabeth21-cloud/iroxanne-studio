import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Info, Link2 } from 'lucide-react';
import { FIELD_LABEL, CopyBtn } from '@/components/marketing/postEditorFields';

// Ready-made first comment built from the post's selected link.
function linkComment(link) {
  return `▶️ Listen here: ${link}`;
}

// Optional "first comment" text per platform.
// Instagram: posted automatically the moment the post publishes.
// Facebook: Meta does not grant this app permission to write Page comments, so
// the text is stored, previewed, and flagged for a manual paste after publishing.
export default function FirstCommentFields({ form, set, link }) {
  // Hint text only. Built from this post's own link so it can never suggest the
  // wrong project or an old-style link that previews without a card.
  const hint = link
    ? `▶️ Listen here: ${link}`
    : 'Optional — pick a link for this post and tap “Use project link”.';
  return (
    <div className="glass rounded-xl p-3 space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <label className={FIELD_LABEL}>First comment — Instagram</label>
          <div className="flex gap-1.5">
            {link && (
              <Button type="button" variant="outline" size="sm" onClick={() => set('instagram_first_comment', linkComment(link))} className="gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Use project link
              </Button>
            )}
            <CopyBtn label="IG comment" getText={() => form.instagram_first_comment} />
          </div>
        </div>
        <Textarea
          value={form.instagram_first_comment}
          onChange={(e) => set('instagram_first_comment', e.target.value)}
          rows={4}
          placeholder={hint}
        />
        <p className="text-[11px] text-muted-foreground">Posted automatically as the first comment right after this publishes.</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <label className={FIELD_LABEL}>First comment — Facebook</label>
          <CopyBtn label="FB comment" getText={() => form.facebook_first_comment} />
        </div>
        <Textarea
          value={form.facebook_first_comment}
          onChange={(e) => set('facebook_first_comment', e.target.value)}
          rows={4}
          placeholder={hint}
        />
        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
          Facebook won't let this app post comments, so this one is yours to paste — the card flags it with a copy button once the post is live.
        </p>
      </div>
    </div>
  );
}