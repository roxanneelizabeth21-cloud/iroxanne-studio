import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, CalendarClock, Share2, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import FinalReviewDialog from '@/components/marketing/FinalReviewDialog';
import ManualShareDialog from '@/components/marketing/ManualShareDialog';
import MarkPostedManuallyDialog from '@/components/marketing/MarkPostedManuallyDialog';
import { resolveMedia, canSchedule, canPublish, schedulingTimezone, shortTimezone, displayTime } from '@/lib/postValidation';
import { getPlatform, entityValue } from '@/lib/socialPlatforms';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';
const today = () => new Date().toISOString().slice(0, 10);

// Step 4 — a realistic preview plus the four completion paths. Publishing only
// ever happens through the existing Final Review confirmation.
export default function StepReview({
  draft, post, patchPost, clips, brandProfile, campaignName, songTitle, onDone, onEdit,
}) {
  const { toast } = useToast();
  const [finalOpen, setFinalOpen] = useState(false);
  const [manualId, setManualId] = useState('');
  const [markOpen, setMarkOpen] = useState(false);
  const [date, setDate] = useState(post.scheduled_date || today());
  const [time, setTime] = useState(post.scheduled_time || '09:00');
  const [busy, setBusy] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const media = resolveMedia(post, clips);
  const tz = schedulingTimezone(brandProfile);
  const publishIds = draft.platformIds.filter((p) => ['instagram', 'facebook'].includes(p));
  const manualIds = draft.platformIds.filter((p) => ['tiktok', 'youtube'].includes(p));
  const approved = post.approval_status === 'Approved';

  const setApproved = async (on) => {
    await patchPost({ approval_status: on ? 'Approved' : 'Not Reviewed' });
  };

  const openFinal = () => {
    const gate = canPublish({ ...post, publish_targets: publishIds.map(entityValue) }, clips);
    if (!gate.ok) return toast({ title: gate.reason, variant: 'destructive' });
    setFinalOpen(true);
  };

  const schedule = async () => {
    const gate = canSchedule(post, clips);
    if (!gate.ok) return toast({ title: gate.reason, variant: 'destructive' });
    if (!String(post.caption || '').trim()) return toast({ title: 'Add a caption before scheduling.', variant: 'destructive' });
    setBusy('schedule');
    try {
      await patchPost({
        scheduled_date: date,
        scheduled_time: time,
        scheduled_timezone: tz,
        status: 'Scheduled',
      });
      onDone({ kind: 'scheduled', when: `${date} ${displayTime(time)} (${shortTimezone(tz)})` });
    } catch (e) {
      toast({ title: 'Could not schedule', description: e.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const saveDraftPost = async () => {
    setBusy('draft');
    try {
      await patchPost({ status: 'Draft', scheduled_date: date });
      onDone({ kind: 'draft' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">Review your post</h2>
        <p className="text-sm text-muted-foreground mt-1">This is exactly what will be posted.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {media ? (
            media.type === 'video'
              ? <video src={media.url} controls playsInline preload="metadata" className="w-full rounded-xl bg-black" />
              : <img src={media.url} alt={post.hook || 'Post media'} className="w-full rounded-xl border border-border/60" />
          ) : (
            <p className="flex items-start gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" /> No media attached.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {media?.type === 'video' ? 'Video' : 'Graphic'} prepared for {post.requested_aspect_ratio || draft.aspect}. Final crop may still be needed.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {draft.platformIds.map((id) => {
              const cfg = getPlatform(id);
              return cfg ? (
                <span key={id} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${cfg.color.border} ${cfg.color.bg} ${cfg.color.text}`}>
                  <cfg.Icon className="h-3.5 w-3.5" aria-hidden="true" /> {cfg.label}
                </span>
              ) : null;
            })}
          </div>
          {post.hook && <p className="font-medium">{post.hook}</p>}
          <p className="text-sm whitespace-pre-wrap">{post.caption || <span className="text-muted-foreground">No caption</span>}</p>
          {post.hashtags && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{post.hashtags}</p>}
          {post.cta && <p className="text-sm"><span className="text-muted-foreground">CTA: </span>{post.cta}</p>}
          {draft.link && <p className="text-xs break-all">{draft.link}</p>}
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div><dt className="text-muted-foreground inline">Project: </dt><dd className="inline">{songTitle || '—'}</dd></div>
            <div><dt className="text-muted-foreground inline">Campaign: </dt><dd className="inline">{campaignName || '—'}</dd></div>
            <div><dt className="text-muted-foreground inline">Format: </dt><dd className="inline">{post.format || '—'}</dd></div>
            <div><dt className="text-muted-foreground inline">Approval: </dt><dd className="inline">{post.approval_status || 'Not Reviewed'}</dd></div>
          </dl>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} className="mt-0.5" />
            I approve this post as it is.
          </label>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={openFinal} disabled={!publishIds.length} className="gap-2">
          <Send className="h-4 w-4" /> Publish Now
        </Button>
        <Button type="button" variant="outline" onClick={() => setShowSchedule((v) => !v)} className="gap-2">
          <CalendarClock className="h-4 w-4" /> Schedule
        </Button>
        <Button type="button" variant="outline" onClick={() => setManualId(manualIds[0] || 'tiktok')} className="gap-2">
          <Share2 className="h-4 w-4" /> Share Manually
        </Button>
        <Button type="button" variant="secondary" onClick={saveDraftPost} disabled={!!busy} className="gap-2">
          {busy === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save as Draft
        </Button>
      </div>
      {!publishIds.length && (
        <p className="text-xs text-muted-foreground">Publishing needs Instagram or Facebook selected. TikTok and YouTube are shared manually.</p>
      )}

      {showSchedule && (
        <div className="rounded-xl border border-border/60 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className={FL} htmlFor="cp-date">Date</label>
              <Input id="cp-date" type="date" value={date} onChange={(e) => { setDate(e.target.value); patchPost({ scheduled_date: e.target.value }); }} />
            </div>
            <div className="space-y-1.5">
              <label className={FL} htmlFor="cp-time">Time</label>
              <Input id="cp-time" type="time" value={time} onChange={(e) => { setTime(e.target.value); patchPost({ scheduled_time: e.target.value, scheduled_timezone: tz }); }} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Goes live {date} at {displayTime(time)} ({shortTimezone(tz)}).</p>
          <Button type="button" onClick={schedule} disabled={busy === 'schedule'} className="gap-2">
            {busy === 'schedule' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />} Confirm schedule
          </Button>
          <p className="text-[11px] text-muted-foreground">
            You can always adjust it later in the <Link to="/marketing/calendar" className="underline">Content Calendar</Link>.
          </p>
        </div>
      )}

      <FinalReviewDialog
        post={{ ...post, publish_targets: publishIds.map(entityValue) }}
        clips={clips}
        platforms={publishIds.map(entityValue)}
        open={finalOpen}
        onOpenChange={setFinalOpen}
        onEdit={onEdit}
        campaignName={campaignName}
        releaseTitle={songTitle}
        timezone={tz}
      />

      <ManualShareDialog
        post={post}
        clips={clips}
        brandProfile={brandProfile}
        platformId={manualId || 'tiktok'}
        open={!!manualId}
        onOpenChange={(v) => !v && setManualId('')}
        shareUrl={draft.link}
        onMarkPosted={() => { setMarkOpen(true); }}
      />

      <MarkPostedManuallyDialog
        post={post}
        defaultPlatformId={manualId || 'tiktok'}
        open={markOpen}
        onOpenChange={setMarkOpen}
      />
    </div>
  );
}