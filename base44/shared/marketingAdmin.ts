// Shared helpers for the Marketing Content Suite backend functions.
// Both AI functions enforce the same admin check and share the same content rules.

export async function requireAdmin(base44): Promise<{ ok: true; user: any } | { ok: false; response: Response }> {
  const user = await base44.auth.me();
  if (!user) {
    return { ok: false, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (user.role !== 'admin') {
    return { ok: false, response: Response.json({ error: 'Forbidden — admin only' }, { status: 403 }) };
  }
  return { ok: true, user };
}

// Gate for scheduled/automated functions that have no signed-in user but must
// reject anonymous external callers. The platform's scheduled invocations and
// signed-in admin calls carry a valid auth context; a stranger hitting the
// public URL does not. Sends back a 401 response when the caller is not ok.
export async function requireAuthenticated(base44): Promise<{ ok: true } | { ok: false; response: Response }> {
  try {
    const authed = await base44.auth.isAuthenticated();
    if (authed) return { ok: true };
  } catch (_e) {}
  return { ok: false, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
}

// The studio context shared by campaign generation and single-post regeneration.
export const STUDIO_CONTEXT = "IROXANNE STUDIO EDITORIAL DIRECTION \u2014 owner's current brief\nAudience: real people with an idea, people starting out, people who do not yet realize a custom app could help, and friends who may refer someone. Assume no technical knowledge.\nSell thoughtful personal service and the possibility of making something useful. Never market Base44, no-code, software stacks, partner status or affiliate offers unless Roxanne explicitly requests a technical post. Tools are background information.\nVoice: Roxanne speaking personally, warm, observant, inviting, honest and quietly assured. Nearly 20 years building apps informs her care; do not invent personal memories, conversations or client stories. High-end means considered design and individual attention, not boasting or price comparisons.\nStart with a recognizable moment or specific possibility: orders buried in messages, a volunteer coordinator matching people to shifts, a family planning a trip, an idea scribbled on paper. Explain in ordinary language what someone could do differently with an app. Hypothetical scenes must say imagine/what if; never disguise them as clients.\nInclude people without a business or feature list. Invite them to bring what they know and work through the rest together.\nFacebook and Instagram by default: two weekly stories, each adapted to both platforms with tailored captions and suitable graphics. Keep platform-specific publishing results distinct. Across four weeks vary: two personal/idea stories, two everyday problem-to-possibility posts, two real portfolio examples in plain language, one useful conversation question, one gentle referral invitation. Do not repeat hooks, opening formulas, scenes or layouts from recent posts.\nOne natural invitation per post: a thoughtful question, a conversation, or sharing with one person who might find it useful. Never demand like/comment/tag/share together, use keyword-comment bait, or force a quote link into every post. When appropriate use https://iroxannestudio.com/quote .\nNo 'unlock your potential', 'game changer', 'revolutionize', 'seamless solutions', artificial urgency, inflated promises, agency putdowns, unverified savings or fabricated results. Zero to two relevant hashtags; no developer hashtags by default.\nVISUAL STANDARD: each draft needs a distinct finished graphic, not only an image prompt. Use generateMarketingImage after saving a draft and attach the returned asset; report failure honestly. Never claim an image exists from a prompt alone.\nArt direction: choose a visual treatment that serves the message — photography, illustration, collage, typography-led composition, or other approaches. Vary subjects, scale, lighting, palette, and composition while respecting approved assets. Brand colors are optional accents, not compulsory backgrounds. Never fabricate client faces, endorsements, logos or actual app UI; conceptual scenes must not be presented as real client work.\nRead real portfolio details for evidence and only use testimonials with BOTH consent_to_publish=true AND approved_for_use=true. Never repurpose unapproved testimonials anonymously.\nBefore delivering: would a nontechnical friend understand it, recognize a need or imagine a possibility? Does it sound like Roxanne? Does the visual add meaning? Is it different from the last post? Rewrite until these are true. Do not claim engagement outcomes without actual metrics.\nKeep everything Draft/Pending Review. Do not approve, schedule, publish or overwrite existing posts without the owner's instruction.";

export const CONTENT_RULES = STUDIO_CONTEXT;
export const PERFORMANCE_RULES = STUDIO_CONTEXT;

// Owner-configurable generation settings, read off the BrandProfile record.
export function generationSettings(bp: any): { campaignPerWeek: number; evergreenPerWeek: number; loopPct: number; authenticPct: number; ctaPct: number } {
  const num = (v: any, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
  };
  return {
    campaignPerWeek: num(bp?.posts_per_campaign_week, 2),
    evergreenPerWeek: num(bp?.posts_per_evergreen_week, 2),
    loopPct: num(bp?.mix_loop_pct, 40),
    authenticPct: num(bp?.mix_authentic_pct, 30),
    ctaPct: num(bp?.mix_cta_pct, 30),
  };
}

// PERFORMANCE_RULES with the owner's configured content mix substituted in.
export function performanceRules(bp: any): string {
  const s = generationSettings(bp);
  return PERFORMANCE_RULES
    .replace('- 40% portfolio/showcase posts:', `- ${s.loopPct}% portfolio/showcase posts:`)
    .replace('- 30% educational/tech-tip posts:', `- ${s.authenticPct}% educational/tech-tip posts:`)
    .replace('- 30% testimonial & direct-offer posts:', `- ${s.ctaPct}% testimonial & direct-offer posts:`);
}

export const POST_SCHEMA_FIELDS = [
  'platform', 'format', 'content_bucket', 'scheduled_date', 'scheduled_time', 'caption',
  'hashtags', 'hook', 'cta', 'image_prompt', 'image_style_preset', 'video_brief',
  'template_id', 'slot_values', 'clip_asset_id'
];

export const VALID_CONTENT_BUCKETS = ['Loop Clip', 'Authentic/Personal', 'Announcement/CTA'];
export const VIDEO_FORMATS = ['Reel', 'Short', 'Video'];

// Coerce a single LLM-generated post object into a clean, schema-safe record.
export function normalizePost(raw: any): any {
  const p = raw || {};
  const platform = ['Facebook', 'Instagram', 'YouTube', 'TikTok'].includes(p.platform) ? p.platform : 'Facebook';
  const validFormats = ['Feed Post', 'Reel', 'Story', 'Short', 'Video', 'Community Post'];
  const format = validFormats.includes(p.format) ? p.format : 'Feed Post';
  const isVideo = VIDEO_FORMATS.includes(format);
  const bucket = VALID_CONTENT_BUCKETS.includes(p.content_bucket) ? p.content_bucket : '';
  const slots = (p.slot_values && typeof p.slot_values === 'object' && !Array.isArray(p.slot_values)) ? p.slot_values : null;
  return {
    platform,
    format,
    content_bucket: bucket,
    scheduled_date: String(p.scheduled_date || ''),
    scheduled_time: p.scheduled_time ? String(p.scheduled_time) : '',
    caption: String(p.caption || '').trim(),
    hashtags: String(p.hashtags || '').trim(),
    hook: String(p.hook || '').trim(),
    cta: String(p.cta || '').trim(),
    image_prompt: String(p.image_prompt || '').trim(),
    image_style_preset: String(p.image_style_preset || '').trim(),
    video_brief: isVideo ? String(p.video_brief || '').trim() : '',
    template_id: isVideo && p.template_id ? String(p.template_id) : '',
    slot_values: isVideo && slots ? slots : null,
    clip_asset_id: String(p.clip_asset_id || ''),
  };
}

// Build a human-readable CapCut assembly checklist from a template + its slot values.
export function assembleVideoBrief(template: any, slotValues: any): string {
  if (!template) return '';
  const sv = slotValues || {};
  const lines = [`Open "${template.name}" in CapCut`];
  const slots: any[] = Array.isArray(template.slots) ? template.slots : [];
  for (const s of slots) {
    const v = sv[s.slot_name];
    if (v == null || v === '') continue;
    const label = s.slot_name.replace(/_/g, ' ');
    if (s.type === 'clip') lines.push(`drop in [${v}]`);
    else if (s.type === 'timestamp' || s.type === 'audio_cue') lines.push(`set audio to [${v}]`);
    else lines.push(`${label}: ${v}`);
  }
  lines.push('export 9:16');
  return lines.join(' → ');
}

export function parsePostsArray(raw: any): any[] {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.posts) ? raw.posts : null;
  if (!list) return [];
  return list.map(normalizePost).filter((p) => p.caption || p.hook || p.image_prompt);
}

// --- Brand Profile + style-learning layer ---

// Load the single BrandProfile record (admin-only entity). Returns null if absent.
export async function loadBrandProfile(base44): Promise<any | null> {
  try {
    const list = await base44.asServiceRole.entities.BrandProfile.list();
    return list && list[0] ? list[0] : null;
  } catch {
    return null;
  }
}

// Render the BrandProfile into an authoritative prompt section.
export function brandProfileSection(bp: any): string {
  if (!bp) return '';
  const rules = String(bp.writing_rules || '')
    .split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `  • ${l}`).join('\n');
  const examples = String(bp.example_captions || '')
    .split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `  ${l}`).join('\n');
  const presets = Array.isArray(bp.image_style_presets) ? bp.image_style_presets : [];
  const presetLine = presets
    .filter((x) => x && x.name)
    .map((x) => `  • ${x.name} → ${String(x.prompt_suffix || '').trim()}`)
    .join('\n');
  return [
    'BRAND PROFILE — historical context. The current IROXANNE STUDIO EDITORIAL DIRECTION overrides conflicting platform promotion, jargon, old examples, or visual defaults.',
    `- Studio name: ${bp.studio_name || 'iRoxanne Studio'} (always spell it exactly this way)`,
    `- Voice / how the studio speaks: ${bp.voice_description || ''}`,
    `- What the studio builds / for whom: ${bp.service_description || ''}`,
    `- Audience: ${bp.audience_description || ''}`,
    `- Positioning notes (personal / real-person angle): ${bp.positioning_notes || ''}`,
    rules ? `- Hard writing rules:\n${rules}` : '',
    bp.banned_words_phrases ? `- Banned words/phrases (never use): ${bp.banned_words_phrases}` : '',
    `- Default links (portfolio, consult booking, etc.): ${bp.default_links || ''}`,
    `- Hashtag bank (preferred by platform): ${bp.hashtag_bank || ''}`,
    `- Image style notes: ${bp.image_style_notes || ''}`,
    presetLine ? `- Image style presets (append the matching prompt_suffix to image prompts):\n${presetLine}` : '',
    examples ? `- Example captions the admin loves (style reference):\n${examples}` : '',
  ].filter(Boolean).join('\n');
}

// Load up to 10 approved style examples for a platform (or all platforms).
// Prefer was_edited=true; fall back to unedited ones to fill to 10.
export async function loadStyleExamples(base44, platform?: string): Promise<string> {
  try {
    const editedQuery = platform ? { platform, was_edited: true } : { was_edited: true };
    let examples = await base44.asServiceRole.entities.StyleExample.filter(editedQuery, '-created_date', 10);
    examples = examples || [];
    if (examples.length < 10) {
      const fillQuery = platform ? { platform } : {};
      const more = await base44.asServiceRole.entities.StyleExample.filter(fillQuery, '-created_date', 20);
      const ids = new Set(examples.map((e) => e.id));
      for (const m of more || []) {
        if (ids.has(m.id)) continue;
        examples.push(m); ids.add(m.id);
        if (examples.length >= 10) break;
      }
    }
    if (!examples.length) return '';
    const lines = examples.map((e, i) =>
      `Example ${i + 1} [${e.platform}]${e.was_edited ? ' (edited by admin)' : ''}:\n${String(e.final_caption || '').trim()}`);
    return `STYLE REFERENCE — approved captions by the admin. Use only examples consistent with the current people-first editorial direction; do not copy technical positioning or repetitive hooks.\n\n${lines.join('\n\n')}`;
  } catch {
    return '';
  }
}

// --- Portfolio item context (the knowledge base) ---

// Load a PortfolioItem by id.
export async function loadPortfolioItem(base44, portfolioItemId?: string): Promise<any | null> {
  if (!portfolioItemId) return null;
  try {
    return await base44.asServiceRole.entities.PortfolioItem.get(portfolioItemId);
  } catch {
    return null;
  }
}

// Resolve a portfolio context from a PortfolioItem id. Returns { title, description, item }.
export async function resolvePortfolioContext(base44, portfolioItemId?: string): Promise<{ title: string; description: string; item: any | null } | null> {
  if (!portfolioItemId) return null;
  const item = await loadPortfolioItem(base44, portfolioItemId);
  if (!item) return null;
  return {
    title: item.title || '',
    description: item.description || item.tagline || '',
    item,
  };
}

// Render a PortfolioItem into an authoritative prompt section.
export function portfolioSection(item: any): string {
  if (!item) return '';
  const tech = Array.isArray(item.tech_used) ? item.tech_used.join(', ') : (item.tech_used || '');
  const shots = Array.isArray(item.screenshots) ? item.screenshots : [];
  const clientLine = item.client_shareable && item.client_name ? `- Client: ${item.client_name}` : (item.client_name ? `- Client: (name not cleared for public use — refer to generically)` : '');
  return [
    'PORTFOLIO ITEM — the authoritative knowledge base for this showcase. Draw hooks and on-screen text from the real details below. Do not invent features, results, or metrics the project does not have.',
    `- Title: ${item.title || ''}`,
    clientLine,
    `- Category: ${item.category || ''}`,
    `- Tagline: ${item.tagline || ''}`,
    `- What it does: ${item.description || ''}`,
    tech ? `- Tech / tools used: ${tech}` : '',
    item.project_url ? `- Live link: ${item.project_url}` : '',
    item.cover_image_url ? `- Cover screenshot: ${item.cover_image_url}` : '',
    shots.length ? `- Additional screenshots: ${shots.join(', ')}` : '',
    `- Featured: ${item.featured ? 'yes' : 'no'}`,
    item.saas_replacement_value ? `- SaaS replacement value: ${item.saas_replacement_value}` : '',
    item.project_tier ? `- Project tier: ${item.project_tier}` : '',
    item.marketing_features ? `\nDETAILED FEATURES & BENEFITS (use these for specific, compelling copy — reference real capabilities, not generic claims):\n${item.marketing_features}` : '',
  ].filter(Boolean).join('\n');
}

// Load approved testimonials, optionally filtered to a portfolio item.
export async function loadApprovedTestimonials(base44, portfolioItemId?: string): Promise<any[]> {
  try {
    const all = await base44.asServiceRole.entities.Testimonial.list('-created_date', 50);
    let pool = (all || []).filter((t) => t.approved_for_use === true && t.consent_to_publish === true && !t.request_pending);
    if (portfolioItemId) {
      const forItem = pool.filter((t) => t.portfolio_item_id === portfolioItemId);
      if (forItem.length >= 2) pool = forItem;
    }
    return pool.slice(0, 5);
  } catch {
    return [];
  }
}

// Render approved testimonials into a prompt section. Only quotes approved_for_use,
// and anonymizes clients whose client_anonymous is true.
export function testimonialSection(testimonials: any[]): string {
  if (!testimonials || !testimonials.length) return '';
  const lines = testimonials.map((t, i) => {
    const who = t.client_anonymous ? 'a recent client' : (t.client_name || 'a client');
    return `  ${i + 1}. "${String(t.quote || '').trim()}" — ${who}`;
  });
  return `APPROVED TESTIMONIALS — real, admin-approved client quotes. You may quote these directly (only these). Do not invent new quotes or attribute quotes to unnamed clients.\n${lines.join('\n')}`;
}

// Regenerate a single post's AI content (caption, hashtags, hook, cta, image_prompt,
// and for video formats the template slot values + video_brief) using the CURRENT
// portfolio context + brand profile + approved testimonials. Returns the regenerated
// field object (not persisted), or null if the AI produced nothing usable.
export async function regeneratePostContent(base44, post, opts) {
  const o = opts || {};
  const instruction = o.instruction;
  const cache = o.cache || {};
  const brandProfile = cache.brandProfile != null ? cache.brandProfile : await loadBrandProfile(base44);
  const templates = cache.templates != null ? cache.templates : await loadVideoTemplates(base44);
  let styleExamples = '';
  if (cache.styleExamplesByPlatform && cache.styleExamplesByPlatform.has(post.platform)) {
    styleExamples = cache.styleExamplesByPlatform.get(post.platform);
  } else {
    styleExamples = await loadStyleExamples(base44, post.platform);
    if (cache.styleExamplesByPlatform) cache.styleExamplesByPlatform.set(post.platform, styleExamples);
  }
  let ctx = cache.ctx != null ? cache.ctx : null;
  const pid = post.portfolio_item_id;
  const isServicePost = !pid || pid === '__studio_service__';
  if (!ctx && pid && !isServicePost) ctx = await resolvePortfolioContext(base44, pid);
  const brandSection = brandProfileSection(brandProfile);
  const templateSection = videoTemplateSection(templates);
  let itemTitle = 'iRoxanne Studio';
  let itemDescription = '';
  let portfolioItem = null;
  if (ctx) { itemTitle = ctx.title || itemTitle; itemDescription = ctx.description || ''; portfolioItem = ctx.item; }
  const portfolioSec = isServicePost ? '' : portfolioSection(portfolioItem);
  const testimonials = cache.testimonials != null ? cache.testimonials : (isServicePost ? [] : await loadApprovedTestimonials(base44, pid));
  const testimonialSec = testimonialSection(testimonials);

  const serviceContext = isServicePost
    ? `\nThis is a SERVICE MARKETING post — not tied to a specific project. Promote iRoxanne Studio's service, address client pain points, show process, or leverage social proof. Use content_bucket: "Service Offer", "Pain Point / Education", "Behind the Build", or "Social Proof". Link target should be "Get a Quote".`
    : '';

  const isVideo = VIDEO_FORMATS.includes(post.format);
  const keepTemplate = isVideo && post.template_id && !(instruction && /change\s+template|different\s+template/i.test(instruction));
  const tplById = new Map((templates || []).map((t) => [t.id, t]));
  const currentTpl = keepTemplate ? tplById.get(post.template_id) : null;
  const currentSlots = currentTpl ? (Array.isArray(currentTpl.slots) ? currentTpl.slots : []).map((s) => `  - ${s.slot_name} (${s.type})${s.instructions ? `: ${s.instructions}` : ''}`).join('\n') : '';
  const instructionLine = instruction
    ? `\nAdmin instruction for this rewrite: "${instruction}". Honor it while keeping the post platform-native and on-brand.`
    : '';

  const systemPrompt = `You are a senior social media copywriter for an independent app-development studio.
${STUDIO_CONTEXT}

${CONTENT_RULES}

${performanceRules(brandProfile)}
${brandSection ? `\n\n${brandSection}\n\nIMPORTANT: Where the Brand Profile conflicts with the generic content rules above, follow the Brand Profile.` : ''}${styleExamples ? `\n\n${styleExamples}` : ''}${templateSection ? `\n\n${templateSection}` : ''}${portfolioSec ? `\n\n${portfolioSec}` : ''}${testimonialSec ? `\n\n${testimonialSec}` : ''}

Rewrite a single social post for iRoxanne Studio.

Existing post:
- Platform: ${post.platform || 'Instagram'}
- Format: ${post.format || 'Feed Post'}
- Content bucket: ${post.content_bucket || '—'}
- Scheduled date: ${post.scheduled_date || 'TBD'}
- Current caption: ${post.caption || ''}
- Current hook: ${post.hook || ''}
- Current CTA: ${post.cta || ''}
- ${isServicePost ? 'This is a service post (not tied to a specific project).' : `Portfolio item: ${itemTitle}`}
${itemDescription ? `- What it does: ${itemDescription}` : ''}
${portfolioSec ? `- This post has a full portfolio context. Draw hooks and on-screen text from the real project details.` : ''}
${testimonialSec ? `- Approved testimonials are available — you may quote them directly when the post is testimonial/social-proof.` : ''}
${keepTemplate ? `- This post already uses template "${currentTpl?.name}" (id ${post.template_id}). KEEP this template and regenerate fresh slot_values for every slot.\n  Slots:\n${currentSlots}` : ''}
${post.image_style_preset ? `- Image style preset in use: "${post.image_style_preset}" — keep the look.` : ''}
${instructionLine}

Return a fresh version of THIS post only. Keep the same platform and format.
- caption, hashtags, hook, cta, image_prompt are all required.
- Follow the PERFORMANCE-BASED CONTENT RULES for hook timing, on-screen text, and hashtags.
${isVideo ? `- For this video format, pick the best-fitting template (or keep the existing one${keepTemplate ? ' — ' + currentTpl?.name : ''}), fill every slot in slot_values, and set video_brief to a human-readable CapCut assembly checklist derived from the template + slot values.` : ''}
- Image prompt should describe a distinct visual concept that complements the caption. Vary subjects, scale, lighting, palette, and composition across posts.

Return ONLY a JSON object with fields: platform, format, content_bucket, scheduled_date, scheduled_time, caption, hashtags, hook, cta, image_prompt, image_style_preset, video_brief, template_id, slot_values, clip_asset_id. No commentary, no markdown fences.`;

  const schema = {
    type: 'object',
    properties: {
      platform: { type: 'string' },
      format: { type: 'string' },
      content_bucket: { type: 'string' },
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
  };

  let generated = null;
  for (let attempt = 0; attempt < 2 && !generated; attempt++) {
    const res = await base44.integrations.Core.InvokeLLM({ prompt: systemPrompt, response_json_schema: schema });
    const candidate = res && typeof res === 'object' ? normalizePost({ ...res, ...post }) : null;
    if (candidate && (candidate.caption || candidate.hook || candidate.image_prompt)) generated = candidate;
  }
  if (!generated) return null;

  if (generated.template_id && generated.slot_values && !generated.video_brief) {
    const tpl = tplById.get(generated.template_id);
    if (tpl) generated.video_brief = assembleVideoBrief(tpl, generated.slot_values);
  }

  return {
    ...generated,
    scheduled_date: generated.scheduled_date || post.scheduled_date || '',
    scheduled_time: generated.scheduled_time || post.scheduled_time || '',
    platform: post.platform || generated.platform,
    format: post.format || generated.format,
    template_id: generated.template_id || (keepTemplate ? post.template_id : ''),
    slot_values: generated.slot_values || (keepTemplate ? post.slot_values : null),
    clip_asset_id: generated.clip_asset_id || post.clip_asset_id || '',
    image_style_preset: generated.image_style_preset || post.image_style_preset || '',
  };
}

// --- Notification settings (for scheduled email functions) ---
export async function loadNotificationSettings(base44): Promise<any> {
  try {
    const list = await base44.asServiceRole.entities.BrandProfile.list();
    const bp = list && list[0] ? list[0] : {};
    return {
      email: String(bp.notify_email || '').trim(),
      timezone: String(bp.notify_timezone || 'America/New_York').trim() || 'America/New_York',
      daily_posts: bp.notify_daily_posts !== false,
      weekly_digest: bp.notify_weekly_digest !== false,
      launch_countdown: bp.notify_launch_countdown === true,
      filming_nudge: bp.notify_filming_nudge !== false,
      send_time: String(bp.notify_send_time || '08:00'),
    };
  } catch {
    return { email: '', timezone: 'America/New_York', daily_posts: true, weekly_digest: true, launch_countdown: false, filming_nudge: true, send_time: '08:00' };
  }
}

// --- Video template system ---

export async function loadVideoTemplates(base44): Promise<any[]> {
  try {
    const list = await base44.asServiceRole.entities.VideoTemplate.list();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function videoTemplateSection(templates: any[]): string {
  if (!templates || templates.length === 0) return '';
  const lines = templates.map((t) => {
    const slots: any[] = Array.isArray(t.slots) ? t.slots : [];
    const slotList = slots.map((s) => `    - ${s.slot_name} (${s.type})${s.instructions ? `: ${s.instructions}` : ''}`).join('\n');
    return `• ${t.name} [${t.content_type || ''}] — ${t.target_length_seconds || '?'}s${t.platforms?.length ? ` for ${t.platforms.join('/')}` : ''}${t.capcut_notes ? `\n  CapCut: ${t.capcut_notes}` : ''}${slotList ? `\n  Slots:\n${slotList}` : ''}`;
  });
  return `VIDEO TEMPLATES — for every video-format post, pick the single best-fitting template by id and fill every slot.
Return the chosen template_id, and a slot_values object mapping each slot_name to its filled value.
Then set video_brief to a human-readable CapCut assembly checklist derived from the template + slot values.

${lines.join('\n\n')}`;
}

// --- Clip library (for suggestClips) ---

export async function loadClipLibrary(base44): Promise<any[]> {
  try {
    const list = await base44.asServiceRole.entities.ClipAsset.list();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function clipLibraryDigest(clips: any[], forceMyFootage: boolean): string {
  const pool = forceMyFootage ? clips.filter((c) => c.source_type === 'My Footage') : clips;
  if (pool.length === 0) return '';
  return pool.map((c) => {
    const moods = Array.isArray(c.moods) ? c.moods.join(', ') : '';
    return `ID:${c.id} | ${c.title} | source=${c.source_type} | orientation=${c.orientation || ''} | moods=${moods}${c.duration_seconds ? ` | ~${c.duration_seconds}s` : ''}${c.notes ? ` | notes: ${c.notes}` : ''}`;
  }).join('\n');
}

// --- Date helpers (backend) ---

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + n);
  return x;
}

export function dateKeyInTZ(tz: string, d: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return dateKey(d);
  }
}

export function hourMinuteInTZ(tz: string, d: Date): { h: number; m: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'America/New_York',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
    }).formatToParts(d);
    let h = Number((parts.find((p) => p.type === 'hour') || {}).value || '0');
    if (h === 24) h = 0;
    const m = Number((parts.find((p) => p.type === 'minute') || {}).value || '0');
    return { h, m };
  } catch {
    return { h: d.getHours(), m: d.getMinutes() };
  }
}

// The public site origin used in email links. Placeholder until the real
// iRoxanne Studio domain is provided.
export const PUBLIC_ORIGIN = 'https://iroxanne-studio.example.com';

export function appOrigin(req?: any): string {
  try {
    const h = req?.headers;
    const get = (name: string) => (h && h.get ? h.get(name) : (h ? h[name] : null));
    const xfh = get('x-forwarded-host');
    if (xfh) {
      const host = String(xfh).split(',')[0].trim();
      const proto = (get('x-forwarded-proto') || 'https').split(',')[0].trim();
      return `${proto}://${host}`;
    }
    const fwd = get('forwarded');
    if (fwd) {
      const host = String(fwd).match(/host=([^;,]+)/i)?.[1]?.trim();
      if (host) {
        const proto = String(fwd).match(/proto=([^;,]+)/i)?.[1]?.trim() || 'https';
        return `${proto}://${host}`;
      }
    }
    if (req && req.url) {
      const o = new URL(req.url).origin;
      if (!o.includes('base44-dispatcher') && !o.includes('.base44.workers.dev')) return o;
    }
  } catch {}
  return PUBLIC_ORIGIN;
}

// --- Branded HTML email wrapper for Marketing Content Suite emails ---

function escapeEmailHtml(s: string): string {
  return String(s || '').replace(/[&<>"]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'));
}

export type EmailRow = string | { text: string; strong?: boolean; muted?: boolean; bullet?: boolean };

// Renders a branded iRoxanne Studio HTML email. `rows` are the body lines (already
// built by the caller). `linkPath` is appended to the public origin (e.g. '/marketing').
export function marketingEmailHtml(opts: {
  heading: string;
  intro?: string;
  rows?: EmailRow[];
  linkPath?: string;
  linkLabel?: string;
  footerNote?: string;
}): string {
  const { heading, intro, rows = [], linkPath, linkLabel, footerNote } = opts;
  const link = linkPath ? `${PUBLIC_ORIGIN}${linkPath}` : '';
  const rowsHtml = rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows
        .map((r) => {
          const obj = typeof r === 'string' ? { text: r } : r;
          if (!obj.text) return '';
          const bullet = obj.bullet !== false;
          const color = obj.muted ? '#6F6A60' : obj.strong ? '#F5F2EA' : '#D8D3C9';
          const weight = obj.strong ? '600' : '400';
          const b = bullet ? `<span style="color:#C59F59;font-weight:700;">•</span>&nbsp;&nbsp;` : '';
          return `<tr><td style="padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;line-height:1.55;color:${color};font-weight:${weight};">${b}${escapeEmailHtml(obj.text)}</td></tr>`;
        })
        .join('')}</table>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeEmailHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#171C1D;border-radius:16px;overflow:hidden;border:1px solid rgba(197,160,89,0.22);">
        <tr><td style="padding:30px 28px 22px;background:linear-gradient(135deg,rgba(27,87,93,0.55) 0%,#0D0D0D 100%);">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#C59F59;font-weight:600;letter-spacing:0.5px;">iRoxanne Studio</div>
          <div style="margin-top:16px;font-size:21px;color:#F5F2EA;font-weight:600;line-height:1.3;">${escapeEmailHtml(heading)}</div>
          ${intro ? `<div style="margin-top:12px;font-size:14px;color:#B8B4AC;line-height:1.6;">${escapeEmailHtml(intro)}</div>` : ''}
        </td></tr>
        <tr><td style="padding:18px 28px 4px;">${rowsHtml}</td></tr>
        ${link ? `<tr><td style="padding:18px 28px 8px;">
          <a href="${escapeEmailHtml(link)}" style="display:inline-block;background:#C59F59;color:#0D0D0D;text-decoration:none;font-weight:600;font-size:14px;padding:13px 26px;border-radius:999px;">${escapeEmailHtml(linkLabel || 'Open the Today view')}</a>
        </td></tr>` : ''}
        <tr><td style="padding:16px 28px 26px;border-top:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:12px;color:#6F6A60;">${escapeEmailHtml(footerNote || 'Marketing Content Suite · iRoxanne Studio')}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function shortTime(t?: string): string {
  const s = String(t || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  return s;
}