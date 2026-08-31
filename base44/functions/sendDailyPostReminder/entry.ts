import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { loadNotificationSettings, dateKeyInTZ, appOrigin, requireAuthenticated, marketingEmailHtml, shortTime } from '../../shared/marketingAdmin.ts';
import { sendPush } from '../../shared/onesignal.ts';
import { renderTemplate } from '../../shared/emailTemplates.ts';
import { secrets } from 'base44:runtime';

// sendDailyPostReminder — scheduled (service role). Emails AND pushes the
// admin a summary of every post due today (in the admin's timezone), so they
// start the day knowing what to post. Rejects anonymous external callers.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthenticated(base44);
    if (!auth.ok) return auth.response;
    const ns = await loadNotificationSettings(base44);
    if (!ns.daily_posts) return Response.json({ sent: false, reason: 'daily posts reminder disabled' });

    const today = dateKeyInTZ(ns.timezone, new Date());
    const posts = await base44.asServiceRole.entities.MarketingPost.filter({ scheduled_date: today }, '-created_date', 50);
    const due = (posts || []).filter((p) => p.status === 'Draft' || p.status === 'Pending Review' || p.status === 'Ready');
    if (!due.length) return Response.json({ sent: false, reason: 'no posts due today' });

    const origin = appOrigin(req);
    const rows = due.map((p) => {
      const firstLine = String(p.hook || (p.caption || '').split('\n')[0] || '(no caption yet)').trim();
      const time = shortTime(p.scheduled_time);
      return `${time ? time + ' ' : ''}${p.platform} · ${p.format || 'post'} — ${firstLine}`;
    });

    const { subject, text: intro } = await renderTemplate(base44, 'admin_daily_posts', {
      count: due.length,
      plural: due.length === 1 ? '' : 's',
      date: today,
    });
    const plainLines = rows.map((r) => `• ${r}`).join('\n');
    const body = marketingEmailHtml({
      heading: subject,
      intro,
      rows,
      linkPath: '/marketing',
      linkLabel: 'Open the Today view',
    });

    let emailed: any = null;
    if (ns.email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: ns.email, subject, body, from_name: 'Roxsan' });
        emailed = true;
      } catch (e) {
        emailed = { error: e.message };
      }
    }
    const pushed = await sendPush({ heading: subject, message: plainLines, url: origin ? `${origin}/marketing` : undefined, apiKey: secrets.get('ONESIGNAL_REST_API_KEY') });

    return Response.json({ sent: true, count: due.length, emailed, pushed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}