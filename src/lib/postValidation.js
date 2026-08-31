// Media + workflow validation for the Roxsan Amplify visual content calendar.
// A post is only eligible for approval, scheduling, sharing or publishing when it
// has REAL media: media_file_url (working file) or media_clip_id → ClipAsset.file.
// An image_prompt, a caption, a planned visual direction or a placeholder never count.

import { getPostMedia } from '@/lib/postMedia';

export const MEDIA_MISSING_MESSAGE =
  'This post needs a graphic or video before it can be approved, scheduled, shared, or published.';

export const DRAFT_SHARE_WARNING =
  'This post is still a draft. Sharing it outside Roxsan Amplify will not mark it as published.';

// Statuses that lock a post in its historical calendar position.
export const LOCKED_STATUSES = ['Posted', 'Partially Published'];

// Statuses that never belong in the Unscheduled queue.
export const QUEUE_EXCLUDED_STATUSES = ['Posted', 'Partially Published', 'Cancelled', 'Skipped'];

export const PUBLISHABLE_PLATFORMS = ['Instagram', 'Facebook'];

export function isLocked(post) {
  return !!post && LOCKED_STATUSES.includes(post.status);
}

export function isApproved(post) {
  return post?.approval_status === 'Approved';
}

// The single source of truth for "does this post have real media".
export function resolveMedia(post, clips = [], galleryImages = []) {
  const m = getPostMedia(post, clips, galleryImages);
  return m.hasMedia ? m : null;
}

export function hasValidMedia(post, clips = []) {
  return !!resolveMedia(post, clips);
}

// A labelled media state for the card indicators. Never colour-only — each state
// carries text plus an icon name the card renders.
export function mediaState(post, clips = []) {
  const media = resolveMedia(post, clips);
  if (!media) {
    if (post?.crop_status === 'failed') return { key: 'failed', label: 'Media failed', tone: 'bad' };
    if (getPostMedia(post, clips).error) return { key: 'failed', label: 'Media failed', tone: 'bad' };
    return { key: 'missing', label: 'Media missing', tone: 'bad' };
  }
  if (post?.crop_status === 'failed') return { key: 'failed', label: 'Media failed', tone: 'bad', media };
  if (post?.needs_crop || post?.crop_status === 'needs_crop') {
    return { key: 'needs_crop', label: 'Needs final crop', tone: 'warn', media };
  }
  if (media.type === 'video') return { key: 'video', label: 'Video attached', tone: 'ok', media };
  if (media.type === 'image') return { key: 'image', label: 'Graphic attached', tone: 'ok', media };
  return { key: 'unsupported', label: 'Unsupported format', tone: 'bad', media };
}

// Platforms this post will publish to directly (Instagram / Facebook only).
export function publishTargets(post) {
  const targets = Array.isArray(post?.publish_targets) ? post.publish_targets.filter((p) => PUBLISHABLE_PLATFORMS.includes(p)) : [];
  if (targets.length) return targets;
  return PUBLISHABLE_PLATFORMS.includes(post?.platform) ? [post.platform] : [];
}

export function platformResult(post, platform) {
  const key = platform === 'Instagram' ? 'instagram_publish_status' : 'facebook_publish_status';
  return post?.[key] || 'Not Selected';
}

export function platformUrl(post, platform) {
  return platform === 'Instagram' ? post?.instagram_post_url : post?.facebook_post_url;
}

export function platformError(post, platform) {
  return platform === 'Instagram' ? post?.instagram_publish_error : post?.facebook_publish_error;
}

// Already successfully published to this platform — a retry must not duplicate it.
export function alreadyPublishedTo(post, platform) {
  return platformResult(post, platform) === 'Published';
}

// Gate checks. Each returns { ok, reason }.
export function canApprove(post, clips) {
  if (!hasValidMedia(post, clips)) return { ok: false, reason: MEDIA_MISSING_MESSAGE };
  return { ok: true };
}

export function canSchedule(post, clips) {
  if (!hasValidMedia(post, clips)) return { ok: false, reason: MEDIA_MISSING_MESSAGE };
  if (!isApproved(post)) return { ok: false, reason: 'Approve this post before scheduling it.' };
  return { ok: true };
}

export function canPublish(post, clips) {
  if (!hasValidMedia(post, clips)) return { ok: false, reason: MEDIA_MISSING_MESSAGE };
  if (!isApproved(post)) return { ok: false, reason: 'Approve this post before publishing it.' };
  if (!String(post?.caption || '').trim()) return { ok: false, reason: 'Add a caption before publishing.' };
  if (!publishTargets(post).length) return { ok: false, reason: 'Select Instagram or Facebook for this post before publishing.' };
  if (post?.publishing_status === 'Publishing') return { ok: false, reason: 'A publishing operation is already running for this post.' };
  return { ok: true };
}

export function canShare(post, clips) {
  if (!hasValidMedia(post, clips)) return { ok: false, reason: MEDIA_MISSING_MESSAGE };
  return { ok: true };
}

// Timezone the calendar schedules in — one explicit owner-selected zone.
export function schedulingTimezone(brandProfile) {
  return brandProfile?.notify_timezone || 'America/New_York';
}

export function shortTimezone(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value || tz;
  } catch {
    return tz;
  }
}

// Human 12-hour time from an "HH:MM" string, without any timezone conversion.
export function displayTime(time) {
  if (!time) return '';
  const raw = String(time).trim();
  // Already a 12-hour string (e.g. "9:00 AM") — pass it through unchanged so we
  // never end up appending a second AM/PM suffix.
  if (/[ap]\.?m\.?$/i.test(raw)) return raw.toUpperCase().replace(/\s+/g, ' ');
  const [h, m] = raw.split(':');
  const hour = Number(h);
  if (isNaN(hour)) return raw;
  const minutes = String(m || '00').replace(/\D/g, '').padEnd(2, '0').slice(0, 2);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minutes} ${suffix}`;
}

// Is a date+time in the future, in the owner's scheduling zone (approximate,
// compared against the browser clock — used for a warning, never a silent change).
export function isFuture(dateStr, timeStr) {
  if (!dateStr) return false;
  const dt = new Date(`${dateStr}T${timeStr || '09:00'}:00`);
  if (isNaN(dt.getTime())) return false;
  return dt.getTime() > Date.now();
}