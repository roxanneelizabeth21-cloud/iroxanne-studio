import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  loadNotificationSettings,
  loadBrandProfile,
  brandProfileSection,
  ARTIST_CONTEXT,
  requireAuthenticated,
  marketingEmailHtml,
  EmailRow,
} from '../../shared/marketingAdmin.ts';
import { renderTemplate } from '../../shared/emailTemplates.ts';

// sendFilmingNudge — scheduled monthly (service role). Rejects anonymous external callers.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthenticated(base44);
    if (!auth.ok) return auth.response;
    const ns = await loadNotificationSettings(base44);
    if (!ns.filming_nudge || !ns.email) return Response.json({ sent: false, reason: 'disabled or no email' });

    const [songProfiles, brandProfile] = await Promise.all([
      base44.asServiceRole.entities.SongProfile.list(),
      loadBrandProfile(base44),
    ]);
    const brandSection = brandProfileSection(brandProfile);

    // Use songs that have a story to draw opening lines from.
    const pool = (songProfiles || []).filter((s) => s.song_story || s.key_lines).slice(0, 6);
    const songsDigest = pool.map((s, i) => `Song ${i + 1}: "${s.title}"\nStory: ${s.song_story || ''}\nKey lines:\n${String(s.key_lines || '').split('\n').map((l) => `  ${l.trim()}`).filter(Boolean).join('\n')}`).join('\n\n');

    const prompt = `You are a content director for an independent artist.
${ARTIST_CONTEXT}
${brandSection ? `\n${brandSection}\n` : ''}

Plan a single filming session (~1 hour, one sitting) of 4-6 direct-to-camera / authentic personal shots. For each shot:
- opening_line: the EXACT first line the artist says to camera (drawn from the song's story or a real lyric line where fitting)
- shot_description: what to film (phone-shot, behind-the-scenes feel — admin's OWN footage, never stock)
- which_song: the song title it relates to
- length_seconds: 15-30

Songs to draw from:
${songsDigest || '(no song profiles yet — generate generic personal shots: morning routine, studio moment, thanking fans, a favourite lyric)'}

Return ONLY { "shots": [ { opening_line, shot_description, which_song, length_seconds } ] }. No commentary, no markdown fences.`;

    const schema = {
      type: 'object',
      properties: { shots: { type: 'array', items: { type: 'object', properties: {
        opening_line: { type: 'string' }, shot_description: { type: 'string' }, which_song: { type: 'string' }, length_seconds: { type: 'number' },
      } } } },
      required: ['shots'],
    };

    let shots = [];
    for (let attempt = 0; attempt < 2 && shots.length === 0; attempt++) {
      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      shots = Array.isArray(res?.shots) ? res.shots : [];
    }

    if (!shots.length) return Response.json({ sent: false, reason: 'generation failed' });

    const rows: EmailRow[] = [];
    shots.forEach((s, i) => {
      rows.push({ text: `Shot ${i + 1} — ${s.which_song || 'personal'} (~${s.length_seconds || 20}s)`, strong: true, bullet: false });
      rows.push(`Opening line: "${s.opening_line}"`);
      rows.push(`Film: ${s.shot_description}`);
    });
    const { subject, text: intro } = await renderTemplate(base44, 'admin_filming_nudge', { count: shots.length });
    const body = marketingEmailHtml({
      heading: subject,
      intro,
      rows,
      linkPath: '/marketing/clips',
      linkLabel: 'Open the Clip Library',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({ to: ns.email, subject, body, from_name: 'Roxsan' });
    return Response.json({ sent: true, count: shots.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}