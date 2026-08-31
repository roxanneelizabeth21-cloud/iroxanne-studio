import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Shared Instagram connection (builder authorized their Business account).
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');
    if (!accessToken) {
      return Response.json({ posts: [], connected: false }, { status: 200 });
    }

    // 1. Resolve the Instagram Business account id + username.
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`
    );
    const me = await meRes.json();
    if (!me.id) {
      return Response.json({ posts: [], connected: false }, { status: 200 });
    }

    // 2. Fetch recent media (images + videos, newest first).
    const mediaRes = await fetch(
      `https://graph.instagram.com/${me.id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=8&access_token=${encodeURIComponent(accessToken)}`
    );
    const media = await mediaRes.json();

    const posts = Array.isArray(media.data) ? media.data : [];

    return Response.json({
      posts,
      username: me.username || null,
      profile_url: me.username ? `https://www.instagram.com/${me.username}/` : null,
      connected: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}