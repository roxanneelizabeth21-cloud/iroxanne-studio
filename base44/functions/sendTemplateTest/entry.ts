import { CANONICAL_URL } from '../../shared/studioUrl.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { renderTemplate, subscriberEmailHtml, textToHtmlParagraphs } from '../../shared/emailTemplates.ts';
import { brandedEmail, detailRows } from '../../shared/emailBrand.ts';
import { marketingEmailHtml } from '../../shared/marketingAdmin.ts';
import { unsubscribeUrl } from '../../shared/subscriberEmail.ts';

// Admin-only "Send test to myself". Renders the requested template exactly the
// way the real send does — same shell, same merge-field substitution — using
// sample data, and emails it to the signed-in admin.
const SAMPLE: Record<string, Record<string, any>> = {
  fan_welcome: { fan_name: 'Alex', email: 'alex@example.com', site_url: CANONICAL_URL, music_url: `${CANONICAL_URL}/quote` },
  admin_new_subscriber: { email: 'alex@example.com', name: 'Alex', source: 'newsletter', utm: 'instagram / social / launch', signed_up: new Date().toLocaleString() },
  admin_new_inquiry: { name: 'Alex', email: 'alex@example.com', inquiry_type: 'new project', message_subject: 'Custom app inquiry', submitted: new Date().toLocaleString() },
  admin_daily_posts: { count: 2, plural: 's', date: new Date().toISOString().slice(0, 10) },
  admin_post_time: { count: 1, plural: '', date: new Date().toISOString().slice(0, 10), time: '09:00' },
  admin_weekly_digest: { week_start: '2026-08-19', week_end: '2026-08-31', completed_count: 4, scheduled_count: 6 },
  admin_release_countdown: { date: new Date().toISOString().slice(0, 10), count: 1 },
  admin_filming_nudge: { count: 4 },
  admin_publish_failed: { count: 1, plural: '' },
};

const SAMPLE_ROWS: Record<string, string[]> = {
  admin_daily_posts: ['09:00 Instagram · Reel — Sample hook line', '17:00 Facebook · Feed Post — Sample caption line'],
  admin_post_time: ['09:00 Instagram · Reel — Sample hook line'],
  admin_weekly_digest: ['Posts completed last week: 4', 'Posts scheduled this week: 6'],
  admin_release_countdown: ['"Booking System" — 7 days to launch', 'Campaign: Launch push (Active)'],
  admin_filming_nudge: ['Shot 1 — Booking System demo (~20s)', 'Opening line: "This one started with a client who hated their spreadsheets."'],
  admin_publish_failed: ['Instagram — Sample hook line: token expired'],
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admins only' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const key = String(payload?.key || '');
    const vars = SAMPLE[key];
    if (!vars) return Response.json({ error: 'Unknown template' }, { status: 400 });

    const to = String(payload?.to || user.email || '').trim();
    if (!to) return Response.json({ error: 'No recipient email on your account' }, { status: 400 });

    const { subject, text } = await renderTemplate(base44, key, vars);

    let html: string;
    if (key === 'fan_welcome') {
      html = subscriberEmailHtml(text, unsubscribeUrl(to));
    } else if (key === 'admin_new_subscriber') {
      html = brandedEmail({
        title: 'New subscriber',
        content: `${textToHtmlParagraphs(text)}
${detailRows([['Email', vars.email], ['Name', vars.name], ['Source', vars.source], ['UTM', vars.utm], ['Signed up', vars.signed_up]])}`,
        footerNote: 'Manage all subscribers in your admin → Subscribers.',
      });
    } else if (key === 'admin_new_inquiry') {
      html = brandedEmail({
        title: 'New inquiry',
        content: `${textToHtmlParagraphs(text)}
${detailRows([['Name', vars.name], ['Email', vars.email], ['Inquiry Type', vars.inquiry_type], ['Subject', vars.message_subject], ['Submitted', vars.submitted]])}
<p style="margin:22px 0 8px;color:#8B8B85;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
<div style="white-space:pre-wrap;background:#F7F5F0;border-radius:10px;padding:16px;">This is a sample message body.</div>`,
        footerNote: `Reply directly to this email to respond to ${vars.name}.`,
      });
    } else {
      html = marketingEmailHtml({
        heading: subject,
        intro: text,
        rows: SAMPLE_ROWS[key] || [],
        linkPath: '/marketing',
        linkLabel: 'Open the Content Suite',
      });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      from_name: 'iRoxanne Studio',
      subject: `[Test] ${subject}`,
      body: html,
    });

    return Response.json({ sent: true, to, subject });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}