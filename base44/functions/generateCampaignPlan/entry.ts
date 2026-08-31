import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  requireAdmin,
  ARTIST_CONTEXT,
  CONTENT_RULES,
  PERFORMANCE_RULES,
  parsePostsArray,
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

// generateCampaignPlan — admin-only.
// Generates a full content calendar of MarketingPost drafts for a campaign,
// covering Facebook, Instagram, YouTube, and TikTok with a platform-native mix of formats.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const {
      song_id,
      release_date,
      goal = 'Release week push',
      start_date,
      end_date,
      default_image_style_preset,
    } = body || {};

    if (!song_id) return Response.json({ error: 'song_id is required' }, { status: 400 });
    if (!start_date || !end_date) return Response.json({ error: 'start_date and end_date are required' }, { status: 400 });

    const ctx = await resolveSongContext(base44, song_id);
    const songTitle = ctx?.title || body.song_title || 'the new release';
    const songDescription = ctx?.description || body.song_description || '';

    const windowDays = Math.max(1, Math.round((new Date(end_date).getTime() - new Date(start_date).getTime()) / 86400000) + 1);
    const targetPosts = Math.min(40, Math.max(6, Math.round(windowDays / 7) * 4));

    const brandProfile = await loadBrandProfile(base44);
    const brandSection = brandProfileSection(brandProfile);
    const styleExamples = await loadStyleExamples(base44);
    const templates = await loadVideoTemplates(base44);
    const templateSection = videoTemplateSection(templates);
    const songProfile = ctx?.songProfile || await loadSongProfile(base44, song_id, songTitle);
    const songSection = songProfileSection(songProfile);

    const presetLine = default_image_style_preset
      ? `\nDEFAULT IMAGE STYLE PRESET for this campaign: "${default_image_style_preset}". Append its prompt_suffix style to every image_prompt (the admin can change it per post later).`
      : '';

    const systemPrompt = `You are a senior music marketing strategist for an independent artist.
${ARTIST_CONTEXT}

${CONTENT_RULES}

${PERFORMANCE_RULES}
${brandSection ? `\n\n${brandSection}\n\nIMPORTANT: Where the Brand Profile conflicts with the generic content rules above, follow the Brand Profile.` : ''}${styleExamples ? `\n\n${styleExamples}` : ''}${templateSection ? `\n\n${templateSection}` : ''}${songSection ? `\n\n${songSection}` : ''}${presetLine}

Campaign brief:
- Song/Release: "${songTitle}"
- Release date: ${release_date || 'TBD'}
- Campaign window: ${start_date} to ${end_date} (${windowDays} days)
- Campaign goal: ${goal}
${songDescription ? `- Release description / themes: ${songDescription}` : ''}
${songSection ? `- This song has a full content profile (lyrics, story, key lines). Quote real lyric lines for hooks and on-screen text.` : ''}

Generate ${targetPosts} social posts spread across the campaign window (${start_date} to ${end_date}).
- Cover Facebook, Instagram, YouTube, and TikTok. Weight Reels, YouTube Shorts, and TikTok videos heaviest, plus feed posts, stories, and YouTube community posts.
- Distribute dates sensibly across the window: build buzz pre-release, peak on release day (${release_date || 'the release date'}), and sustain post-release with streaming-link CTAs and fan engagement.
- Follow the PERFORMANCE-BASED CONTENT RULES: roughly 60% loop clips, 25% authentic/personal (admin's OWN footage, never stock), 15% announcement/CTA. Assign each post a content_bucket accordingly.
- Every post MUST include scheduled_date (YYYY-MM-DD), platform, format, caption, hashtags, hook, cta, and image_prompt.
- For every video-format post (Reel, Short, Video): pick the best-fitting template by id, fill every slot in slot_values (exact on-screen text, song section with start/end timestamps like "chorus, approx 0:45–0:57", loop notes), and set video_brief to a human-readable CapCut assembly checklist. The hook text must be bold on frame one; the brief must name the song section and describe the first 2–3 seconds.
- Image prompts must show NO faces and NO text/logos.${default_image_style_preset ? ` Apply the "${default_image_style_preset}" preset look to image prompts and set image_style_preset accordingly.` : ''}

Return ONLY a JSON object with a "posts" array. No commentary, no markdown fences.`;

    const schema = {
      type: 'object',
      properties: {
        posts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string', enum: ['Facebook', 'Instagram', 'YouTube', 'TikTok'] },
              format: { type: 'string', enum: ['Feed Post', 'Reel', 'Story', 'Short', 'Video', 'Community Post'] },
              content_bucket: { type: 'string', enum: ['Loop Clip', 'Authentic/Personal', 'Announcement/CTA'] },
              scheduled_date: { type: 'string' },
              scheduled_time: { type: 'string' },
              caption: { type: 'string' },
              hashtags: { type: 'string' },
              hook: { type: 'string' },
              cta: { type: 'string' },
              image_prompt: { type: 'string' },
              image_style_preset: { type: 'string' },
              video_brief: { type: 'string' },
              template_id: { type: 'string' },
              slot_values: { type: 'object' },
              clip_asset_id: { type: 'string' },
            },
          },
        },
      },
      required: ['posts'],
    };

    let posts: any[] = [];
    for (let attempt = 0; attempt < 2 && posts.length === 0; attempt++) {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: systemPrompt,
        response_json_schema: schema,
      });
      posts = parsePostsArray(res);
    }

    if (posts.length === 0) {
      return Response.json({ error: 'AI generation failed to produce usable posts. Please try again.' }, { status: 502 });
    }

    // Derive the human-readable video_brief from template + slot values when the AI returned slots
    // but left video_brief empty, so drafts are immediately usable.
    const tplById = new Map(templates.map((t) => [t.id, t]));
    for (const p of posts) {
      if (p.template_id && p.slot_values && !p.video_brief) {
        const tpl = tplById.get(p.template_id);
        if (tpl) p.video_brief = assembleVideoBrief(tpl, p.slot_values);
      }
    }

    return Response.json({ posts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}