import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  requireAdmin,
  ARTIST_CONTEXT,
  loadBrandProfile,
  brandProfileSection,
} from '../../shared/marketingAdmin.ts';

// bulkImportSongs — admin-only.
// Parses a single large paste of multiple songs' lyrics into individual SongProfile
// drafts (title, lyrics, story, themes, key_lines, chorus_summary). Does NOT save —
// the admin reviews the drafts in the UI and saves with one button.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const { text, link_existing = true } = body || {};
    if (!text || !String(text).trim()) {
      return Response.json({ error: 'Paste some lyrics to import.' }, { status: 400 });
    }

    const brandProfile = await loadBrandProfile(base44);
    const brandSection = brandProfileSection(brandProfile);
    const defaultLinks = brandProfile?.default_streaming_links || '';

    const pasteBlock = text.trim();

    const prompt = `You are a music catalog assistant. The user has pasted the FULL lyrics of one or more songs below, delimited by <PASTE></PASTE>. Your job is to split the paste into separate songs and build a content profile for each.

<PASTE>
${pasteBlock}
</PASTE>

HOW TO SPLIT INTO SONGS:
- A new song begins at a line that is clearly a TITLE: a short standalone line (usually 1-7 words, under ~50 characters) that is NOT part of the lyrics and is NOT followed by more lyric-like lines on the same logical line.
- Common title formats in this paste: a title-cased line ("Amazing Grace", "Love Song", "You Don't Know Roxanne") OR a lowercase line that reads like a title ("Some day one day maybe", "Don't get it twisted", "Bless your Heart I'm Fine"). Do not reject lowercase titles.
- Songs are usually separated by one or more blank lines, with the title as the first non-blank line of each block.
- Everything AFTER a title line (until the next title) is that song's lyrics. Preserve blank lines and section labels like [Verse 1], [Chorus] exactly as written.
- If the entire paste is a single song with no clear title, use "Untitled" as the title and treat all the text as its lyrics.

For EACH detected song, generate a content profile:
- title: the detected song title (cleaned — trim quotes/markdown, keep original capitalization)
- lyrics: the FULL lyrics for that song, exactly as pasted (do not summarize, truncate, or invent lines)
- song_story: 1-3 sentences on what the song is about, inferred from the lyrics
- themes: 3-6 theme tags (e.g. Faith, Love, Resilience, Island Life, Family, Joy, Worship, Hope, Heartbreak, Celebration, Identity, Forgiveness)
- key_lines: the 3-6 most quotable / hook-worthy lyric lines, one per line (exact lines copied from the lyrics — do not paraphrase)
- chorus_summary: the chorus message in one sentence (infer from the chorus if present, else from the most repeated section)
- release_status: "Unreleased"
- streaming_links: leave empty

${brandSection ? `\n${brandSection}\n` : ''}
Artist: Roxsan. Do NOT invent lyrics that are not in the paste. Do NOT merge multiple songs into one. Every song in the paste must become its own item.

Return ONLY a JSON object: { "songs": [ { title, lyrics, song_story, themes, key_lines, chorus_summary, release_status, streaming_links } ] }. The "songs" array must contain one entry per song detected in the paste. No commentary, no markdown fences.`;

    const schema = {
      type: 'object',
      properties: {
        songs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              lyrics: { type: 'string' },
              song_story: { type: 'string' },
              themes: { type: 'array', items: { type: 'string' } },
              key_lines: { type: 'string' },
              chorus_summary: { type: 'string' },
              release_status: { type: 'string', enum: ['Unreleased', 'Upcoming', 'Released'] },
              streaming_links: { type: 'string' },
            },
            required: ['title', 'lyrics'],
          },
        },
      },
      required: ['songs'],
    };

    let songs = [];
    for (let attempt = 0; attempt < 2 && songs.length === 0; attempt++) {
      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      songs = Array.isArray(res?.songs) ? res.songs : [];
    }

    if (!songs.length) {
      return Response.json({ error: 'Could not parse any songs from the paste. Try formatting with clear title lines.' }, { status: 502 });
    }

    // Optionally link each draft to an existing Release by matching title.
    let releases = [];
    if (link_existing) {
      try { releases = await base44.asServiceRole.entities.MusicRelease.list(); } catch {}
    }
    const drafts = songs.map((s) => {
      const title = String(s.title || 'Untitled').trim();
      let song_id = '';
      if (link_existing && releases.length) {
        const t = title.toLowerCase();
        const match = releases.find((r) => String(r.title || '').trim().toLowerCase() === t);
        if (match) song_id = match.id;
      }
      return {
        title,
        song_id,
        lyrics: String(s.lyrics || '').trim(),
        song_story: String(s.song_story || '').trim(),
        themes: Array.isArray(s.themes) ? s.themes.map((x) => String(x).trim()).filter(Boolean) : [],
        key_lines: String(s.key_lines || '').trim(),
        chorus_summary: String(s.chorus_summary || '').trim(),
        streaming_links: String(s.streaming_links || defaultLinks).trim(),
        release_status: ['Unreleased', 'Upcoming', 'Released'].includes(s.release_status) ? s.release_status : 'Unreleased',
        release_date: '',
        evergreen_on: true,
      };
    });

    return Response.json({ drafts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}