import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { resolveLinkForPost } from '../../shared/publishPost.ts';

// Entity automation: when a MarketingPost is created (Strategist, weekly
// auto-generation, Quick Create, or by hand), give it a ready first comment
// built from its own release link. Never overwrites text the owner already
// wrote, and stays silent when the post has no resolvable link.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const postId = body?.event?.entity_id;
    if (!postId) return Response.json({ skipped: 'no entity id' });

    const post = await base44.asServiceRole.entities.MarketingPost.get(postId);
    if (!post) return Response.json({ skipped: 'post not found' });

    if (String(post.instagram_first_comment || '').trim() || String(post.facebook_first_comment || '').trim()) {
      return Response.json({ skipped: 'already has a first comment' });
    }

    const link = await resolveLinkForPost(base44, post);
    if (!link) return Response.json({ skipped: 'no link for this post' });

    const text = `▶️ Listen here: ${link}`;
    await base44.asServiceRole.entities.MarketingPost.update(postId, {
      instagram_first_comment: text,
      facebook_first_comment: text,
    });
    return Response.json({ filled: true, postId, text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}