import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { sendGmail } from '../../shared/gmail.ts';
import { brandedEmail, detailRows, esc } from '../../shared/emailBrand.ts';
import { renderTemplate, textToHtmlParagraphs } from '../../shared/emailTemplates.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const data = body.data || body;
    const entityId = data.id || body.event?.entity_id;
    const rec = entityId ? await base44.entities.Subscriber.get(entityId).catch(() => null) : null;
    const sourceData = rec || data;

    const email = sourceData.email || 'Unknown email';
    const name = sourceData.name || '—';
    const source = sourceData.source_slug || 'newsletter';
    const utm = [sourceData.utm_source, sourceData.utm_medium, sourceData.utm_campaign].filter(Boolean).join(' / ') || '—';
    const signedUp = sourceData.signup_date ? new Date(sourceData.signup_date).toLocaleString() : new Date().toLocaleString();

    const { subject: emailSubject, text: intro } = await renderTemplate(base44, 'admin_new_subscriber', {
      email, name, source, utm, signed_up: signedUp,
    });
    const emailBody = brandedEmail({
      title: 'New subscriber',
      content: `${textToHtmlParagraphs(esc(intro))}
${detailRows([
  ['Email', esc(email)],
  ['Name', esc(name)],
  ['Source', esc(source)],
  ['UTM', esc(utm)],
  ['Signed up', esc(signedUp)],
])}`,
      footerNote: 'Manage all subscribers in your admin → Subscribers.',
    });

    const { messageId } = await sendGmail(base44, {
      fromName: 'iRoxanne Studio',
      subject: emailSubject,
      body: emailBody,
      html: true,
    });

    return Response.json({ success: true, messageId });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}