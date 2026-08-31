import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  ARTIST_CONTEXT,
  CONTENT_RULES,
  performanceRules,
  generationSettings,
  normalizePost,
  parsePostsArray,
  loadBrandProfile,
  brandProfileSection,
  loadStyleExamples,
  loadVideoTemplates,
  videoTemplateSection,
  assembleVideoBrief,
  loadSongProfile,
  songProfileSection,
  dateKey,
  addDays,
  requireAuthenticated,
} from '../../shared/marketingAdmin.ts';

// autoGenerateContent — scheduled (service role). Rejects anonymous external callers.
// Two jobs, both producing "Pending Review" posts (auto_generated=true):
//   1. For every Active campaign: fill the coming 7 days up to the campaign's cadence.
//   2. Evergreen rotation for Released songs with evergreen_on and no active campaign:
//      keep ~3 posts rolling in the last 7 days, varying angle/lyric line vs recent posts.
// Never duplicates recent content — recently used hooks/angles are passed to the LLM to vary.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthenticated(base44);
    if (!auth.ok) return auth.response;

    const [campaigns, releases, songProfiles, posts, brandProfile, templates] = await Promise.all([
      base44.asServiceRole.entities.Campaign.list(),
      base44.asServiceRole.entities.MusicRelease.list(),
      base44.asServiceRole.entities.SongProfile.list(),
      base44.asServiceRole.entities.MarketingPost.list('-created_date', 500),
      loadBrandProfile(base44),
      loadVideoTemplates(base44),
    ]);
    const styleExamples = await loadStyleExamples(base44);
    const brandSection = brandProfileSection(brandProfile);
    const settings = generationSettings(brandProfile);
    const perfRules = performanceRules(brandProfile);
    const templateSection = videoTemplateSection(templates);
    const tplById = new Map((templates || []).map((t) => [t.id, t]));

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const coming7 = Array.from({ length: 7 }, (_, i) => dateKey(addDays(today, i)));

    const report = { campaign_posts: 0, evergreen_posts: 0, campaigns_checked: 0, evergreen_checked: 0 };

    // ---- Helpers ----
    const releaseById = (id) => (releases || []).find((r) => r.id === id) || null;
    const profileForSong = (songId, title) => {
      const byId = (songProfiles || []).find((s) => s.song_id === songId);
      if (byId) return byId;
      if (title) {
        const t = String(title).trim().toLowerCase();
        const m = (songProfiles || []).find((s) => String(s.title || '').trim().toLowerCase() === t);
        if (m) return m;
      }
      return null;
    };
    const recentAngles = (predicate, days = 14) => {
      const since = addDays(today, -days).getTime();
      return (posts || [])
        .filter((p) => predicate(p) && new Date((p.scheduled_date || p.created_date || '') + 'T00:00:00').getTime() >= since && p.status !== 'Skipped')
        .map((p) => String(p.hook || (p.caption || '').split('\n')[0] || '').trim())
        .filter(Boolean)
        .slice(0, 12);
    };

    const generateBatch = async ({ count, dates, songTitle, songDescription, songProfile, avoid, campaignId, songId }) => {
      const songSection = songProfileSection(songProfile);
      const avoidLine = avoid.length ? `\nDo NOT repeat these recently used angles/hooks (vary the angle and the lyric line):\n${avoid.map((a) => `  - ${a}`).join('\n')}` : '';
      const dateList = dates.map((d) => `  - ${d}`).join('\n');
      const prompt = `You are a senior music marketing strategist for an independent artist.
${ARTIST_CONTEXT}

${CONTENT_RULES}

${perfRules}
${brandSection ? `\n\n${brandSection}` : ''}${styleExamples ? `\n\n${styleExamples}` : ''}${templateSection ? `\n\n${templateSection}` : ''}${songSection ? `\n\n${songSection}` : ''}

Generate exactly ${count} social posts for Roxsan, one per listed date.
- Song/Release: "${songTitle}"
${songDescription ? `- Release themes: ${songDescription}` : ''}
${songSection ? `- Draw hooks and on-screen text from the song's REAL lyric lines (quote where fitting).` : ''}
- Use EXACTLY these scheduled dates (one post per date, no extras):\n${dateList}
- Spread across Facebook, Instagram, YouTube, and TikTok; weight Reels, Shorts, and TikTok videos.
- Follow the PERFORMANCE-BASED CONTENT RULES (${settings.loopPct}% loop / ${settings.authenticPct}% authentic / ${settings.ctaPct}% CTA). Assign content_bucket.
- Every post: platform, format, scheduled_date, caption, hashtags, hook, cta, image_prompt. For video formats: template_id, slot_values, video_brief.
- Image prompt: NO faces, NO text/logos.${avoidLine}

Return ONLY { "posts": [ ... ] }. No commentary, no markdown fences.`;

      const schema = {
        type: 'object',
        properties: { posts: { type: 'array', items: { type: 'object', properties: {
          platform: { type: 'string' }, format: { type: 'string' }, content_bucket: { type: 'string' },
          scheduled_date: { type: 'string' }, scheduled_time: { type: 'string' },
          caption: { type: 'string' }, hashtags: { type: 'string' }, hook: { type: 'string' },
          cta: { type: 'string' }, image_prompt: { type: 'string' }, image_style_preset: { type: 'string' },
          video_brief: { type: 'string' }, template_id: { type: 'string' }, slot_values: { type: 'object' },
        } } } },
        required: ['posts'],
      };

      let parsed = [];
      for (let attempt = 0; attempt < 2 && parsed.length === 0; attempt++) {
        const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
        parsed = parsePostsArray(res);
      }
      // Pin each post to one of the requested dates (the AI may drift).
      const records = parsed.slice(0, count).map((p, i) => {
        const date = dates[i] || dates[dates.length - 1] || dateKey(today);
        if (p.template_id && p.slot_values && !p.video_brief) {
          const tpl = tplById.get(p.template_id);
          if (tpl) p.video_brief = assembleVideoBrief(tpl, p.slot_values);
        }
        return {
          ...p,
          scheduled_date: date,
          status: 'Pending Review',
          auto_generated: true,
          campaign_id: campaignId || '',
          song_id: songId || '',
          original_ai_caption: p.caption || '',
        };
      });
      if (!records.length) return [];
      await base44.asServiceRole.entities.MarketingPost.bulkCreate(records);
      return records;
    };

    // ---- 1. Active campaign gap-fill ----
    const activeCampaigns = (campaigns || []).filter((c) => c.status === 'Active');
    for (const c of activeCampaigns) {
      report.campaigns_checked += 1;
      const song = releaseById(c.song_id);
      const songTitle = song?.title || c.name || 'the release';
      const songDescription = song?.description || '';
      const profile = profileForSong(c.song_id, songTitle);
      const existing = (posts || []).filter((p) => p.campaign_id === c.id && coming7.includes(p.scheduled_date) && p.status !== 'Skipped');
      const cadence = settings.campaignPerWeek;
      const needed = Math.max(0, cadence - existing.length);
      if (needed <= 0) continue;
      const used = new Set(existing.map((p) => p.scheduled_date));
      let available = coming7.filter((d) => !used.has(d));
      if (available.length < needed) available = coming7.slice();
      const dates = available.slice(0, needed);
      const avoid = recentAngles((p) => p.campaign_id === c.id || p.song_id === c.song_id);
      const made = await generateBatch({ count: needed, dates, songTitle, songDescription, songProfile: profile, avoid, campaignId: c.id, songId: c.song_id });
      report.campaign_posts += made.length;
    }

    // ---- 2. Evergreen rotation ----
    const evergreenProfiles = (songProfiles || []).filter((s) => s.release_status === 'Released' && s.evergreen_on !== false);
    for (const profile of evergreenProfiles) {
      report.evergreen_checked += 1;
      const songId = profile.song_id || '';
      // Skip if there's an active campaign for this song (covered above).
      if (songId && activeCampaigns.some((c) => c.song_id === songId)) continue;
      const since7 = addDays(today, -7).getTime();
      const last7 = (posts || []).filter((p) => {
        if (p.status === 'Skipped') return false;
        const dt = new Date((p.scheduled_date || '') + 'T00:00:00').getTime();
        if (dt < since7) return false;
        return (songId && p.song_id === songId) || String(p.caption || p.hook || '').toLowerCase().includes(String(profile.title || '').toLowerCase());
      });
      const want = settings.evergreenPerWeek;
      const needed = Math.max(0, want - last7.length);
      if (needed <= 0) continue;
      const used = new Set(last7.map((p) => p.scheduled_date));
      let available = coming7.filter((d) => !used.has(d));
      if (available.length < needed) available = coming7.slice();
      const dates = available.slice(0, Math.min(needed, 2));
      if (!dates.length) continue;
      const avoid = recentAngles((p) => (songId && p.song_id === songId) || String(p.caption || p.hook || '').toLowerCase().includes(String(profile.title || '').toLowerCase()));
      const made = await generateBatch({ count: dates.length, dates, songTitle: profile.title || 'this release', songDescription: '', songProfile: profile, avoid, campaignId: '', songId });
      report.evergreen_posts += made.length;
    }

    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}