import { Pencil, RefreshCw, SkipForward, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { platformColor, STATUS_STYLES, isVideoFormat, copyText, resolvePostLink } from '@/lib/marketing';
import CopyEverythingButton from './CopyEverythingButton';
import AssemblyChecklist from './AssemblyChecklist';

// TodayPostCard — a large, mobile-first card for one of today's posts.
// Primary action: Copy Everything. Secondary: edit, regenerate, skip, mark posted.
// Video posts show the inline assembly checklist.
export default function TodayPostCard({ post, templates, portfolioItems, onEdit, onRegenerate, onSkip, onMarkPosted, busyId }) {
  const pc = platformColor(post.platform);
  const isVideo = isVideoFormat(post.format);
  const template = templates.find((t) => t.id === post.template_id) || null;

  // Link to append at the bottom of the post: the project's portfolio page or the consult-booking page.
  const link = resolvePostLink(post, portfolioItems);

  const busy = busyId === post.id;
  const firstLine = String(post.hook || (post.caption || '').split('\n')[0] || '').trim();

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pc.dot}`} />
          <span className="font-medium truncate">{post.platform}</span>
          <span className="text-xs text-muted-foreground shrink-0">· {post.format}</span>
          {post.auto_generated && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">auto</span>}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${STATUS_STYLES[post.status] || STATUS_STYLES.Draft}`}>{post.status}</span>
      </div>

      {post.scheduled_time && <p className="text-xs text-muted-foreground">⏰ {post.scheduled_time}</p>}

      {firstLine && <p className="font-medium leading-snug">{firstLine}</p>}
      {post.caption && <p className="text-sm text-muted-foreground line-clamp-5 whitespace-pre-wrap">{post.caption}</p>}
      {post.hashtags && <p className="text-xs text-primary/80 whitespace-pre-wrap break-words">{post.hashtags}</p>}
      {post.cta && <p className="text-sm"><span className="text-muted-foreground">CTA: </span>{post.cta}</p>}
      {post.image_prompt && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <span className="shrink-0">🖼 Image:</span>
          <button onClick={() => copyText(post.image_prompt)} className="text-left break-words hover:text-foreground" title="Copy image prompt">{post.image_prompt}</button>
        </div>
      )}

      {isVideo && <AssemblyChecklist post={post} template={template} />}

      <div className="pt-1">
        <CopyEverythingButton post={post} link={link} className="w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(post)} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
        <Button variant="outline" size="sm" onClick={() => onRegenerate(post)} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSkip(post)} className="gap-1.5"><SkipForward className="h-3.5 w-3.5" /> Skip</Button>
        {post.status !== 'Posted' && (
          <Button variant="secondary" size="sm" onClick={() => onMarkPosted(post)} className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Mark posted</Button>
        )}
      </div>
    </div>
  );
}