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

// The content rules shared by campaign generation and single-post regeneration.
export const ARTIST_CONTEXT = `
About the artist:
- Name: Roxsan (write "Roxsan", never "Roxanne" unless quoting a song title).
- Independent artist speaking directly to her audience — warm, authentic, direct. Not a corporate brand.
- Music blends Caribbean (reggae, soca) with country-pop and contemporary Christian influences.
- Faith-positive tone where it fits naturally; never forced or preachy.
`.trim();

export const CONTENT_RULES = `
Content rules:
- Voice: warm, authentic, direct — an independent artist speaking to her audience, not a corporate brand. Use "I" and "you".
- Platform-native writing:
  - Instagram captions: line breaks for rhythm, 5–10 relevant hashtags at the end, hashtag-friendly tone.
  - Facebook: slightly longer and conversational, 1–3 hashtags.
  - YouTube: keyword-aware titles (put the title in the caption field first line), description with value, hashtags at the end.
- Image prompts MUST describe a scene WITHOUT any faces visible (hands, silhouettes, landscapes, objects, back-of-figure shots are fine) and MUST NOT include any text or logos in the image — branding is added separately by the admin in Canva. Describe lighting, mood, color palette, and composition.
- Vary content types across the calendar: lyric teasers, behind-the-scenes style prompts, countdown posts, release-day announcement, fan-engagement questions, streaming-link CTAs post-release.
- Hooks should stop the scroll in the first 2 seconds (for video) or first line (for text).
- CTAs should be specific and platform-appropriate (e.g. "Pre-save now", "Drop a 🎧 if this is your vibe", "Subscribe for the official video").
- Never invent streaming URLs or dates that contradict the provided campaign details.
`.trim();

// Performance-based content rules. These override generic defaults and are based on
// current platform performance data. Injected into every generation/regeneration prompt.
export const PERFORMANCE_RULES = `
PERFORMANCE-BASED CONTENT RULES — these override generic defaults. Apply to every post.

Content mix per campaign (approximate):
- 60% short music loop clips: 8–15 seconds, built around the song's most energetic moment (chorus or hook), lyric text on screen, designed to loop seamlessly.
- 25% authentic/personal content: phone-shot feel, behind-the-scenes, story-behind-the-song, direct-to-camera moments. These briefs MUST specify the admin's OWN footage, never stock.
- 15% announcement/CTA posts: countdowns, release-day, streaming-link pushes.

Assign each post a "content_bucket" of one of: "Loop Clip", "Authentic/Personal", "Announcement/CTA" so the mix holds across the calendar.

Format rules (apply per platform on every video post):
- All video is vertical 9:16 with captions/on-screen text always on.
- Instagram/Facebook Reels: 15–30 seconds. Feed video: 6–15 seconds.
- YouTube Shorts: 6–15 seconds preferred, 30 max.
- Stories: 5–10 seconds.

Hook rules (every video brief MUST specify):
- The audio must start at the song's chorus/drop/most energetic moment — never the intro. The brief must name the song section to use.
- Frame one must have bold on-screen text: a provocative line, lyric, or direct address to the listener. The brief provides the exact text.
- The first 2–3 seconds decide performance; the brief must describe exactly what is on screen in those seconds.

Hashtag rules: 5–8 hashtags per Reel in three tiers — 2–3 niche genre tags, 2–3 content-type tags, 1–2 broad discovery tags. Never mega-generic tags like #music.

Caption rules: Put the primary keyword/topic phrase in the first line, before the truncation point.
`.trim();

// Owner-configurable generation settings, read off the BrandProfile record.
export function generationSettings(bp: any): { campaignPerWeek: number; evergreenPerWeek: number; loopPct: number; authenticPct: number; ctaPct: number } {
  const num = (v: any, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
  };
  return {
    campaignPerWeek: num(bp?.posts_per_campaign_week, 4),
    evergreenPerWeek: num(bp?.posts_per_evergreen_week, 3),
    loopPct: num(bp?.mix_loop_pct, 60),
    authenticPct: num(bp?.mix_authentic_pct, 25),
    ctaPct: num(bp?.mix_cta_pct, 15),
  };
}

// PERFORMANCE_RULES with the owner's configured content mix substituted in.
export function performanceRules(bp: any): string {
  const s = generationSettings(bp);
  return PERFORMANCE_RULES
    .replace('- 60% short music loop clips:', `- ${s.loopPct}% short music loop clips:`)
    .replace('- 25% authentic/personal content:', `- ${s.authenticPct}% authentic/personal content:`)
    .replace('- 15% announcement/CTA posts:', `- ${s.ctaPct}% announcement/CTA posts:`);
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
  const platform = ['Facebook', 'Instagram', 'YouTube', 'TikTok'].includes(p.platform) ? p.platform : 'Instagram';
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
    'BRAND PROFILE — authoritatively defines voice and rules. Override any generic content rules above where they conflict.',
    `- Artist name: ${bp.artist_name || 'Roxsan'} (always spell it exactly this way)`,
    `- Voice / how the artist speaks: ${bp.voice_description || ''}`,
    `- Genre / musical identity: ${bp.genre_blend || ''}`,
    `- Audience: ${bp.audience_description || ''}`,
    `- Faith integration (when/how faith themes appear): ${bp.faith_integration_notes || ''}`,
    rules ? `- Hard writing rules:\n${rules}` : '',
    bp.banned_words_phrases ? `- Banned words/phrases (never use): ${bp.banned_words_phrases}` : '',
    `- Default streaming links: ${bp.default_streaming_links || ''}`,
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
    return `STYLE REFERENCE — approved captions by the admin. Match the voice, rhythm, length, and formatting of these approved examples.\n\n${lines.join('\n\n')}`;
  } catch {
    return '';
  }
}

// --- Song content profiles (the knowledge base) ---

// Load the SongProfile for a song. Match by song_id (Release id) first, then by title.
export async function loadSongProfile(base44, songId?: string, releaseTitle?: string): Promise<any | null> {
  try {
    if (songId) {
      const byId = await base44.asServiceRole.entities.SongProfile.filter({ song_id: songId }, '-created_date', 1);
      if (byId && byId[0]) return byId[0];
    }
    if (releaseTitle) {
      const all = await base44.asServiceRole.entities.SongProfile.list();
      const t = String(releaseTitle).trim().toLowerCase();
      const match = (all || []).find((s) => String(s.title || '').trim().toLowerCase() === t);
      if (match) return match;
    }
    return null;
  } catch {
    return null;
  }
}

// Resolve a song context from either a MusicRelease id (album/single) or a Track id
// (song-level). Returns { title, description, songProfile } where songProfile is the
// best available content profile: a real SongProfile if one matches by id or title,
// otherwise a minimal profile built from the track's own lyrics. Used by every
// generation function so lyric posts can target individual tracks on an album.
export async function resolveSongContext(base44, songId?: string): Promise<{ title: string; description: string; songProfile: any | null } | null> {
  if (!songId) return null;
  let release: any = null;
  try { release = await base44.asServiceRole.entities.MusicRelease.get(songId); } catch {}
  if (release) {
    const songProfile = await loadSongProfile(base44, songId, release.title);
    return { title: release.title || '', description: release.description || release.tagline || '', songProfile };
  }
  let track: any = null;
  try { track = await base44.asServiceRole.entities.Track.get(songId); } catch {}
  if (track) {
    let parent: any = null;
    try { parent = await base44.asServiceRole.entities.MusicRelease.get(track.release_id); } catch {}
    const title = track.title || parent?.title || '';
    let songProfile = await loadSongProfile(base44, songId, title);
    if (!songProfile && track.lyrics) {
      songProfile = { title, lyrics: track.lyrics, themes: [], key_lines: '', chorus_summary: '', song_story: '', streaming_links: '' };
    }
    return { title, description: parent?.description || parent?.tagline || '', songProfile };
  }
  return null;
}

// Render a SongProfile into an authoritative prompt section. The AI must draw hooks,
// on-screen text, and captions from the real lyric lines, quoting them where fitting.
export function songProfileSection(profile: any): string {
  if (!profile) return '';
  const themes = Array.isArray(profile.themes) ? profile.themes.join(', ') : (profile.themes || '');
  const keyLines = String(profile.key_lines || '')
    .split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `  “${l}”`).join('\n');
  return [
    'SONG CONTENT PROFILE — the authoritative knowledge base for this song. Draw hooks, on-screen text, and captions from the REAL lyric lines below. Quote actual lines where fitting; do not invent lyrics.',
    `- Title: ${profile.title || ''}`,
    `- What the song is about (story): ${profile.song_story || ''}`,
    themes ? `- Themes: ${themes}` : '',
    `- Chorus message (one sentence): ${profile.chorus_summary || ''}`,
    keyLines ? `- Key / quotable lyric lines (use these for hooks and on-screen text):\n${keyLines}` : '',
    profile.lyrics ? `- Full lyrics (with section labels):\n${profile.lyrics}` : '',
    profile.streaming_links ? `- Streaming links: ${profile.streaming_links}` : '',
  ].filter(Boolean).join('\n');
}

// Regenerate a single post's AI content (caption, hashtags, hook, cta, image_prompt,
// and for video formats the template slot values + video_brief) using the CURRENT song
// lyrics + brand profile. Returns the regenerated field object (not persisted), or
// null if the AI produced nothing usable. Shared by the single-post regenerate
// endpoint and the batch "regenerate stale posts" endpoint so both quote real lyrics
// instead of fabricated lines from before the lyrics were uploaded.
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
  if (!ctx && post.song_id) ctx = await resolveSongContext(base44, post.song_id);
  const brandSection = brandProfileSection(brandProfile);
  const templateSection = videoTemplateSection(templates);
  let songTitle = 'this release';
  let songDescription = '';
  if (ctx) { songTitle = ctx.title || songTitle; songDescription = ctx.description || ''; }
  const songProfile = ctx?.songProfile || await loadSongProfile(base44, post.song_id, songTitle);
  const songSection = songProfileSection(songProfile);

  const isVideo = VIDEO_FORMATS.includes(post.format);
  const keepTemplate = isVideo && post.template_id && !(instruction && /change\s+template|different\s+template/i.test(instruction));
  const tplById = new Map((templates || []).map((t) => [t.id, t]));
  const currentTpl = keepTemplate ? tplById.get(post.template_id) : null;
  const currentSlots = currentTpl ? (Array.isArray(currentTpl.slots) ? currentTpl.slots : []).map((s) => `  - ${s.slot_name} (${s.type})${s.instructions ? `: ${s.instructions}` : ''}`).join('\n') : '';
  const instructionLine = instruction
    ? `\nAdmin instruction for this rewrite: "${instruction}". Honor it while keeping the post platform-native and on-brand.`
    : '';

  const systemPrompt = `You are a senior music social media copywriter for an independent artist.
${ARTIST_CONTEXT}

${CONTENT_RULES}

${performanceRules(brandProfile)}
${brandSection ? `\n\n${brandSection}\n\nIMPORTANT: Where the Brand Profile conflicts with the generic content rules above, follow the Brand Profile.` : ''}${styleExamples ? `\n\n${styleExamples}` : ''}${templateSection ? `\n\n${templateSection}` : ''}${songSection ? `\n\n${songSection}` : ''}

Rewrite a single social post for Roxsan.

Existing post:
- Platform: ${post.platform || 'Instagram'}
- Format: ${post.format || 'Feed Post'}
- Content bucket: ${post.content_bucket || '—'}
- Scheduled date: ${post.scheduled_date || 'TBD'}
- Current caption: ${post.caption || ''}
- Current hook: ${post.hook || ''}
- Current CTA: ${post.cta || ''}
- Song/Release: ${songTitle}
${songDescription ? `- Release themes: ${songDescription}` : ''}
${songSection ? `- This song has a full content profile (lyrics, story, key lines). Quote real lyric lines for hooks and on-screen text.` : ''}
${keepTemplate ? `- This post already uses template "${currentTpl?.name}" (id ${post.template_id}). KEEP this template and regenerate fresh slot_values for every slot.\n  Slots:\n${currentSlots}` : ''}
${post.image_style_preset ? `- Image style preset in use: "${post.image_style_preset}" — keep the look.` : ''}
${instructionLine}

Return a fresh version of THIS post only. Keep the same platform and format.
- caption, hashtags, hook, cta, image_prompt are all required.
- Follow the PERFORMANCE-BASED CONTENT RULES for hook timing, on-screen text, and hashtags.
${isVideo ? `- For this video format, pick the best-fitting template (or keep the existing one${keepTemplate ? ' — ' + currentTpl?.name : ''}), fill every slot in slot_values, and set video_brief to a human-readable CapCut assembly checklist derived from the template + slot values.` : ''}
- Image prompt must show NO faces and NO text/logos.

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
      release_countdown: bp.notify_release_countdown !== false,
      filming_nudge: bp.notify_filming_nudge !== false,
      send_time: String(bp.notify_send_time || '08:00'),
    };
  } catch {
    return { email: '', timezone: 'America/New_York', daily_posts: true, weekly_digest: true, release_countdown: true, filming_nudge: true, send_time: '08:00' };
  }
}

// --- Video template system ---

// Load all video templates (admin-only entity).
export async function loadVideoTemplates(base44): Promise<any[]> {
  try {
    const list = await base44.asServiceRole.entities.VideoTemplate.list();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Render templates into an authoritative prompt section so the AI can pick the best fit
// and fill every slot for each video-format post.
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

// Load the admin's clip library, returning a compact list for LLM matching.
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

// Date key (YYYY-MM-DD) in a specific IANA timezone. Falls back to UTC on error.
// Used by scheduled reminder functions so "today" matches the admin's calendar
// day rather than the backend runtime's UTC day.
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

// { h, m } (0-23 hour, 0-59 minute) in a specific IANA timezone. Falls back to
// the runtime local time on error.
export function hourMinuteInTZ(tz: string, d: Date): { h: number; m: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'America/New_York',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
    }).formatToParts(d);
    let h = Number((parts.find((p) => p.type === 'hour') || {}).value || '0');
    if (h === 24) h = 0; // some runtimes emit "24" at midnight with hour12:false
    const m = Number((parts.find((p) => p.type === 'minute') || {}).value || '0');
    return { h, m };
  } catch {
    return { h: d.getHours(), m: d.getMinutes() };
  }
}

// The public site origin used in email links. The platform invokes scheduled
// functions through an internal dispatcher host
// (base44-dispatcher-production.base44.workers.dev), so req.url's origin is NOT
// publicly routable — emailing it produces a link the admin can't open. Derive
// the real public origin from forwarded headers first, then fall back to the
// site's public domain.
export const PUBLIC_ORIGIN = 'https://iroxanne.com';

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
      // The internal dispatcher host is not publicly routable; ignore it.
      if (!o.includes('base44-dispatcher') && !o.includes('.base44.workers.dev')) return o;
    }
  } catch {}
  return PUBLIC_ORIGIN;
}

// --- Branded HTML email wrapper for Marketing Content Suite emails ---

function escapeEmailHtml(s: string): string {
  return String(s || '').replace(/[&<>"]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'));
}

// A row in the email body. Plain strings render as a gold-bulleted line; an
// object lets the caller emit a bold section header (no bullet) or muted note.
export type EmailRow = string | { text: string; strong?: boolean; muted?: boolean; bullet?: boolean };

// Renders a branded Roxsan HTML email. `rows` are the body lines (already built
// by the caller). `linkPath` is appended to the public origin (e.g. '/marketing').
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
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#C59F59;font-weight:600;letter-spacing:0.5px;">Roxsan</div>
          <div style="margin-top:16px;font-size:21px;color:#F5F2EA;font-weight:600;line-height:1.3;">${escapeEmailHtml(heading)}</div>
          ${intro ? `<div style="margin-top:12px;font-size:14px;color:#B8B4AC;line-height:1.6;">${escapeEmailHtml(intro)}</div>` : ''}
        </td></tr>
        <tr><td style="padding:18px 28px 4px;">${rowsHtml}</td></tr>
        ${link ? `<tr><td style="padding:18px 28px 8px;">
          <a href="${escapeEmailHtml(link)}" style="display:inline-block;background:#C59F59;color:#0D0D0D;text-decoration:none;font-weight:600;font-size:14px;padding:13px 26px;border-radius:999px;">${escapeEmailHtml(linkLabel || 'Open the Today view')}</a>
        </td></tr>` : ''}
        <tr><td style="padding:16px 28px 26px;border-top:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:12px;color:#6F6A60;">${escapeEmailHtml(footerNote || 'Marketing Content Suite · Roxsan Music')}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Normalizes a scheduled_time value to a clean "HH:MM" display (drops seconds
// and AM/PM suffixes) so email rows read consistently.
export function shortTime(t?: string): string {
  const s = String(t || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  return s;
}