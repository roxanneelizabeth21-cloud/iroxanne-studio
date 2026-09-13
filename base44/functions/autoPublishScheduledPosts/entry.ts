import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { publishMarketingPost } from '../../shared/publishPost.ts';
import {
  loadNotificationSettings,
  dateKeyInTZ,
  hourMinuteInTZ,
  appOrigin,
  requireAuthenticated,
  marketingEmailHtml,
} from '../../shared/marketingAdmin.ts';
import { sendPush } from '../../shared/onesignal.ts';
import { renderTemplate } from '../../shared/emailTemplates.ts';
import { secrets } from 'base44:runtime';

// autoPublishScheduledPosts — scheduled every 15 minutes (service role).
// Finds Ready posts with publish_mode = 'auto' whose scheduled_time falls in the
// current 15-minute window (admin timezone; unset time defaults to 09:00) and
// publishes each via the shared publish logic.
//   Success: post becomes Posted with external_post_id + posted_at (same as manual).
//   Failure: post STAYS Ready, publish_error records the specific error, and the
//   admin gets a push + email so they can fix and publish manually or retry.
// Manual posts are untouched — they keep getting the sendPostTimeReminder nudge.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthenticated(base44);
    if (!auth.ok) return auth.response;
    const actor = await base44.auth.me().catch(() => null);
    if (!actor || (actor.role !== 'admin' && actor.is_service !== true)) return Response.json({error:'Forbidden'}, {status:403});

    const ns = await loadNotificationSettings(base44);
    const tz = ns.timezone || 'America/New_York';
    const now = new Date();
    const today = dateKeyInTZ(tz, now);

    const { h, m } = hourMinuteInTZ(tz, now);
    const nowStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    // Catch-up rather than an exact 15-minute bucket: anything scheduled today at
    // or before the current local time that hasn't published yet is due, so a post
    // set for 9:05 goes out on the next run instead of being skipped forever.
    // Instagram and Facebook can each carry their own date/time (staggering), so
    // the query can no longer key off scheduled_date — due-ness is worked out per
    // platform below, with scheduled_date/time as the fallback for either.
    const posts = await base44.asServiceRole.entities.MarketingPost.filter(
      { publish_mode: 'auto' },
      '-created_date',
      200
    );
    // Accept both 24-hour ("21:05") and 12-hour ("9:05 PM") stored times.
    const normalizeTime = (raw) => {
      const s = String(raw || '').trim();
      const ampm = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp])[Mm]?$/);
      if (ampm) {
        let hh = Number(ampm[1]) % 12;
        if (ampm[3].toLowerCase() === 'p') hh += 12;
        return `${String(hh).padStart(2, '0')}:${ampm[2]}`;
      }
      const h24 = s.match(/^(\d{1,2}):(\d{2})$/);
      if (h24) return `${String(Number(h24[1])).padStart(2, '0')}:${h24[2]}`;
      return '09:00';
    };

    // Per-platform due list: which of this post's platforms should go out now.
    const dueTargetsFor = (p) => {
      const selected = (Array.isArray(p.publish_targets) && p.publish_targets.length ? p.publish_targets : [p.platform])
        .filter((t) => ['Facebook', 'Instagram'].includes(t));
      return selected.filter((t) => {
        const isIG = t === 'Instagram';
        if (['Published', 'Failed', 'Connection Required', 'Permission Required'].includes(p[isIG ? 'instagram_publish_status' : 'facebook_publish_status'])) return false;
        const date = p[isIG ? 'instagram_scheduled_date' : 'facebook_scheduled_date'] || p.scheduled_date;
        if (!date || date > today) return false;
        const time = normalizeTime(p[isIG ? 'instagram_scheduled_time' : 'facebook_scheduled_time'] || p.scheduled_time);
        return date < today || time <= nowStr;
      });
    };

    const due = (posts || [])
      .filter((p) => p.approval_status === 'Approved')
      .filter((p) => ['Ready', 'Scheduled', 'Approved', 'Partially Published'].includes(p.status))
      .map((p) => ({ post: p, targets: dueTargetsFor(p) }))
      .filter((x) => x.targets.length > 0);

    if (!due.length) return Response.json({ published: 0, failed: 0, now: nowStr });

    const successes = [];
    const failures = [];
    for (const { post: p, targets } of due) {
      const firstLine = String(p.hook || (p.caption || '').split('\n')[0] || p.format || 'post').trim().slice(0, 80);
      try {
        const r = await publishMarketingPost(base44, p, targets);
        if (r.errors?.length) failures.push({id:p.id,platform:targets.join(' + '),error:r.errors.join(' | '),firstLine});
        successes.push({ id: p.id, platform: targets.join(' + '), external_id: r.external_id, firstLine });
      } catch (e) {
        const msg = String(e.message);
        try {
          await base44.asServiceRole.entities.MarketingPost.update(p.id, { publish_error: msg });
        } catch {
          // post stays Ready either way; error already captured in failures below
        }
        failures.push({ id: p.id, platform: p.platform, error: msg, firstLine });
      }
    }

    // Notify the admin about failures (push + email with the specific error).
    let emailed = null;
    let pushed = null;
    if (failures.length) {
      const origin = appOrigin(req);
      const rows = failures.map((f) => `${f.platform} — ${f.firstLine}: ${f.error}`);
      const plainLines = rows.map((r) => `• ${r}`).join('\n');
      const { subject: heading, text: intro } = await renderTemplate(base44, 'admin_publish_failed', {
        count: failures.length,
        plural: failures.length === 1 ? '' : 's',
      });
      if (ns.email) {
        try {
          const body = marketingEmailHtml({
            heading,
            intro,
            rows,
            linkPath: '/marketing/calendar',
            linkLabel: 'Open the calendar',
          });
          await base44.asServiceRole.integrations.Core.SendEmail({ to: ns.email, subject: heading, body, from_name: 'iRoxanne Studio' });
          emailed = true;
        } catch (e) {
          emailed = { error: e.message };
        }
      }
      pushed = await sendPush({ heading, message: plainLines, url: origin ? `${origin}/marketing/calendar` : undefined, apiKey: secrets.get('ONESIGNAL_REST_API_KEY') });
    }

    return Response.json({
      published: successes.length,
      failed: failures.length,
      now: nowStr,
      successes,
      failures,
      emailed,
      pushed,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}