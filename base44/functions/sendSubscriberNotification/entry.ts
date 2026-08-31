import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { sendGmail } from '../../shared/gmail.ts';
import { brandedEmail, detailRows } from '../../shared/emailBrand.ts';
import { renderTemplate, textToHtmlParagraphs } from '../../shared/emailTemplates.ts';

// Fires on FanSubscriber create (entity automation). Sends a Gmail alert to
// the admin (builder) so they know a new fan subscribed via /go/:slug or the
// newsletter.
//
// Caller verification: this endpoint has a public URL. The entity automation
// passes the created FanSubscriber record (body.data) and event id. We only
// accept the call when it references a REAL FanSubscriber record created in
// the last 2 minutes — so an anonymous stranger can't trip the alert by
// hitting the URL with a fabricated payload. Anonymous direct calls with no
// real fresh record are rejected with 401.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const data = body.data || body;
    const entityId = data.id || body.event?.entity_id;

    let recordOk = false;
    if (entityId) {
      try {
        const rec = await base44.asServiceRole.entities.FanSubscriber.get(entityId);
        const createdMs = rec?.created_date ? new Date(rec.created_date).getTime() : 0;
        recordOk = !!rec && createdMs > 0 && (Date.now() - createdMs) < 120_000;
      } catch (_e) {
        recordOk = false;
      }
    }
    if (!recordOk) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = data.email || 'Unknown email';
    const name = data.name || '—';
    const source = data.source_slug || 'newsletter';
    const utm = [data.utm_source, data.utm_medium, data.utm_campaign].filter(Boolean).join(' / ') || '—';
    const signedUp = data.signup_date ? new Date(data.signup_date).toLocaleString() : new Date().toLocaleString();

    const { subject: emailSubject, text: intro } = await renderTemplate(base44, 'admin_new_subscriber', {
      email, name, source, utm, signed_up: signedUp,
    });
    const emailBody = brandedEmail({
      title: 'New fan subscriber',
      content: `${textToHtmlParagraphs(intro)}
${detailRows([
  ['Email', email],
  ['Name', name],
  ['Source', source],
  ['UTM', utm],
  ['Signed up', signedUp],
])}`,
      footerNote: 'Manage all subscribers in your admin → Subscribers.',
    });

    const { messageId } = await sendGmail(base44, {
      fromName: 'Roxsan',
      subject: emailSubject,
      body: emailBody,
      html: true,
    });

    return Response.json({ success: true, messageId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});