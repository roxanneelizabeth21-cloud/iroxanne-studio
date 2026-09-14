import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2, MessageSquareWarning, Send, Share2, CalendarClock, Copy, PauseCircle, XCircle, Loader2, ExternalLink,
} from 'lucide-react';
import {
  canApprove, canSchedule, canPublish, canShare, isLocked, publishTargets, platformResult, platformError,
  alreadyPublishedTo, PUBLISHABLE_PLATFORMS,
} from '@/lib/postValidation';
import {
  PUBLISHING_PLATFORMS, MANUAL_PLATFORMS, getPlatform, profileUrl,
} from '@/lib/socialPlatforms';

// Approval, scheduling, share and publish-review actions for one post.
// Nothing here calls the publishing function directly — publishing always goes
// through the Final Review screen.
export default function PostWorkflowActions({ post: postProp, clips = [], brandProfile, onEdit, onShare, onMove, onPublishReview, onManual, onMarkPosted }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState('');
  const [notes, setNotes] = useState('');
  const [askNotes, setAskNotes] = useState(false);
  const [askSchedule, setAskSchedule] = useState(false);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  // Local overlay of fields this component just saved, so a gate (e.g. Schedule
  // requiring approval) always reads the freshly stored state, not the stale
  // record the parent list still holds.
  const [patched, setPatched] = useState({});
  const post = { ...postProp, ...(patched.id === postProp.id ? patched.data : {}) };

  const locked = isLocked(post);
  const targets = publishTargets(post);
  const retryPlatforms = PUBLISHABLE_PLATFORMS.filter(
    (p) => !alreadyPublishedTo(post, p) && ['Failed', 'Connection Required', 'Permission Required'].includes(platformResult(post, p)),
  );

  const patch = async (data, title, key = 'save') => {
    setBusy(key);
    try {
      await base44.entities.MarketingPost.update(post.id, data);
      setPatched((prev) => ({ id: post.id, data: { ...(prev.id === post.id ? prev.data : {}), ...data } }));
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title });
    } catch (e) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const guard = (gate) => {
    if (!gate.ok) { toast({ title: gate.reason, variant: 'destructive', duration: 6000 }); return false; }
    return true;
  };

  const approve = () => {
    if (!guard(canApprove(post, clips))) return;
    patch({ approval_status: 'Approved', approval_notes: '', status: post.status === 'Draft' || post.status === 'Pending Review' ? 'Approved' : post.status }, 'Post approved', 'approve');
  };

  const requestChanges = () => {
    patch({ approval_status: 'Changes Requested', approval_notes: notes, status: 'Pending Review' }, 'Changes requested');
    setAskNotes(false);
    setNotes('');
  };

  const openSchedule = () => {
    if (!guard(canSchedule(post, clips))) return;
    setSchedDate(post.scheduled_date || '');
    setSchedTime(post.scheduled_time || '');
    setAskSchedule((v) => !v);
  };

  const confirmSchedule = () => {
    if (!guard(canSchedule(post, clips))) return;
    if (!schedDate) { toast({ title: 'Pick a date first.', variant: 'destructive' }); return; }
    patch({ scheduled_date: schedDate, scheduled_time: schedTime || '', status: 'Scheduled', publish_mode: 'auto' }, 'Approved post scheduled for automatic publishing', 'schedule');
    setAskSchedule(false);
  };

  const toggleTarget = (platform) => {
    const next = targets.includes(platform) ? targets.filter((t) => t !== platform) : [...targets, platform];
    patch({ publish_targets: next }, next.length ? `Publishing to ${next.join(' + ')}` : 'No platform selected', 'targets');
  };

  const openReview = (platforms) => {
    if (!guard(canPublish({ ...post, publish_targets: platforms }, clips))) return;
    onPublishReview && onPublishReview(post, platforms);
  };

  const share = () => {
    if (!guard(canShare(post, clips))) return;
    onShare && onShare(post);
  };

  const duplicate = async () => {
    setBusy('duplicate');
    try {
      const copy = { ...post };
      ['id', 'created_date', 'updated_date', 'created_by_id', 'posted_at', 'external_post_id', 'calendar_event_id'].forEach((k) => delete copy[k]);
      const created = await base44.entities.MarketingPost.create({
        ...copy,
        status: 'Draft',
        approval_status: 'Not Reviewed',
        publishing_status: 'Not Started',
        instagram_publish_status: 'Not Selected',
        facebook_publish_status: 'Not Selected',
        instagram_post_url: '',
        facebook_post_url: '',
        instagram_publish_error: '',
        facebook_publish_error: '',
        publish_error: '',
        scheduled_date: '',
      });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: 'Duplicated as a draft', description: 'The copy is in the Unscheduled queue.' });
      onEdit && onEdit(created);
    } catch (e) {
      toast({ title: 'Duplicate failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Approval */}
      {!locked && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={post.approval_status === 'Approved' ? 'secondary' : 'default'} onClick={approve} disabled={!!busy} className="gap-1.5">
            {busy === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {post.approval_status === 'Approved' ? 'Approved' : 'Approve'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setAskNotes((v) => !v)} className="gap-1.5">
            <MessageSquareWarning className="h-3.5 w-3.5" /> Request Changes
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={openSchedule} disabled={!!busy} className="gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" /> Schedule automatic publishing
          </Button>
        </div>
      )}
      {askSchedule && (
        <div className="flex flex-wrap items-end gap-2 p-2 rounded-lg bg-muted/40">
          <div className="space-y-1">
            <label htmlFor="sched-date" className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block">Date</label>
            <Input id="sched-date" type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} className="w-[150px]" />
          </div>
          <div className="space-y-1">
            <label htmlFor="sched-time" className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block">Time</label>
            <Input id="sched-time" type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} className="w-[130px]" />
          </div>
          <Button type="button" size="sm" onClick={confirmSchedule} disabled={!!busy} className="gap-1.5">
            {busy === 'schedule' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Confirm schedule
          </Button>
        </div>
      )}
      {askNotes && (
        <div className="flex gap-2">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What needs to change?" aria-label="Change request notes" />
          <Button type="button" size="sm" onClick={requestChanges}>Send</Button>
        </div>
      )}
      {post.approval_notes && <p className="text-xs text-amber-700 dark:text-amber-400">Requested changes: {post.approval_notes}</p>}

      {/* Publish targets */}
      {!locked && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Publish to</p>
          <div className="flex gap-2">
            {PUBLISHABLE_PLATFORMS.map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={targets.includes(p)} onChange={() => toggleTarget(p)} disabled={busy === 'targets'} />
                {p}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Publishing — always via Final Review */}
      {!locked && targets.length > 0 && (
        <div className="grid gap-2">
          <Button type="button" size="lg" onClick={() => openReview(targets)} disabled={!!busy} className="gap-2 w-full">
            {busy === 'review' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publish Now to {targets.join(' + ')}
          </Button>
          <p className="text-[11px] text-muted-foreground">Opens a final review — nothing is sent until you confirm there. This publishes immediately, ignoring any scheduled date.</p>
        </div>
      )}

{/* Retry — shown for any platform whose last attempt failed, whether or not
          the post is locked, and never for a platform that already published. */}
      {retryPlatforms.length > 0 && (
        <div className="grid gap-2">
          {retryPlatforms.map((p) => (
            <Button key={p} type="button" variant="outline" onClick={() => openReview([p])} className="gap-2">
              {(() => { const cfg = getPlatform(p); return cfg ? <cfg.Icon className="h-4 w-4" aria-hidden="true" /> : null; })()} Retry {p}
            </Button>
          ))}
          {retryPlatforms.map((p) => {
            const err = platformError(post, p);
            return err ? <p key={`${p}-err`} className="text-[11px] text-destructive">{p}: {err}</p> : null;
          })}
        </div>
      )}

      {/* Manual platforms — no publishing integration exists for these */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Manual platforms</p>
        <div className="grid gap-2">
          {MANUAL_PLATFORMS.map((p) => {
            const url = profileUrl(brandProfile, p.id);
            return (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                onClick={() => onManual && onManual(p.id)}
                disabled={!url}
                title={p.tooltip}
                className="gap-2 justify-start"
              >
                <p.Icon className="h-4 w-4" aria-hidden="true" /> {p.actionLabel}
                {url ? <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" /> : <span className="text-xs text-muted-foreground">— profile link missing</span>}
              </Button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          TikTok and YouTube aren't connected for publishing. These prepare the media and open your own profile — they never publish or mark the post as posted.
        </p>
        <Button type="button" size="sm" variant="ghost" onClick={() => onMarkPosted && onMarkPosted()} className="gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Posted Manually
        </Button>
      </div>

      {/* Utilities */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" size="sm" variant="secondary" onClick={share} title="Share using another app" className="gap-1.5"><Share2 className="h-3.5 w-3.5" /> Share</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onMove && onMove(post)} disabled={locked} className="gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" /> Move post
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={duplicate} disabled={!!busy} className="gap-1.5">
          {busy === 'duplicate' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />} Duplicate
        </Button>
        {!locked && (
          <>
            <Button type="button" size="sm" variant="ghost" onClick={() => patch({ status: post.status === 'Paused' ? 'Draft' : 'Paused' }, post.status === 'Paused' ? 'Post resumed' : 'Post paused')} className="gap-1.5">
              <PauseCircle className="h-3.5 w-3.5" /> {post.status === 'Paused' ? 'Resume' : 'Pause'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => patch({ scheduled_date: '', status: 'Draft' }, 'Schedule cancelled — back in the Unscheduled queue')} className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" /> Cancel Schedule
            </Button>
          </>
        )}
      </div>
    </div>
  );
}