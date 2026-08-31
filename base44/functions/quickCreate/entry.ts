import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  requireAdmin,
  ARTIST_CONTEXT,
  CONTENT_RULES,
  PERFORMANCE_RULES,
  normalizePost,
  loadBrandProfile,
  brandProfileSection,
  loadStyleExamples,
  loadVideoTemplates,
  videoTemplateSection,
  assembleVideoBrief,
  loadSongProfile,
  songProfileSection,
  resolveSongContext,
} from '../../shared/marketingAdmin.ts';

// quickCreate — admin-only.
// Generates a single one-off post for a chosen song + platform (+ optional note).
// Returns a full post object (caption, hashtags, hook, cta, image_prompt, and for video
// formats template_id/slot_values/video_brief). The frontend can Save to Calendar or discard.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const { song_id, platform, note } = body || {};
    if (!song_id) return Response.json({ error: 'song_id is required' }, { status: 400 });
    if (!['Facebook', 'Instagram', 'YouTube', 'TikTok'].includes(platform)) {
        return Response.json({ error: 'platform is required (Facebook, Instagram, YouTube, or TikTok)' }, { status: 400 });
    }

    const ctx = await resolveSongContext(base44, song_id);
    const songTitle = ctx?.title || 'this release';
    const songDescription = ctx?.description || '';

    const brandProfile = await loadBrandProfile(base44);
    const brandSection = brandProfileSection(brandProfile);
    const styleExamples = await loadStyleExamples(base44, platform);
    const templates = await loadVideoTemplates(base44);
    const templateSection = videoTemplateSection(templates);
    const songProfile = ctx?.songProfile || await loadSongProfile(base44, song_id, songTitle);
    const songSection = songProfileSection(songProfile);

    const noteLine = note ? `\nAdmin note for this post: "${note}". Honor it while keeping the post on-brand.` : '';

    const prompt = `You are a senior music social media copywriter for an independent artist.
${ARTIST_CONTEXT}

${CONTENT_RULES}

${PERFORMANCE_RULES}
${brandSection ? `\n\n${brandSection}\n\nIMPORTANT: Where the Brand Profile conflicts with the generic content rules above, follow the Brand Profile.` : ''}${styleExamples ? `\n\n${styleExamples}` : ''}${templateSection ? `\n\n${templateSection}` : ''}${songSection ? `\n\n${songSection}` : ''}

Write a single social post for Roxsan.
- Platform: ${platform}
- Song/Release: "${songTitle}"
${songDescription ? `- Release themes: ${songDescription}` : ''}
${songSection ? `- Draw the hook and on-screen text from the song's REAL lyric lines (quote them where fitting).` : ''}
- Pick the most platform-native format for ${platform}.
${noteLine}

Return a single post with: platform, format, content_bucket, caption, hashtags, hook, cta, image_prompt, image_style_preset, and (if the format is video: Reel/Short/Video) template_id, slot_values, video_brief.
- Image prompt: NO faces, NO text/logos.
- Follow the PERFORMANCE-BASED CONTENT RULES.

Return ONLY a JSON object with those fields. No commentary, no markdown fences.`;

    const schema = {
      type: 'object',
      properties: {
        platform: { type: 'string' },
        format: { type: 'string' },
        content_bucket: { type: 'string' },
        caption: { type: 'string' },
        hashtags: { type: 'string' },
        hook: { type: 'string' },
        cta: { type: 'string' },
        image_prompt: { type: 'string' },
        image_style_preset: { type: 'string' },
        video_brief: { type: 'string' },
        template_id: { type: 'string' },
        slot_values: { type: 'object' },
      },
    };

    let generated = null;
    for (let attempt = 0; attempt < 2 && !generated; attempt++) {
      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const candidate = res && typeof res === 'object' ? normalizePost({ ...res, platform }) : null;
      if (candidate && (candidate.caption || candidate.hook || candidate.image_prompt)) generated = candidate;
    }

    if (!generated) {
      return Response.json({ error: 'AI generation failed. Please try again.' }, { status: 502 });
    }

    if (generated.template_id && generated.slot_values && !generated.video_brief) {
      const tplById = new Map(templates.map((t) => [t.id, t]));
      const tpl = tplById.get(generated.template_id);
      if (tpl) generated.video_brief = assembleVideoBrief(tpl, generated.slot_values);
    }

    return Response.json({
      post: {
        ...generated,
        platform,
        song_id,
        original_ai_caption: generated.caption || '',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}