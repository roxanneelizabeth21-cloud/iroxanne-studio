import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { loadNotificationSettings, dateKey, addDays, requireAuthenticated, marketingEmailHtml, EmailRow } from '../../shared/marketingAdmin.ts';
import { renderTemplate } from '../../shared/emailTemplates.ts';

// sendReleaseCountdown — scheduled daily (service role). Rejects anonymous external callers.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthenticated(base44);
    if (!auth.ok) return auth.response;
    const ns = await loadNotificationSettings(base44);
    if (!ns.release_countdown || !ns.email) return Response.json({ sent: false, reason: 'disabled or no email' });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayK = dateKey(today);

    const [songProfiles, campaigns, posts] = await Promise.all([
      base44.asServiceRole.entities.SongProfile.list(),
      base44.asServiceRole.entities.Campaign.list(),
      base44.asServiceRole.entities.MarketingPost.list('-created_date', 500),
    ]);

    const windows = [14, 7, 3, 1];
    const due = [];
    for (const s of (songProfiles || [])) {
      if (!s.release_date) continue;
      const rd = new Date(s.release_date + 'T00:00:00');
      if (isNaN(rd.getTime())) continue;
      const days = Math.round((rd.getTime() - today.getTime()) / 86400000);
      if (!windows.includes(days)) continue;
      const campaign = (campaigns || []).find((c) => c.song_id === s.song_id) || null;
      const cPosts = campaign ? (posts || []).filter((p) => p.campaign_id === campaign.id) : [];
      const ready = cPosts.filter((p) => p.status === 'Ready' || p.status === 'Posted').length;
      due.push({ title: s.title, days, campaign: campaign ? campaign.name : 'No active campaign', campaignStatus: campaign ? campaign.status : '—', ready, total: cPosts.length });
    }

    if (!due.length) return Response.json({ sent: false, reason: 'no countdowns today' });

    const rows: EmailRow[] = [];
    for (const d of due) {
      rows.push({ text: `"${d.title}" — ${d.days} day${d.days === 1 ? '' : 's'} to release`, strong: true, bullet: false });
      rows.push(`Campaign: ${d.campaign} (${d.campaignStatus})`);
      rows.push({ text: `Ready posts: ${d.ready}/${d.total}`, muted: true });
    }
    const { subject, text: intro } = await renderTemplate(base44, 'admin_release_countdown', {
      date: todayK,
      count: due.length,
    });
    const body = marketingEmailHtml({
      heading: subject,
      intro,
      rows,
      linkPath: '/marketing',
      linkLabel: 'Open the Content Suite',
    });

    await base44.asServiceRole.integrations.Core.SendEmail({ to: ns.email, subject, body, from_name: 'Roxsan' });
    return Response.json({ sent: true, count: due.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}