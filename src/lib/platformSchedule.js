// Per-platform schedule + first-comment helpers.
// Instagram and Facebook can each carry their own date/time; a blank platform
// value falls back to the post's own scheduled_date / scheduled_time.

export const PLATFORM_FIELDS = {
  Instagram: { date: 'instagram_scheduled_date', time: 'instagram_scheduled_time', comment: 'instagram_first_comment' },
  Facebook: { date: 'facebook_scheduled_date', time: 'facebook_scheduled_time', comment: 'facebook_first_comment' },
};

export function effectiveSchedule(post, platform) {
  const f = PLATFORM_FIELDS[platform];
  if (!f || !post) return { date: post?.scheduled_date || '', time: post?.scheduled_time || '', overridden: false };
  const date = post[f.date] || post.scheduled_date || '';
  const time = post[f.time] || post.scheduled_time || '';
  return { date, time, overridden: !!(post[f.date] || post[f.time]) };
}

export function firstComment(post, platform) {
  const f = PLATFORM_FIELDS[platform];
  return f ? String(post?.[f.comment] || '').trim() : '';
}

// True when a Facebook post published with first-comment text still waiting to
// be pasted by hand (Meta does not grant this app permission to write comments).
export function needsManualFacebookComment(post) {
  return post?.facebook_comment_status === 'Manual Required';
}

export function instagramCommentFailed(post) {
  return post?.instagram_comment_status === 'Failed';
}

// Do the two platforms go out at different moments?
export function isStaggered(post) {
  const ig = effectiveSchedule(post, 'Instagram');
  const fb = effectiveSchedule(post, 'Facebook');
  return ig.date !== fb.date || ig.time !== fb.time;
}