import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  requireAdmin,
  STUDIO_CONTEXT,
  CONTENT_RULES,
  performanceRules,
  parsePostsArray,
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
      portfolio_item_id,
      launch_date,
      goal = 'Launch week push',
      start_date,
      end_date,
      default_image_style_preset,
    } = body || {};

    const pid = portfolio_item_id;
    const isServiceCampaign = pid === '__studio_service__' || !pid;
    if (!start_date || !end_date) return Response.json({ error: 'start_date and end_date are required' }, { status: 400 });

    let ctx = null;
    let itemTitle = 'iRoxanne Studio — Service Marketing';
    let itemDescription = '';
    if (!isServiceCampaign) {
      ctx = await resolvePortfolioContext(base44, pid);
      itemTitle = ctx?.title || body.project_title || body.portfolio_title || 'the new project';
      itemDescription = ctx?.description || body.project_description || '';
    }
    const portfolioSec = isServiceCampaign ? '' : portfolioSection(ctx?.item);
    const testimonials = isServiceCampaign ? [] : await loadApprovedTestimonials(base44, pid);
    const testimonialSec = testimonialSection(testimonials);

    const windowDays = Math.max(1, Math.round((new Date(end_date).getTime() - new Date(start_date).getTime()) / 86400000) + 1);
    const targetPosts = Math.min(40, Math.max(6, Math.round(windowDays / 7) * 4));

    const brandProfile = await loadBrandProfile(base44);
    const brandSection = brandProfileSection(brandProfile);
    const perfRules = performanceRules(brandProfile);
    const styleExamples = await loadStyleExamples(base44);
    const templates = await loadVideoTemplates(base44);
    const templateSection = videoTemplateSection(templates);

    const presetLine = default_image_style_preset
      ? `\nDEFAULT IMAGE STYLE PRESET for this campaign: "${default_image_style_preset}". Append its prompt_suffix style to every image_prompt (the admin can change it per post later).`
      : '';

    const systemPrompt = `You are a senior social media strategist for an independent app-development studio.
${STUDIO_CONTEXT}

${CONTENT_RULES}

${perfRules}
${brandSection ? `\n\n${brandSection}\n\nIMPORTANT: The current IROXANNE STUDIO EDITORIAL DIRECTION takes precedence over older Brand Profile examples.` : ''}${styleExamples ? `\n\n${styleExamples}` : ''}${templateSection ? `\n\n${templateSection}` : ''}${portfolioSec ? `\n\n${portfolioSec}` : ''}${testimonialSec ? `\n\n${testimonialSec}` : ''}${presetLine}

Campaign brief:
- ${isServiceCampaign ? 'This is a SERVICE MARKETING campaign — promote the app-building service, not a specific project. Mix Service Offer, Pain Point / Education, Behind the Build, and Social Proof posts. Link target should be Get a Quote.' : `Portfolio item: "${itemTitle}"`}
- Launch/target date: ${launch_date || 'TBD'}
- Campaign window: ${start_date} to ${end_date} (${windowDays} days)
- Campaign goal: ${goal}
${itemDescription ? `- What it does: ${itemDescription}` : ''}
${portfolioSec ? `- This project has a full portfolio context. Draw hooks and on-screen text from the real project details.` : ''}
${testimonialSec ? `- Approved testimonials are available — use them for testimonial/social-proof posts.` : ''}

Generate ${targetPosts} social posts spread across the campaign window (${start_date} to ${end_date}).
- Cover Facebook, Instagram, YouTube, and TikTok. Weight Reels, YouTube Shorts, and TikTok videos heaviest, plus feed posts, stories, and YouTube community posts.
- Distribute dates sensibly across the window: build buzz pre-launch, peak on launch day (${launch_date || 'the launch date'}), and sustain post-launch with portfolio showcases, educational tips, and consult CTAs.
- Follow the PERFORMANCE-BASED CONTENT RULES: roughly 40% showcase, 30% educational/tech-tip, 30% testimonial/offer. Assign each post a content_bucket accordingly.
- Every post MUST include scheduled_date (YYYY-MM-DD), platform, format, caption, hashtags, hook, cta, and image_prompt.
- For every video-format post (Reel, Short, Video): pick the best-fitting template by id, fill every slot in slot_values (exact on-screen text, what to show, loop notes), and set video_brief to a human-readable CapCut assembly checklist. The hook text must be bold on frame one; the brief must describe the first 2–3 seconds.
- Image prompts must show Story-led editorial imagery in plum, cream and restrained gold; accurate screenshots only when supplied.${default_image_style_preset ? ` Apply the "${default_image_style_preset}" preset look to image prompts and set image_style_preset accordingly.` : ''}

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