import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  requireAdmin,
  STUDIO_CONTEXT,
  CONTENT_RULES,
  performanceRules,
  normalizePost,
  loadBrandProfile,
  brandProfileSection,
  loadStyleExamples,
  loadVideoTemplates,
  videoTemplateSection,
  assembleVideoBrief,
  portfolioSection,
  resolvePortfolioContext,
  loadApprovedTestimonials,
  testimonialSection,
} from '../../shared/marketingAdmin.ts';

// quickCreate — admin-only.
// Generates a single one-off post for a chosen portfolio item + platform (+ optional note).
// Accepts portfolio_item_id (or legacy song_id). Returns a full post object
// (caption, hashtags, hook, cta, image_prompt, and for video formats
// template_id/slot_values/video_brief). The frontend can Save to Calendar or discard.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const { song_id, portfolio_item_id, platform, note } = body || {};
    const pid = portfolio_item_id || song_id;
    if (!pid) return Response.json({ error: 'portfolio_item_id (or song_id) is required' }, { status: 400 });
    if (!['Facebook', 'Instagram', 'YouTube', 'TikTok'].includes(platform)) {
        return Response.json({ error: 'platform is required (Facebook, Instagram, YouTube, or TikTok)' }, { status: 400 });
    }

    const ctx = await resolvePortfolioContext(base44, pid);
    const itemTitle = ctx?.title || 'this work';
    const itemDescription = ctx?.description || '';

    const brandProfile = await loadBrandProfile(base44);
    const brandSection = brandProfileSection(brandProfile);
    const perfRules = performanceRules(brandProfile);
    const styleExamples = await loadStyleExamples(base44, platform);
    const templates = await loadVideoTemplates(base44);
    const templateSection = videoTemplateSection(templates);
    const portfolioSec = portfolioSection(ctx?.item);
    const testimonials = await loadApprovedTestimonials(base44, pid);
    const testimonialSec = testimonialSection(testimonials);

    const noteLine = note ? `\nAdmin note for this post: "${note}". Honor it while keeping the post on-brand.` : '';

    const prompt = `You are a senior social media copywriter for an independent app-development studio.
${STUDIO_CONTEXT}

${CONTENT_RULES}

${perfRules}
${brandSection ? `\n\n${brandSection}\n\nIMPORTANT: Where the Brand Profile conflicts with the generic content rules above, follow the Brand Profile.` : ''}${styleExamples ? `\n\n${styleExamples}` : ''}${templateSection ? `\n\n${templateSection}` : ''}${portfolioSec ? `\n\n${portfolioSec}` : ''}${testimonialSec ? `\n\n${testimonialSec}` : ''}

Write a single social post for iRoxanne Studio.
- Platform: ${platform}
- Portfolio item: "${itemTitle}"
${itemDescription ? `- What it does: ${itemDescription}` : ''}
${portfolioSec ? `- Draw the hook and on-screen text from the real project details.` : ''}
${testimonialSec ? `- Approved testimonials are available — use them if this is a testimonial/social-proof post.` : ''}
- Pick the most platform-native format for ${platform}.
${noteLine}

Return a single post with: platform, format, content_bucket, caption, hashtags, hook, cta, image_prompt, image_style_preset, and (if the format is video: Reel/Short/Video) template_id, slot_values, video_brief.
- Image prompt: real screenshots/UI where possible, NO baked text/logos.
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
        portfolio_item_id: pid,
        original_ai_caption: generated.caption || '',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}