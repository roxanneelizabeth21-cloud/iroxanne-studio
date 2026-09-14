import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';
import { resolveMedia, schedulingTimezone, platformResult, platformError } from '@/lib/postValidation';
import { entityValue } from '@/lib/socialPlatforms';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function StepReview({ draft, post, patchPost, clips, brandProfile, onDone }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const tz = schedulingTimezone(brandProfile);
  const [date, setDate] = useState(post.scheduled_date || '');
  const [time, setTime] = useState(post.scheduled_time || '12:00');
  const [busy, setBusy] = useState(false);
  const media = resolveMedia(post, clips);
  const ids = draft.platformIds.filter(id => ['facebook', 'instagram'].includes(id));
  const locked = ['Posted', 'Partially Published', 'Publishing'].includes(post.status) || post.publishing_status === 'Publishing';
  const caption = id => draft.platformCaptions?.[id] ?? post.caption ?? '';
  const targets = ids.map(entityValue);
  const schedule = async () => {
    if (busy || locked) return;
    const now = new Intl.DateTimeFormat('sv-SE', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).format(new Date());
    const problem = !media ? 'Add a graphic or video first.' : !ids.length ? 'Choose Facebook or Instagram.' :
      ids.some(id => !caption(id).trim()) ? 'Each selected channel needs a caption.' :
      !date || !time || date + ' ' + time <= now ? 'Choose a future date and time in ' + tz + '.' :
      post.needs_crop || post.crop_status === 'needs_crop' ? 'Finish the media crop before approving.' : '';
    if (problem) return toast({ title: problem, variant:'destructive' });
    setBusy(true);
    try {
      await patchPost({
        caption: post.caption || caption(ids[0]),
        create_post_state: { ...post.create_post_state, ...draft },
        approval_status: 'Approved', publish_mode: 'auto', status: 'Scheduled',
        publish_targets: ids.map(entityValue), scheduled_date: date, scheduled_time: time, scheduled_timezone: tz,
        ...Object.fromEntries(ids.flatMap(id => [
          [id + '_scheduled_date', date], [id + '_scheduled_time', time],
          [id + '_publish_status', 'Pending'], [id + '_publish_error', '']
        ]))
      }, false, true);
      onDone({ kind:'scheduled', when: date + ' ' + time + ' (' + tz + ')' });
    } catch (e) {
      toast({ title:'Could not save the schedule', description:e.message, variant:'destructive' });
    } finally { setBusy(false); }
  };
  const publishNow = async () => {
    if (busy || locked) return;
    const problem = !media ? 'Add a graphic or video first.' : !ids.length ? 'Choose Facebook or Instagram.' :
      ids.some(id => !caption(id).trim()) ? 'Each selected channel needs a caption.' :
      post.needs_crop || post.crop_status === 'needs_crop' ? 'Finish the media crop before publishing.' : '';
    if (problem) return toast({ title: problem, variant:'destructive' });
    setBusy(true);
    try {
      await patchPost({
        caption: post.caption || caption(ids[0]),
        create_post_state: { ...post.create_post_state, ...draft },
        approval_status: 'Approved', publish_mode: 'manual', status: 'Approved',
        publish_targets: targets,
      }, false, true);
      const res = await base44.functions.invoke('publishPostToSocial', { post_id: post.id, platforms: targets });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      const d = res?.data || {};
      if (d.success) {
        toast({ title: `Published to ${(d.published || targets).join(' + ')}` });
        onDone({ kind: 'published', when: 'just now' });
      } else if (d.partial) {
        toast({ title: `Published to ${d.published.join(', ')} — ${d.failed.join(', ')} failed`, description: 'Retry the failed platform from the planner.', variant: 'destructive', duration: 8000 });
        onDone({ kind: 'partial', when: 'just now' });
      } else {
        toast({ title: 'Publishing failed', description: (d.failed || []).map((p) => d.results?.[p]?.error).join(' | '), variant: 'destructive', duration: 8000 });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      toast({ title: 'Publishing failed', description: msg, variant: 'destructive', duration: 8000 });
    } finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true);
    try { await patchPost({}); onDone({ kind:'draft' }); }
    catch(e) { toast({ title:'Could not save', description:e.message, variant:'destructive' }); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5">
    <div><h2 className="font-display text-2xl">Review your story</h2>
      <p className="text-sm text-muted-foreground">Check each version below. Nothing new is approved until you press Approve &amp; schedule.</p></div>
    <div className="grid gap-4 md:grid-cols-2">
      {ids.map(id => <article key={id} className="min-w-0 rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold">{entityValue(id)}</h3>
        {media ? media.type === 'video' ? <video src={media.url} controls className="w-full max-h-72 rounded-lg" /> :
          <img src={media.url} alt="Post graphic" className="w-full max-h-72 object-contain rounded-lg" /> :
          <p className="text-destructive">Graphic needed</p>}
        <p className="whitespace-pre-wrap break-words text-sm">{caption(id)}</p>
        {post.hashtags && <p className="text-sm whitespace-pre-wrap">{post.hashtags}</p>}
        {draft.link && <p className="text-sm break-all">{draft.link}</p>}
        <p className="text-xs text-muted-foreground">Delivery: {platformResult(post, entityValue(id))}</p>
        {platformError(post, entityValue(id)) && <p className="text-sm text-destructive">{platformError(post, entityValue(id))}</p>}
      </article>)}
    </div>
    {locked ? <p className="rounded-xl border p-4">This story has already been sent or is being published. Its delivery history is preserved.</p> :
      <section className="rounded-2xl border border-border p-4 space-y-4">
        <h3 className="font-medium">When should it go out?</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 block">Date<Input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          <label className="space-y-1 block">Time<Input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
        </div>
        <p className="text-sm text-muted-foreground">Timezone: {tz}. Both selected channels use this time. Delivery results appear separately.</p>
        <Button onClick={schedule} disabled={busy}>{busy ? 'Saving…' : 'Approve & schedule'}</Button>
        <p className="text-xs text-muted-foreground">This approves the captions and graphic shown above and enables automatic publishing at your chosen time.</p>
        <div className="border-t border-border/50 pt-3">
          <p className="text-sm font-medium mb-2">Or send it right now</p>
          <Button onClick={publishNow} disabled={busy} variant="secondary" className="gap-2 w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publish Now to {targets.join(' + ')}
          </Button>
          <p className="text-xs text-muted-foreground mt-1.5">Approves and publishes immediately to all selected channels — no waiting for the scheduled time.</p>
        </div>
      </section>}
    <div className="flex flex-wrap gap-3">
      {!locked && <Button variant="outline" disabled={busy} onClick={save}>Save & finish later</Button>}
      <Button asChild variant="ghost"><Link to="/marketing">Back to planner</Link></Button>
    </div>
  </div>;
}