import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  requireAdmin,
  regeneratePostContent,
  resolveSongContext,
  loadBrandProfile,
  loadVideoTemplates,
} from '../../shared/marketingAdmin.ts';

// regenerateStalePosts — admin-only.
// Regenerates the AI text of auto-generated posts that were created BEFORE their
// song's lyrics were uploaded — so the AI fabricated lyric lines. Re-runs each
// affected post through `regeneratePostContent` now that real lyrics exist in the
// SongProfile (or the matching Track). Only touches Draft / Pending Review posts
// (never admin-approved Ready / Posted). Skips posts whose song still has no lyrics.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(100, Number(body && body.limit) || 40));

    const [posts, brandProfile, templates] = await Promise.all([
      base44.asServiceRole.entities.MarketingPost.list('-created_date', 500),
      loadBrandProfile(base44),
      loadVideoTemplates(base44),
    ]);
    const cache = { brandProfile, templates, styleExamplesByPlatform: new Map() };

    const stale = (posts || []).filter((p) =>
      p.auto_generated === true && (p.status === 'Draft' || p.status === 'Pending Review')
    );
    const report = {
      checked: stale.length,
      eligible: 0,
      regenerated: 0,
      skipped_no_lyrics: 0,
      remaining: 0,
      errors: [],
    };

    // Resolve lyric availability once per song (and cache the context for reuse).
    const songIds = [...new Set(stale.map((p) => p.song_id).filter(Boolean))];
    const hasLyricsBySong = {};
    const ctxBySong = {};
    for (const sid of songIds) {
      const ctx = await resolveSongContext(base44, sid);
      ctxBySong[sid] = ctx;
      hasLyricsBySong[sid] = !!(ctx && ctx.songProfile && String(ctx.songProfile.lyrics || '').trim());
    }

    const eligible = stale.filter((p) => {
      const has = p.song_id ? !!hasLyricsBySong[p.song_id] : false;
      if (!has) { report.skipped_no_lyrics += 1; return false; }
      return true;
    });
    report.eligible = eligible.length;

    const queue = eligible.slice(0, limit);
    const updates = [];
    for (const post of queue) {
      try {
        const generated = await regeneratePostContent(base44, post, {
          cache: { ...cache, ctx: post.song_id ? ctxBySong[post.song_id] : null },
        });
        if (!generated) { report.errors.push({ id: post.id, reason: 'AI returned nothing' }); continue; }
        updates.push({
          id: post.id,
          caption: generated.caption,
          hashtags: generated.hashtags,
          hook: generated.hook,
          cta: generated.cta,
          image_prompt: generated.image_prompt,
          image_style_preset: generated.image_style_preset,
          content_bucket: generated.content_bucket,
          video_brief: generated.video_brief,
          template_id: generated.template_id,
          slot_values: generated.slot_values,
        });
        report.regenerated += 1;
      } catch (e) {
        report.errors.push({ id: post.id, reason: e.message });
      }
    }
    for (let i = 0; i < updates.length; i += 50) {
      await base44.asServiceRole.entities.MarketingPost.bulkUpdate(updates.slice(i, i + 50));
    }
    report.remaining = Math.max(0, eligible.length - queue.length);
    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}