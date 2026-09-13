// Shared publishing logic for MarketingPost → Facebook Pages / Instagram Business.
// Used by publishPostToSocial (manual button) and autoPublishScheduledPosts (background job).

import { resolveFacebookPage } from './facebookPages.ts';
import { CANONICAL_URL } from './studioUrl.ts';

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)$/i;

export function isVideo(url) {
  return VIDEO_EXT.test(String(url || ''));
}

// Every public link in a published post must use the studio's own domain.
// Anything still carrying the platform hostname (older drafts, pasted links,
// AI-written captions) is rewritten right before the post goes out.
export function useOwnDomain(text) {
  return String(text || '').replace(/https?:\/\/(?:www\.)?iroxanne\.base44\.app/gi, PUBLIC_SITE_URL);
}

export function buildMessage(post, link, platform = '') {
  const version = post.create_post_state?.platformCaptions?.[platform.toLowerCase()];
  const parts = [String(version ?? post.caption ?? '').trim(), String(post.hashtags || '').trim(), link ? String(link).trim() : ''].filter(Boolean);
  return useOwnDomain(parts.join('\n\n'));
}

export async function resolveMediaUrl(post, base44) {
  if (post.media_file_url) return post.media_file_url;
  if (post.media_clip_id) {
    const clip = await base44.asServiceRole.entities.ClipAsset.get(post.media_clip_id);
    return clip?.file || '';
  }
  return '';
}

export const PUBLIC_SITE_URL = CANONICAL_URL;
const SITE_URL = PUBLIC_SITE_URL;
const CONSULT_URL = `${SITE_URL}/book-call`;

// The public page for a portfolio item: its live project URL if set, otherwise
// the studio's /portfolio/<slug> page. Mirrors src/lib/postLink.js on the backend.
function portfolioPageUrl(item) {
  if (!item) return '';
  if (item.project_url) return item.project_url;
  if (item.slug) return `${SITE_URL}/work/${item.slug}`;
  return '';
}

// Resolve the link appended at the bottom of a post. The owner's choice wins:
// the portfolio project page, the consult-booking page, or none. Direct links —
// no Open Graph proxy step.
export async function resolveLinkForPost(base44, post) {
  if (post.create_post_state && Object.prototype.hasOwnProperty.call(post.create_post_state, 'link')) return post.create_post_state.link || '';
  if (post.link_target === 'None') return '';
  const target = post.link_target || (post.portfolio_item_id ? 'Portfolio page' : 'Consult booking');

  if (target === 'Get a Quote') return `${SITE_URL}/quote`;
  if (target === 'Consult booking') return CONSULT_URL;
  if (target === 'Portfolio page') {
    if (!post.portfolio_item_id) return '';
    const item = await base44.asServiceRole.entities.PortfolioItem.get(post.portfolio_item_id).catch(() => null);
    return portfolioPageUrl(item);
  }
  return '';
}

// Facebook Pages: resolve the first managed Page + a Page access token.
async function publishFacebook(accessToken, post, mediaUrl, link, base44) {
  const message = buildMessage(post, link, 'facebook');
  const page = await resolveFacebookPage(accessToken, base44);
  const pageToken = page.pageToken;

  if (mediaUrl) {
    if (isVideo(mediaUrl)) {
      // /{page-id}/videos supports a remote file_url upload (async processing).
      const body = new URLSearchParams({ file_url: mediaUrl, description: message, access_token: pageToken });
      const res = await fetch(`https://graph.facebook.com/v25.0/${page.id}/videos`, { method: 'POST', body });
      const data = await res.json();
      if (!data.id) throw new Error(`Facebook video upload failed: ${JSON.stringify(data.error || data)}`);
      return { external_id: String(data.id), permalink: `https://www.facebook.com/${page.id}/videos/${data.id}` };
    }
    // Image post: /{page-id}/photos with a public image_url + message, published=true.
    const body = new URLSearchParams({ url: mediaUrl, message, published: 'true', access_token: pageToken });
    const res = await fetch(`https://graph.facebook.com/v25.0/${page.id}/photos`, { method: 'POST', body });
    const data = await res.json();
    if (!data.id && !data.post_id) throw new Error(`Facebook photo upload failed: ${JSON.stringify(data.error || data)}`);
    return { external_id: String(data.post_id || data.id), permalink: data.post_id ? `https://www.facebook.com/${data.post_id}` : null };
  }
  // Text-only feed post.
  const body = new URLSearchParams({ message, access_token: pageToken });
  const res = await fetch(`https://graph.facebook.com/v25.0/${page.id}/feed`, { method: 'POST', body });
  const data = await res.json();
  if (!data.id) throw new Error(`Facebook post failed: ${JSON.stringify(data.error || data)}`);
  return { external_id: String(data.id), permalink: `https://www.facebook.com/${data.id.split('_')[0]}/posts/${data.id.split('_')[1] || data.id}` };
}

// Post the owner's "first comment" onto a freshly published Instagram media.
// Requires instagram_business_manage_comments. NEVER throws — a comment failure
// must not fail or retry the post itself; the caller records it so the calendar
// can flag it for a manual paste.
async function postInstagramComment(accessToken, mediaId, message) {
  const text = String(message || '').trim();
  if (!text) return { status: 'Not Needed' };
  try {
    const body = new URLSearchParams({ message: text, access_token: accessToken });
    const res = await fetch(`https://graph.instagram.com/v25.0/${mediaId}/comments`, { method: 'POST', body });
    const data = await res.json();
    if (!data.id) return { status: 'Failed', error: JSON.stringify(data.error || data).slice(0, 400) };
    return { status: 'Posted', id: String(data.id) };
  } catch (e) {
    return { status: 'Failed', error: String(e.message).slice(0, 400) };
  }
}

// Instagram Business: two-step publish (create container → publish). Requires
// instagram_business_content_publish scope and a public media URL.
async function publishInstagram(accessToken, post, mediaUrl, link) {
  if (!mediaUrl) throw new Error('Instagram publishing requires an attached media file (image or video).');
  const caption = buildMessage(post, link, 'instagram');

  const meRes = await fetch(`https://graph.instagram.com/me?fields=id&access_token=${encodeURIComponent(accessToken)}`);
  const me = await meRes.json();
  if (!me.id) throw new Error('Instagram account not resolved (token may be missing the publishing scope).');

  const containerBody = new URLSearchParams({ caption, access_token: accessToken });
  if (isVideo(mediaUrl)) {
    // Instagram only accepts video containers as Reels — without media_type=REELS
    // the API rejects the call asking for image_url.
    containerBody.append('video_url', mediaUrl);
    containerBody.append('media_type', 'REELS');
  } else {
    containerBody.append('image_url', mediaUrl);
  }
  const createRes = await fetch(`https://graph.instagram.com/v25.0/${me.id}/media`, { method: 'POST', body: containerBody });
  const created = await createRes.json();
  if (!created.id) throw new Error(`Instagram media creation failed: ${JSON.stringify(created.error || created)}`);

  // Every container (image or video) must finish processing before publish, or
  // Instagram rejects the publish with "Media ID is not available" (code 9007).
  const attempts = isVideo(mediaUrl) ? 30 : 12;
  let ready = false;
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const stRes = await fetch(`https://graph.instagram.com/v25.0/${created.id}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`);
    const st = await stRes.json();
    if (st.status_code === 'FINISHED') { ready = true; break; }
    if (st.status_code === 'ERROR') throw new Error(`Instagram media processing failed: ${JSON.stringify(st)}`);
  }
  if (!ready) throw new Error('Instagram is still processing this media. Wait a moment and publish again.');

  // Even after FINISHED, the publish endpoint can briefly return 9007 — retry.
  let pub;
  for (let i = 0; i < 4; i++) {
    const pubBody = new URLSearchParams({ creation_id: created.id, access_token: accessToken });
    const pubRes = await fetch(`https://graph.instagram.com/v25.0/${me.id}/media_publish`, { method: 'POST', body: pubBody });
    pub = await pubRes.json();
    if (pub.id) {
      // First comment goes out immediately after the post itself succeeds.
      const comment = await postInstagramComment(accessToken, pub.id, post.instagram_first_comment);
      return { external_id: String(pub.id), permalink: null, comment };
    }
    if (pub.error?.error_subcode !== 2207027 && pub.error?.code !== 9007) break;
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Instagram publish failed: ${JSON.stringify(pub?.error || pub)}`);
}

// Publish a post to ONE platform and return its result. Does not mutate the
// record — the caller records the per-platform outcome. Throws on failure.
export async function publishToPlatform(base44, post, platform) {
  if (!['Facebook', 'Instagram'].includes(platform)) {
    throw new Error(`Automatic publishing is not wired for ${platform}. Facebook and Instagram are supported.`);
  }

  const mediaUrl = await resolveMediaUrl(post, base44);
  if (!mediaUrl) {
    throw new Error('This post has no attached graphic or video, so it cannot be published.');
  }
  const link = await resolveLinkForPost(base44, post);

  const integrationType = platform === 'Facebook' ? 'facebook_pages' : 'instagram';
  const { accessToken } = await base44.asServiceRole.connectors.getConnection(integrationType);
  if (!accessToken) {
    const err = new Error(`${platform} is not connected. Connect it in the admin chat to enable publishing.`);
    err.connectionRequired = true;
    throw err;
  }

  return platform === 'Facebook'
    ? await publishFacebook(accessToken, post, mediaUrl, link, base44)
    : await publishInstagram(accessToken, post, mediaUrl, link);
}

// High-level: publish a MarketingPost record to EVERY platform selected in
// publish_targets (falling back to its primary platform) and record each result
// independently. Throws only when no platform published, so a partial success
// is reported as 'Partially Published' instead of looking like a total failure.
export async function publishMarketingPost(base44, post, only = null) {
  if (post.approval_status !== 'Approved') throw new Error('Post requires approval');
  if (!String(post.caption || '').trim()) throw new Error('Caption is missing');
  if (!await resolveMediaUrl(post, base44)) throw new Error('Graphic or video is missing');
  const selected = Array.isArray(only) && only.length
    ? only
    : (Array.isArray(post.publish_targets) && post.publish_targets.length ? post.publish_targets : [post.platform]);
  const targets = selected.filter((t) => ['Facebook', 'Instagram'].includes(t));

  if (!targets.length) {
    throw new Error(`Automatic publishing is not wired for ${post.platform}. Facebook and Instagram are supported.`);
  }

  const now = new Date().toISOString();
  const patch = { last_publish_attempt_at: now };
  const successes = [];
  const errors = [];

  for (const platform of targets) {
    const isIG = platform === 'Instagram';
    const statusField = isIG ? 'instagram_publish_status' : 'facebook_publish_status';
    const urlField = isIG ? 'instagram_post_url' : 'facebook_post_url';
    const errField = isIG ? 'instagram_publish_error' : 'facebook_publish_error';
    if (post[statusField] === 'Published') continue;
    try {
      const result = await publishToPlatform(base44, post, platform);
      patch[statusField] = 'Published';
      patch[urlField] = result.permalink || String(result.external_id);
      patch[errField] = '';
      if (isIG) {
        // Comment outcome is recorded, never allowed to affect the post result.
        patch.instagram_comment_status = result.comment?.status || 'Not Needed';
        patch.instagram_comment_error = result.comment?.error || '';
      } else if (String(post.facebook_first_comment || '').trim()) {
        // Meta does not grant this app pages_manage_engagement, so a Facebook
        // first comment can only be flagged for the owner to paste by hand.
        patch.facebook_comment_status = 'Manual Required';
      }
      await base44.asServiceRole.entities.MarketingPost.update(post.id, { [statusField]: 'Published', [urlField]: patch[urlField], [errField]: '' });
      successes.push({ platform, ...result });
    } catch (e) {
      patch[statusField] = e.connectionRequired ? 'Connection Required' : 'Failed';
      patch[errField] = String(e.message);
      errors.push(`${platform}: ${e.message}`);
    }
  }

  if (successes.length) {
    // With staggered per-platform schedules a run may cover only one platform,
    // so 'Posted' (which locks the card) requires EVERY selected platform to
    // have published — not just the ones attempted in this run.
    const allSelected = (Array.isArray(post.publish_targets) && post.publish_targets.length
      ? post.publish_targets
      : [post.platform]).filter((t) => ['Facebook', 'Instagram'].includes(t));
    const publishedNow = (t) =>
      patch[t === 'Instagram' ? 'instagram_publish_status' : 'facebook_publish_status'] === 'Published' ||
      post[t === 'Instagram' ? 'instagram_publish_status' : 'facebook_publish_status'] === 'Published';
    const allDone = errors.length === 0 && allSelected.every(publishedNow);
    patch.status = allDone ? 'Posted' : 'Partially Published';
    patch.publishing_status = allDone ? 'Published' : 'Partially Published';
    patch.posted_at = now;
    patch.external_post_id = successes[0].external_id;
    patch.publish_error = errors.join(' | ');
  } else {
    patch.status = 'Failed';
    patch.publishing_status = 'Failed';
    patch.publish_error = errors.join(' | ');
  }

  await base44.asServiceRole.entities.MarketingPost.update(post.id, patch);

  if (!successes.length) throw new Error(errors.join(' | '));
  return { ...successes[0], published: successes.map((s) => s.platform), errors };
}