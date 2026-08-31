import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  loadNotificationSettings,
  dateKeyInTZ,
  hourMinuteInTZ,
  appOrigin,
  requireAuthenticated,
  marketingEmailHtml,
  shortTime,
} from '../../shared/marketingAdmin.ts';
import { sendPush } from '../../shared/onesignal.ts';
import { renderTemplate } from '../../shared/emailTemplates.ts';
import { secrets } from 'base44:runtime';

// sendPostTimeReminder — scheduled every 15 minutes (service role). At each run
// it finds posts whose scheduled_time falls in the current 15-minute window
// (in the admin's timezone) and sends a single combined push + email nudge so
// the admin knows it's time to post. Rejects anonymous external callers.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthenticated(base44);
    if (!auth.ok) return auth.response;

    const ns = await loadNotificationSettings(base44);
    if (!ns.daily_posts) return Response.json({ sent: false, reason: 'daily posts reminder disabled' });

    const now = new Date();
    const tz = ns.timezone || 'America/New_York';

    // Today's date in the admin's timezone (posts are scheduled by calendar date).
    const today = dateKeyInTZ(tz, now);

    // Current 15-minute window [start, end) as "HH:MM" strings. Each post matches
    // at most once per day, so the admin never gets duplicate nudges.
    const { h, m } = hourMinuteInTZ(tz, now);
    const bucketStart = m - (m % 15); // 0, 15, 30, 45
    const startTotal = h * 60 + bucketStart;
    const endTotal = startTotal + 15;
    const startStr = `${String(Math.floor(startTotal / 60) % 24).padStart(2, '0')}:${String(startTotal % 60).padStart(2, '0')}`;
    const endStr = `${String(Math.floor(endTotal / 60) % 24).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;

    const posts = await base44.asServiceRole.entities.MarketingPost.filter(
      { scheduled_date: today },
      '-created_date',
      100
    );
    const due = (posts || []).filter((p) => {
      if (p.status === 'Posted' || p.status === 'Skipped') return false;
      if (p.publish_mode === 'auto') return false; // auto posts publish themselves; failures notify separately
      const t = String(p.scheduled_time || '');
      if (!/^\d{2}:\d{2}$/.test(t)) return false; // only posts with an explicit time get a time-based nudge
      return t >= startStr && t < endStr;
    });

    if (!due.length) return Response.json({ sent: false, reason: `no posts in window ${startStr}-${endStr}` });

    const origin = appOrigin(req);
    const rows = due.map((p) => {
      const firstLine = String(p.hook || (p.caption || '').split('\n')[0] || '(no caption yet)').trim();
      const time = shortTime(p.scheduled_time);
      return `${time ? time + ' ' : ''}${p.platform} · ${p.format || 'post'} — ${firstLine}`;
    });
    const plainLines = rows.map((r) => `• ${r}`).join('\n');

    const { subject: heading, text: intro } = await renderTemplate(base44, 'admin_post_time', {
      count: due.length,
      plural: due.length === 1 ? '' : 's',
      date: today,
      time: `${startStr}-${endStr}`,
    });
    const body = marketingEmailHtml({
      heading,
      intro,
      rows,
      linkPath: '/marketing',
      linkLabel: 'Open the Today view',
    });

    let emailed: any = null;
    if (ns.email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: ns.email, subject: heading, body, from_name: 'Roxsan' });
        emailed = true;
      } catch (e) {
        emailed = { error: e.message };
      }
    }
    const pushed = await sendPush({ heading, message: plainLines, url: origin ? `${origin}/marketing` : undefined, apiKey: secrets.get('ONESIGNAL_REST_API_KEY') });

    return Response.json({ sent: true, count: due.length, window: `${startStr}-${endStr}`, emailed, pushed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}