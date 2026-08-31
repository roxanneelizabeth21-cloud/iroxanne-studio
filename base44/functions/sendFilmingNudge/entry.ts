import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  loadNotificationSettings,
  loadBrandProfile,
  brandProfileSection,
  STUDIO_CONTEXT,
  requireAuthenticated,
  marketingEmailHtml,
  EmailRow,
} from '../../shared/marketingAdmin.ts';
import { renderTemplate } from '../../shared/emailTemplates.ts';

// sendFilmingNudge — scheduled monthly (service role). Rejects anonymous external callers.
// Plans a single ~1 hour content session of 4-6 screen-capture / behind-the-build shots,
// drawing from real PortfolioItems so the owner always has concrete things to film.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthenticated(base44);
    if (!auth.ok) return auth.response;
    const ns = await loadNotificationSettings(base44);
    if (!ns.filming_nudge || !ns.email) return Response.json({ sent: false, reason: 'disabled or no email' });

    const [portfolioItems, brandProfile] = await Promise.all([
      base44.asServiceRole.entities.PortfolioItem.list('-created_date', 20),
      loadBrandProfile(base44),
    ]);
    const brandSection = brandProfileSection(brandProfile);

    const pool = (portfolioItems || []).filter((p) => p.description || p.tagline).slice(0, 6);
    const itemsDigest = pool.map((p, i) => `Project ${i + 1}: "${p.title}"\nWhat it does: ${p.description || p.tagline || ''}\nCategory: ${p.category || ''}${p.cover_image_url ? `\nCover: ${p.cover_image_url}` : ''}`).join('\n\n');

    const prompt = `You are a content director for an independent app-development studio.
${STUDIO_CONTEXT}
${brandSection ? `\n${brandSection}\n` : ''}

Plan a single filming/screen-capture session (~1 hour, one sitting) of 4-6 authentic behind-the-build shots. For each shot:
- opening_line: the EXACT first line the owner says to camera (drawn from a real project detail)
- shot_description: what to film (screen recording, workspace, phone demo, behind-the-build — admin's OWN footage, never stock)
- which_project: the project title it relates to
- length_seconds: 15-30

Projects to draw from:
${itemsDigest || '(no portfolio items yet — generate generic behind-the-build shots: workspace setup, planning a new app, building a feature, thanking a client)'}

Return ONLY { "shots": [ { opening_line, shot_description, which_project, length_seconds } ] }. No commentary, no markdown fences.`;

    const schema = {
      type: 'object',
      properties: { shots: { type: 'array', items: { type: 'object', properties: {
        opening_line: { type: 'string' }, shot_description: { type: 'string' }, which_project: { type: 'string' }, length_seconds: { type: 'number' },
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
      rows.push({ text: `Shot ${i + 1} — ${s.which_project || 'behind the build'} (~${s.length_seconds || 20}s)`, strong: true, bullet: false });
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

    await base44.asServiceRole.integrations.Core.SendEmail({ to: ns.email, subject, body, from_name: 'iRoxanne Studio' });
    return Response.json({ sent: true, count: shots.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}