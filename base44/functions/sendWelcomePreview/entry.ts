import { createClientFromRequest } from 'npm:@base44/sdk@0.8.0';
import { FROM_NAME, unsubscribeUrl, SITE_URL } from '../../shared/fanEmail.ts';
import { renderTemplate, fanEmailHtml } from '../../shared/emailTemplates.ts';

// Admin-only: sends the fan welcome email to a chosen address so the admin can
// preview exactly what a new subscriber receives. Creates no subscriber record.
// Copy comes from the admin-editable "Fan Welcome / Confirmation" template.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admins only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const to = (body.to || user.email || '').trim();
  if (!to) return Response.json({ error: 'No recipient' }, { status: 400 });

  const { subject, text } = await renderTemplate(base44, 'fan_welcome', {
    fan_name: body.name || user.full_name || 'there',
    email: to,
    site_url: SITE_URL,
    music_url: `${SITE_URL}/music`,
  });

  await base44.asServiceRole.integrations.Core.SendEmail({
    from_name: FROM_NAME,
    to,
    subject: `[Preview] ${subject}`,
    body: fanEmailHtml(text, unsubscribeUrl(to)),
  });

  return Response.json({ sent: true, to });
});