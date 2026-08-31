import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  resolveMedia, canPublish, alreadyPublishedTo, platformResult, platformError, platformUrl, displayTime,
} from '@/lib/postValidation';
import { getPlatform } from '@/lib/socialPlatforms';

function PlatformRow({ platform, state, error, url }) {
  const Icon = getPlatform(platform)?.Icon;
  const tone = state === 'Published' ? 'text-emerald-600 dark:text-emerald-400'
    : state === 'Publishing' ? 'text-violet-600 dark:text-violet-400'
    : state === 'Failed' || state.endsWith('Required') ? 'text-destructive'
    : 'text-muted-foreground';
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && <Icon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />}
      <div className="min-w-0">
        <p className={`font-medium ${tone}`}>
          {platform}: {state}
          {state === 'Publishing' && <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />}
        </p>
        {error && <p className="text-xs text-destructive break-words">{error}</p>}
        {url && <p className="text-xs text-muted-foreground break-all">{url}</p>}
      </div>
    </div>
  );
}

// Final Review — opening this NEVER publishes. Only "Confirm and Publish"
// invokes the real publishPostToSocial function.
export default function FinalReviewDialog({
  post, clips = [], platforms = [], open, onOpenChange, onEdit, campaignName, releaseTitle, timezone,
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [publishing, setPublishing] = useState(false);
  const [live, setLive] = useState(null);
  const [repost, setRepost] = useState(false);

  useEffect(() => { if (open) { setLive(null); setRepost(false); } }, [open, post?.id]);

  if (!post) return null;
  const media = resolveMedia(post, clips);
  const gate = canPublish({ ...post, publish_targets: platforms }, clips);
  const duplicates = platforms.filter((p) => alreadyPublishedTo(post, p));
  const current = live || post;

  const confirm = async () => {
    setPublishing(true);
    try {
      const res = await base44.functions.invoke('publishPostToSocial', {
        post_id: post.id,
        platforms,
        repost,
      });
      const d = res?.data || {};
      setLive(await base44.entities.MarketingPost.get(post.id));
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      if (d.success) {
        toast({ title: `Published to ${(d.published || platforms).join(' + ')}` });
      } else if (d.partial) {
        toast({
          title: `Published to ${d.published.join(', ')} — ${d.failed.join(', ')} failed`,
          description: 'Retry the failed platform below. The successful one will not be posted again.',
          variant: 'destructive',
          duration: 8000,
        });
      } else {
        toast({ title: 'Publishing failed', description: (d.failed || []).map((p) => d.results?.[p]?.error).join(' | '), variant: 'destructive', duration: 8000 });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      toast({ title: 'Publishing failed', description: msg, variant: 'destructive', duration: 8000 });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Final review before publishing</DialogTitle>
          <DialogDescription>
            Publishing to {platforms.join(' + ') || 'no platform selected'}. Nothing is sent until you confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4" aria-live="polite">
          {media ? (
            media.type === 'video'
              ? <video src={media.url} controls playsInline preload="metadata" className="w-full rounded-lg bg-black" />
              : <img src={media.url} alt={post.hook || 'Post media'} className="w-full rounded-lg" />
          ) : (
            <div className="rounded-lg border border-dashed border-destructive/50 p-4 text-sm text-destructive">
              No graphic or video attached — this post cannot be published.
            </div>
          )}

          <div className="text-sm whitespace-pre-wrap">{post.caption || <span className="text-muted-foreground">No caption</span>}</div>
          {post.hashtags && <div className="text-xs text-muted-foreground whitespace-pre-wrap">{post.hashtags}</div>}
          {post.cta && <p className="text-sm"><span className="text-muted-foreground">CTA: </span>{post.cta}</p>}

          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div><dt className="text-muted-foreground inline">Campaign: </dt><dd className="inline">{campaignName || '—'}</dd></div>
            <div><dt className="text-muted-foreground inline">Song / release: </dt><dd className="inline">{releaseTitle || '—'}</dd></div>
            <div><dt className="text-muted-foreground inline">Format: </dt><dd className="inline">{post.format}</dd></div>
            <div><dt className="text-muted-foreground inline">Approval: </dt><dd className="inline">{post.approval_status || 'Not Reviewed'}</dd></div>
            <div className="col-span-2">
              <dt className="text-muted-foreground inline">Scheduled: </dt>
              <dd className="inline">
                {post.scheduled_date ? `${post.scheduled_date} ${displayTime(post.scheduled_time) || ''} (${post.scheduled_timezone || timezone})` : 'Not scheduled — publishing now'}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground inline">Media check: </dt>
              <dd className="inline">
                {media ? `${media.type === 'video' ? 'Video' : 'Graphic'} attached${post.needs_crop ? ' · still marked as needing a final crop' : ''}` : 'Missing'}
              </dd>
            </div>
          </dl>

          <div className="rounded-lg border border-border/60 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Platform results</p>
            {platforms.map((p) => (
              <PlatformRow key={p} platform={p} state={platformResult(current, p)} error={platformError(current, p)} url={platformUrl(current, p)} />
            ))}
            <p className="text-[11px] text-muted-foreground">
              Each account connection is verified by Meta at the moment of publishing — if a connection or permission is missing, that platform reports it here and the other platform is unaffected.
            </p>
          </div>

          {!gate.ok && (
            <p className="flex items-start gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" /> {gate.reason}
            </p>
          )}

          {duplicates.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs space-y-2">
              <p className="flex items-start gap-1.5">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                Already published to {duplicates.join(' and ')}. That platform will be skipped so it isn't posted twice.
              </p>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={repost} onChange={(e) => setRepost(e.target.checked)} />
                Repost to {duplicates.join(' and ')} anyway
              </label>
            </div>
          )}

          {current.publishing_status === 'Published' && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Publishing complete.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="outline" onClick={() => { onOpenChange(false); onEdit && onEdit(post); }}>Back to Edit</Button>
          <Button type="button" onClick={confirm} disabled={!gate.ok || publishing} className="gap-2">
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Confirm and Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}