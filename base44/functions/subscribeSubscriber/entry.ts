import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { FROM_NAME, unsubscribeUrl, generateUnsubscribeToken, SITE_URL } from '../../shared/subscriberEmail.ts';
import { renderTemplate, subscriberEmailHtml } from '../../shared/emailTemplates.ts';

const enc = new TextEncoder();
const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (text: string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text))));

// Public subscriber-capture endpoint with server-side rate limiting and double opt-in
// confirmation before sending any welcome email to unverified addresses.
async function sendWelcome(base44: any, email: string, name: string | undefined, recordId: string, token: string): Promise<boolean> {
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
      body: subscriberEmailHtml(text, unsubscribeUrl(email, token)),
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
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = (body?.email || '').toString().trim().toLowerCase();
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'A valid email is required' }, { status: 400 });
    }

    // Per-IP and global daily rate limit against subscriber flooding / mail-bombing
    const nowMs = Date.now();
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    const ipTag = `ip:${(await sha256(new Date(nowMs).toISOString().slice(0, 10) + ':' + ip)).slice(0, 24)}`;
    const recentSubs = await base44.asServiceRole.entities.Subscriber.list('-created_date', 100).catch(() => []);
    const lastDaySubs = (recentSubs || []).filter((r: any) => nowMs - Date.parse(r.created_date || '') < 86_400_000);
    if (lastDaySubs.length >= 50) {
      return Response.json({ error: 'Too many signup requests today. Please try again tomorrow.' }, { status: 429 });
    }
    const lastHourFromIp = lastDaySubs.filter(
      (r: any) => nowMs - Date.parse(r.created_date || '') < 3_600_000 && String(r.description || '').includes(ipTag)
    );
    if (lastHourFromIp.length >= 3) {
      return Response.json({ error: 'Too many signup requests. Please try again later.' }, { status: 429 });
    }

    const clean = (v: unknown, max = 120) => (typeof v === 'string' ? v.replace(/[\r\n<>]/g, '').trim().slice(0, max) : undefined);
    const name = clean(body?.name, 100);
    const source_slug = clean(body?.source_slug, 80) || 'newsletter';
    const utm_source = clean(body?.utm_source, 100);
    const utm_medium = clean(body?.utm_medium, 100);
    const utm_campaign = clean(body?.utm_campaign, 100);

    // Check whether caller proved ownership via a verified QuoteEmailVerification token or admin session
    const actor = await base44.auth.me().catch(() => null);
    let confirmedOptIn = actor?.role === 'admin';
    if (!confirmedOptIn && body?.verification_id && typeof body?.verification_secret === 'string') {
      const ver = await base44.asServiceRole.entities.QuoteEmailVerification.get(String(body.verification_id)).catch(() => null);
      if (
        ver &&
        ver.email === email &&
        ver.verified_until &&
        Date.parse(ver.verified_until) > nowMs &&
        ver.secret_hash === (await sha256(body.verification_secret))
      ) {
        confirmedOptIn = true;
      }
    }

    // Dedupe: update existing subscriber's source/UTMs rather than creating a dup.
    const existing = await base44.asServiceRole.entities.Subscriber.filter({ email });
    if (existing.length > 0) {
      const prev = existing[0];
      const unsubscribe_token = prev.unsubscribe_token || generateUnsubscribeToken();
      const updated = await base44.asServiceRole.entities.Subscriber.update(prev.id, {
        source_slug: source_slug || prev.source_slug,
        utm_source: utm_source || prev.utm_source,
        utm_medium: utm_medium || prev.utm_medium,
        utm_campaign: utm_campaign || prev.utm_campaign,
        unsubscribe_token,
      });
      let welcome_sent = false;
      if (confirmedOptIn && !prev.welcome_sent_at && prev.status !== 'unsubscribed') {
        welcome_sent = await sendWelcome(base44, email, name || prev.name, prev.id, unsubscribe_token);
      }
      return Response.json({ created: false, record: { id: updated.id, status: updated.status }, welcome_sent });
    }

    const now = new Date(nowMs).toISOString();
    const unsubscribe_token = generateUnsubscribeToken();
    const record = await base44.asServiceRole.entities.Subscriber.create({
      email,
      name,
      source_slug,
      utm_source,
      utm_medium,
      utm_campaign,
      status: 'active',
      unsubscribe_token,
      signup_date: now,
      consent_timestamp: now,
      description: ipTag,
    });
    const welcome_sent = confirmedOptIn ? await sendWelcome(base44, email, name, record.id, unsubscribe_token) : false;

    return Response.json({ created: true, record: { id: record.id, status: record.status }, welcome_sent });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}