import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { loadNotificationSettings, dateKey, addDays, requireAuthenticated, marketingEmailHtml, EmailRow } from '../../shared/marketingAdmin.ts';
import { renderTemplate } from '../../shared/emailTemplates.ts';

// sendWeeklyDigest — scheduled (service role). Rejects anonymous external callers.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthenticated(base44);
    if (!auth.ok) return auth.response;
    const ns = await loadNotificationSettings(base44);
    if (!ns.weekly_digest || !ns.email) return Response.json({ sent: false, reason: 'disabled or no email' });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekStart = addDays(today, -7);
    const weekEnd = addDays(today, 6);
    const ks = dateKey(weekStart);
    const ke = dateKey(weekEnd);

    const [posts, campaigns, songProfiles] = await Promise.all([
      base44.asServiceRole.entities.MarketingPost.list('-created_date', 500),
      base44.asServiceRole.entities.Campaign.list(),
      base44.asServiceRole.entities.SongProfile.list(),
    ]);

    const inRange = (dateStr, a, b) => {
      const d = new Date((dateStr || '') + 'T00:00:00');
      if (isNaN(d.getTime())) return false;
      return d.getTime() >= a.getTime() && d.getTime() <= b.getTime();
    };

    const completedLastWeek = (posts || []).filter((p) => p.status === 'Posted' && inRange(p.posted_at || p.scheduled_date, weekStart, today));
    const scheduledThisWeek = (posts || []).filter((p) => p.status !== 'Posted' && p.status !== 'Skipped' && inRange(p.scheduled_date, today, weekEnd));
    const nearingEnd = (campaigns || []).filter((c) => c.status === 'Active' && c.end_date && inRange(c.end_date, today, addDays(today, 14)));

    // Songs with low remaining content: Released profiles with < 4 non-skipped posts in the last 30 days.
    const since30 = addDays(today, -30).getTime();
    const lowContent = (songProfiles || []).filter((s) => s.release_status === 'Released').filter((s) => {
      const count = (posts || []).filter((p) => p.status !== 'Skipped' && (p.song_id === s.song_id || String(p.caption || '').toLowerCase().includes(String(s.title || '').toLowerCase())) && new Date((p.scheduled_date || '') + 'T00:00:00').getTime() >= since30).length;
      return count < 4;
    });

    const rows: EmailRow[] = [];
    rows.push({ text: `Posts completed last week: ${completedLastWeek.length}`, strong: true, bullet: false });
    rows.push(...completedLastWeek.map((p) => `${p.platform} — ${String(p.hook || (p.caption || '').split('\n')[0] || '').trim()}`));
    rows.push({ text: `Posts scheduled this week (${ks} → ${ke}): ${scheduledThisWeek.length}`, strong: true, bullet: false });
    rows.push(...scheduledThisWeek.slice(0, 12).map((p) => `${p.scheduled_date} ${p.platform} — ${String(p.hook || (p.caption || '').split('\n')[0] || '').trim()}`));
    if (nearingEnd.length) {
      rows.push({ text: 'Campaigns nearing their end:', strong: true, bullet: false });
      rows.push(...nearingEnd.map((c) => `${c.name} — ends ${c.end_date}`));
    }
    if (lowContent.length) {
      rows.push({ text: 'Songs with low recent content (consider a boost):', strong: true, bullet: false });
      rows.push(...lowContent.map((s) => s.title));
    }

    const { subject, text: intro } = await renderTemplate(base44, 'admin_weekly_digest', {
      week_start: ks,
      week_end: ke,
      completed_count: completedLastWeek.length,
      scheduled_count: scheduledThisWeek.length,
    });
    const body = marketingEmailHtml({
      heading: subject,
      intro,
      rows,
      linkPath: '/marketing',
      linkLabel: 'Open the Content Suite',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({ to: ns.email, subject, body, from_name: 'Roxsan' });
    return Response.json({ sent: true, completed: completedLastWeek.length, scheduled: scheduledThisWeek.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}