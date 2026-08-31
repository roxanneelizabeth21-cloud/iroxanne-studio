import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { publishToPlatform } from '../../shared/publishPost.ts';

// Publish a MarketingPost to Facebook Pages and/or Instagram Business.
// Manual entry point — invoked from the Final Review screen's "Confirm and Publish".
//
// Body: { post_id, platforms?: ['Instagram','Facebook'], repost?: boolean }
// platforms defaults to the post's publish_targets, then its primary platform.
// Each platform is published INDEPENDENTLY and its own result is stored, so a
// partial success is never reported as a full success. A platform that already
// published successfully is skipped unless repost: true — so retrying a failed
// platform can never duplicate the successful one.
//
// The finished, assembled media file must already exist on the post:
//   - post.media_file_url (direct uploaded file URL), OR
//   - post.media_clip_id → ClipAsset.file

const FIELDS = {
  Instagram: { status: 'instagram_publish_status', url: 'instagram_post_url', error: 'instagram_publish_error' },
  Facebook: { status: 'facebook_publish_status', url: 'facebook_post_url', error: 'facebook_publish_error' },
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let body;
    try { body = await req.json(); } catch { body = {}; }
    const postId = body?.post_id;
    if (!postId) return Response.json({ error: 'post_id is required' }, { status: 400 });
    const repost = body?.repost === true;

    const post = await base44.asServiceRole.entities.MarketingPost.get(postId);
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });

    const requested = Array.isArray(body?.platforms) && body.platforms.length
      ? body.platforms
      : (Array.isArray(post.publish_targets) && post.publish_targets.length ? post.publish_targets : [post.platform]);
    const platforms = requested.filter((p) => p === 'Instagram' || p === 'Facebook');
    if (!platforms.length) {
      return Response.json({ error: 'Select Instagram or Facebook — direct publishing supports those two platforms.' }, { status: 400 });
    }

    if (post.approval_status && post.approval_status !== 'Approved') {
      return Response.json({ error: 'This post is not approved yet.' }, { status: 400 });
    }
    if (post.publishing_status === 'Publishing') {
      return Response.json({ error: 'A publishing operation is already running for this post.' }, { status: 409 });
    }
    if (!String(post.caption || '').trim()) {
      return Response.json({ error: 'This post needs a caption before it can be published.' }, { status: 400 });
    }

    const startedAt = new Date().toISOString();
    const progress = { publishing_status: 'Publishing', status: 'Publishing', last_publish_attempt_at: startedAt };
    for (const p of platforms) {
      if (repost || post[FIELDS[p].status] !== 'Published') progress[FIELDS[p].status] = 'Publishing';
    }
    await base44.asServiceRole.entities.MarketingPost.update(postId, progress);

    const results = {};
    const updates = { last_publish_attempt_at: startedAt };

    for (const platform of platforms) {
      const f = FIELDS[platform];
      if (!repost && post[f.status] === 'Published') {
        results[platform] = { status: 'Published', skipped: true, url: post[f.url] || null };
        updates[f.status] = 'Published';
        continue;
      }
      try {
        const r = await publishToPlatform(base44, { ...post, id: postId, platform }, platform);
        results[platform] = { status: 'Published', external_id: r.external_id, url: r.permalink || null };
        updates[f.status] = 'Published';
        updates[f.url] = r.permalink || String(r.external_id);
        updates[f.error] = '';
        // First comment: Instagram posts it automatically (result recorded, never
        // able to fail the post); Facebook can only be flagged for a manual paste.
        if (platform === 'Instagram') {
          updates.instagram_comment_status = r.comment?.status || 'Not Needed';
          updates.instagram_comment_error = r.comment?.error || '';
        } else if (String(post.facebook_first_comment || '').trim()) {
          updates.facebook_comment_status = 'Manual Required';
        }
      } catch (err) {
        const msg = String(err?.message || err);
        const state = err?.connectionRequired ? 'Connection Required'
          : /permission|scope/i.test(msg) ? 'Permission Required'
          : 'Failed';
        results[platform] = { status: state, error: msg };
        updates[f.status] = state;
        updates[f.error] = msg;
      }
    }

    const published = platforms.filter((p) => results[p].status === 'Published');
    const failed = platforms.filter((p) => results[p].status !== 'Published');

    // A staggered post may be published one platform at a time, so 'Posted'
    // (which locks the card) requires every selected platform to be published.
    const allSelected = (Array.isArray(post.publish_targets) && post.publish_targets.length
      ? post.publish_targets
      : [post.platform]).filter((p) => p === 'Instagram' || p === 'Facebook');
    const stillPending = allSelected.filter((p) => (updates[FIELDS[p].status] || post[FIELDS[p].status]) !== 'Published');

    if (!failed.length && !stillPending.length) {
      updates.publishing_status = 'Published';
      updates.status = 'Posted';
      updates.posted_at = new Date().toISOString();
      updates.publish_error = '';
    } else if (published.length) {
      updates.publishing_status = 'Partially Published';
      updates.status = 'Partially Published';
      updates.posted_at = post.posted_at || new Date().toISOString();
      updates.publish_error = failed.length ? failed.map((p) => `${p}: ${results[p].error}`).join(' | ') : '';
    } else {
      updates.publishing_status = 'Failed';
      updates.status = 'Failed';
      updates.publish_error = failed.map((p) => `${p}: ${results[p].error}`).join(' | ');
    }

    const firstPublished = published[0];
    if (firstPublished && results[firstPublished].external_id) {
      updates.external_post_id = results[firstPublished].external_id;
    }

    await base44.asServiceRole.entities.MarketingPost.update(postId, updates);

    return Response.json({
      success: failed.length === 0,
      partial: published.length > 0 && failed.length > 0,
      published,
      failed,
      results,
      publishing_status: updates.publishing_status,
      status: updates.status,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}