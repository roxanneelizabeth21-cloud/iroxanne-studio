import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireAdmin, regeneratePostContent } from '../../shared/marketingAdmin.ts';

// regeneratePost — admin-only.
// Regenerates a single post's caption, hashtags, hook, cta, image_prompt, and (for
// video formats) template slot values + video_brief. Preserves the chosen template
// unless the admin's instruction says otherwise. The prompt logic lives in the
// shared `regeneratePostContent` helper so the batch regeneration endpoint reuses it.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const { post, instruction } = body || {};
    if (!post || typeof post !== 'object') {
      return Response.json({ error: 'post is required' }, { status: 400 });
    }

    const generated = await regeneratePostContent(base44, post, { instruction });
    if (!generated) {
      return Response.json({ error: 'AI regeneration failed. Please try again.' }, { status: 502 });
    }

    return Response.json({ post: generated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}