import { useState } from 'react';
import { Loader2, Play, FilePlus2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STEPS } from '@/lib/createPost';
import { resolveMedia } from '@/lib/postValidation';

const when = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};

// Shown when Create Post opens with an unfinished Draft — nothing new is started
// automatically, and discarding always asks first.
export default function ResumeDraftCard({ post, clips, projectTitle, platformLabels, onContinue, onStartNew, onDiscard }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const media = resolveMedia(post, clips);
  const stepIndex = Math.min(Number(post.create_post_step) || 0, STEPS.length - 1);

  const discard = async () => {
    setBusy(true);
    try { await onDiscard(); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-xl rounded-2xl border border-border/60 bg-card/60 p-4 space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold">Continue your post</h2>
        <p className="text-sm text-muted-foreground mt-1">You have an unfinished draft. Nothing was lost.</p>
      </div>

      <div className="flex gap-3">
        {media ? (
          media.type === 'video'
            ? <video src={media.url} muted playsInline preload="metadata" className="h-20 w-20 rounded-lg object-cover bg-black shrink-0" />
            : <img src={media.url} alt="" className="h-20 w-20 rounded-lg object-cover border border-border/60 shrink-0" />
        ) : (
          <span className="h-20 w-20 rounded-lg bg-muted grid place-items-center text-[10px] text-muted-foreground shrink-0">No media</span>
        )}
        <dl className="text-xs space-y-1 min-w-0">
          <div><dt className="text-muted-foreground inline">Project: </dt><dd className="inline">{projectTitle || '—'}</dd></div>
          <div><dt className="text-muted-foreground inline">Platform: </dt><dd className="inline">{platformLabels || '—'}</dd></div>
          <div><dt className="text-muted-foreground inline">Last step: </dt><dd className="inline">{STEPS[stepIndex].label}</dd></div>
          <div><dt className="text-muted-foreground inline">Last saved: </dt><dd className="inline">{when(post.updated_date)}</dd></div>
        </dl>
      </div>

      {confirming ? (
        <div role="alert" className="rounded-xl border border-destructive/40 p-3 space-y-2">
          <p className="text-sm">Discard this draft? Your images, clips, campaigns and media all stay exactly as they are.</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="destructive" onClick={discard} disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Yes, discard it
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>Keep it</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onContinue} className="gap-1.5"><Play className="h-4 w-4" /> Continue Draft</Button>
          <Button type="button" variant="outline" onClick={onStartNew} className="gap-1.5"><FilePlus2 className="h-4 w-4" /> Start New Post</Button>
          <Button type="button" variant="ghost" onClick={() => setConfirming(true)} className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Discard Draft
          </Button>
        </div>
      )}
    </div>
  );
}