import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ImageOff, Clock, XCircle, Link2Off } from 'lucide-react';
import { hasValidMedia } from '@/lib/postValidation';
import { SOCIAL_PLATFORMS } from '@/lib/socialPlatforms';
import { dateKey, formatDate } from '@/lib/marketing';
import { displayTime } from '@/lib/postValidation';

const ROW = 'flex items-center justify-between gap-3 rounded-xl bg-card/60 border-[0.5px] border-border px-4 py-3';

function AttentionRow({ Icon, label, count, to, tone }) {
  if (!count) return null;
  return (
    <Link to={to} className={`${ROW} hover:border-primary/40 transition-colors`}>
      <span className="flex items-center gap-2.5 text-sm">
        <Icon className={`h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{count}</span>
    </Link>
  );
}

// Section 1 of the Hub: what needs attention today, as short counted rows.
// No captions, no cards inside cards — each row links straight to the work.
export default function HubTodayPanel({ posts, clips, brandProfile, nextPost }) {
  const today = dateKey(new Date());

  const needsApproval = posts.filter(
    (p) => (p.approval_status || 'Not Reviewed') !== 'Approved' && ['Pending Review', 'Ready', 'Scheduled'].includes(p.status),
  ).length;
  const missingMedia = posts.filter(
    (p) => !['Posted', 'Cancelled', 'Skipped'].includes(p.status) && !hasValidMedia(p, clips),
  ).length;
  const dueToday = posts.filter((p) => p.scheduled_date === today && !['Posted', 'Skipped', 'Cancelled'].includes(p.status)).length;
  const failures = posts.filter((p) => ['Failed', 'Partially Published'].includes(p.status)).length;
  const missingProfiles = SOCIAL_PLATFORMS.filter((p) => !(brandProfile?.[p.profileField] || '').trim()).length;

  const total = needsApproval + missingMedia + dueToday + failures + missingProfiles;

  const recommended = failures
    ? { label: 'Review the posts that failed to publish', to: '/marketing/calendar' }
    : missingMedia
      ? { label: 'Attach media to the posts that are missing it', to: '/marketing/calendar' }
      : needsApproval
        ? { label: 'Approve the posts waiting on you', to: '/marketing/calendar' }
        : dueToday
          ? { label: 'Publish or share the posts due today', to: '/marketing/calendar' }
          : { label: 'Create a post with Quick Create', to: '/marketing/quick' };

  if (total === 0) {
    return (
      <div className="rounded-2xl border-[0.5px] border-border bg-card/60 p-6 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-medium">You’re caught up.</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {nextPost?.scheduled_date
              ? `Your next scheduled post is ${formatDate(nextPost.scheduled_date)}${nextPost.scheduled_time ? ` at ${displayTime(nextPost.scheduled_time)}` : ''}.`
              : 'Nothing is scheduled yet.'}
          </p>
          <Link to={recommended.to} className="text-sm text-primary hover:underline mt-2 inline-block">
            {recommended.label}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AttentionRow Icon={AlertTriangle} label="Waiting for your approval" count={needsApproval} to="/marketing/calendar" tone="text-amber-500" />
      <AttentionRow Icon={ImageOff} label="Missing a graphic or video" count={missingMedia} to="/marketing/calendar" tone="text-amber-500" />
      <AttentionRow Icon={Clock} label="Scheduled for today" count={dueToday} to="/marketing/calendar" tone="text-primary" />
      <AttentionRow Icon={XCircle} label="Failed to publish" count={failures} to="/marketing/calendar" tone="text-destructive" />
      <AttentionRow Icon={Link2Off} label="Social profile links missing" count={missingProfiles} to="/marketing" tone="text-muted-foreground" />
      <p className="text-sm text-muted-foreground pt-1">
        Next: <Link to={recommended.to} className="text-primary hover:underline">{recommended.label}</Link>
      </p>
    </div>
  );
}