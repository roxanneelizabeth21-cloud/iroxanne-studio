import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  requireAdmin,
  loadClipLibrary,
  clipLibraryDigest,
} from '../../shared/marketingAdmin.ts';

// suggestClips — admin-only.
// Sends the post's mood/content and the admin's clip library to the LLM and returns
// the best 3–5 matches from the library. If fewer than 3 good matches exist, also
// returns 2–3 ready-to-copy search phrases for finding new clips externally.
// For authentic/personal posts (content_bucket = Authentic/Personal), only suggests
// clips with source_type = My Footage.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const { post } = body || {};
    if (!post || typeof post !== 'object') {
      return Response.json({ error: 'post is required' }, { status: 400 });
    }

    const forceMyFootage = post.content_bucket === 'Authentic/Personal';
    const clips = await loadClipLibrary(base44);
    const digest = clipLibraryDigest(clips, forceMyFootage);

    if (digest === '') {
      return Response.json({
        matches: [],
        search_phrases: defaultSearchPhrases(post),
        force_my_footage: forceMyFootage,
        note: forceMyFootage
          ? 'Your clip library has no clips tagged "My Footage". Authentic/personal posts must use your own footage. Add some or use the search phrases below to find new clips.'
          : 'Your clip library is empty. Add clips, or use the search phrases below to find new ones.',
      });
    }

    const prompt = `You match video clips to a social media post for an independent app-development studio (iRoxanne Studio).

POST CONTEXT:
- Platform: ${post.platform || 'Instagram'}
- Format: ${post.format || 'Reel'}
- Content bucket: ${post.content_bucket || '—'}
- Hook: ${post.hook || ''}
- Caption: ${post.caption || ''}
- Hashtags: ${post.hashtags || ''}
- Image prompt (mood reference): ${post.image_prompt || ''}
${forceMyFootage ? '\nCONSTRAINT: This post is authentic/personal — ONLY suggest clips with source_type = My Footage.' : ''}

CLIP LIBRARY (pick from these by id):
${digest}

Return a JSON object with:
- "matches": up to 5 of the best-fitting clips from the library, ordered best first. Each item: { "id": "<clip id>", "reason": "<one short sentence why it fits the mood/content>" }. Only include clips that genuinely fit.
- "search_phrases": if fewer than 3 good matches exist, include 2–3 short, ready-to-copy search phrases for finding new clips externally (e.g. "app dashboard screen recording vertical", "hands typing on laptop close-up"). Otherwise return an empty array.

Return ONLY the JSON object. No commentary.`;

    const schema = {
      type: 'object',
      properties: {
        matches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
        search_phrases: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };

    let result: any = null;
    for (let attempt = 0; attempt < 2 && !result; attempt++) {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema,
      });
      if (res && typeof res === 'object') result = res;
    }

    if (!result) {
      return Response.json({ error: 'Clip suggestions failed. Please try again.' }, { status: 502 });
    }

    const matches = Array.isArray(result.matches) ? result.matches.filter((m) => m && m.id) : [];
    const phrases = Array.isArray(result.search_phrases) ? result.search_phrases : [];
    const finalPhrases = matches.length < 3 ? phrases : [];

    return Response.json({
      matches,
      search_phrases: finalPhrases,
      force_my_footage: forceMyFootage,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function defaultSearchPhrases(post: any): string[] {
  const words = [post.hook, post.caption, post.image_prompt]
    .filter(Boolean).join(' ').toLowerCase();
  if (words.includes('app') || words.includes('build') || words.includes('no-code') || words.includes('base44')) {
    return ['app dashboard screen recording vertical', 'hands typing on laptop close-up', 'phone app demo vertical'];
  }
  if (words.includes('tip') || words.includes('how') || words.includes('tutorial')) {
    return ['screen recording tutorial vertical', 'close-up keyboard typing', 'code editor screen vertical'];
  }
  return ['workspace desk overhead vertical', 'laptop screen close-up vertical', 'person working at desk warm light'];
}