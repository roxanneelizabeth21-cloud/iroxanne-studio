import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { FROM_NAME, unsubscribeUrl, SITE_URL } from '../../shared/subscriberEmail.ts';
import { renderTemplate, subscriberEmailHtml } from '../../shared/emailTemplates.ts';

// Public subscriber-capture endpoint. Runs as service role to bypass the
// admin-only read/update RLS on Subscriber — so anonymous visitors still get
// true dedupe (existing record updated, not a duplicate created).
// Sends the branded welcome email and stamps welcome_sent_at on success, so a
// later signup on a different page doesn't send it twice. A send failure must
// never fail the signup itself.
async function sendWelcome(base44: any, email: string, name: string | undefined, recordId: string): Promise<boolean> {
  try {
    const { subject, text } = await renderTemplate(base44, 'fan_welcome', {
      fan_name: name || 'there',
      email,
      site_url: SITE_URL,
    });
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: FROM_NAME,
      to: email,
      subject,
      body: subscriberEmailHtml(text, unsubscribeUrl(email)),
    });
    await base44.asServiceRole.entities.Subscriber.update(recordId, { welcome_sent_at: new Date().toISOString() });
    return true;
  } catch (e) {
    console.error('Welcome email failed', (e as Error).message);
    return false;
  }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = (body?.email || '').toString().trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const name = body?.name ? body.name.toString().trim() : undefined;
    const source_slug = body?.source_slug ? body.source_slug.toString() : 'newsletter';
    const utm_source = body?.utm_source ? body.utm_source.toString() : undefined;
    const utm_medium = body?.utm_medium ? body.utm_medium.toString() : undefined;
    const utm_campaign = body?.utm_campaign ? body.utm_campaign.toString() : undefined;

    // Dedupe: update existing subscriber's source/UTMs rather than creating a dup.
    const existing = await base44.asServiceRole.entities.Subscriber.filter({ email });
    if (existing.length > 0) {
      const prev = existing[0];
      const updated = await base44.asServiceRole.entities.Subscriber.update(prev.id, {
        source_slug: source_slug || prev.source_slug,
        utm_source: utm_source || prev.utm_source,
        utm_medium: utm_medium || prev.utm_medium,
        utm_campaign: utm_campaign || prev.utm_campaign,
      });
      // A deduped signup still deserves the welcome email when the first one
      // never went out (send failed, or the record predates welcome emails).
      // Never re-send to someone who already got it, or who unsubscribed.
      let welcome_sent = false;
      if (!prev.welcome_sent_at && prev.status !== 'unsubscribed') {
        welcome_sent = await sendWelcome(base44, email, name || prev.name, prev.id);
      }
      return Response.json({ created: false, record: updated, welcome_sent });
    }

    const now = new Date().toISOString();
    const record = await base44.asServiceRole.entities.Subscriber.create({
      email,
      name,
      source_slug,
      utm_source,
      utm_medium,
      utm_campaign,
      status: 'active',
      signup_date: now,
      consent_timestamp: now,
    });
    const welcome_sent = await sendWelcome(base44, email, name, record.id);

    return Response.json({ created: true, record, welcome_sent });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}