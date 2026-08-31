import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { sendGmail } from '../../shared/gmail.ts';
import { brandedEmail, detailRows } from '../../shared/emailBrand.ts';
import { renderTemplate, textToHtmlParagraphs } from '../../shared/emailTemplates.ts';
import { secrets } from 'base44:runtime';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const data = body.data || {};

    // Strip CR/LF from any field that flows into MIME headers to prevent
    // header injection. Body fields are left intact (newlines are valid there).
    const stripCRLF = (v: unknown) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim();
    const name = stripCRLF(data.name) || 'Unknown';
    const email = stripCRLF(data.email) || 'No email provided';
    const inquiryType = stripCRLF(data.inquiry_type) || 'general';
    const subject = stripCRLF(data.subject) || '(No subject)';
    const message = data.message || '(No message)';
    const createdAt = data.created_date ? new Date(data.created_date).toLocaleString() : new Date().toLocaleString();

    // --- Authorization gate (this endpoint has a public URL) ---
    // The app is public, so there is no signed-in user to check. Accept a call
    // only if it presents the shared secret, OR if it is the platform's
    // ContactMessage entity automation — verified by the payload referencing a
    // real ContactMessage record created within the last 2 minutes. Anonymous
    // direct calls (no secret, no fresh real record) are rejected.
    const sharedSecret = secrets.get('CONTACT_NOTIFY_SECRET');
    const callerSecret = stripCRLF(body.secret || req.headers.get('x-contact-secret') || '');
    const secretOk = !!sharedSecret && !!callerSecret && callerSecret === sharedSecret;

    let recordOk = false;
    if (!secretOk) {
      const entityId = data.id || body.event?.entity_id;
      if (entityId) {
        try {
          const rec = await base44.asServiceRole.entities.ContactMessage.get(entityId);
          const createdMs = rec?.created_date ? new Date(rec.created_date).getTime() : 0;
          recordOk = !!rec && createdMs > 0 && (Date.now() - createdMs) < 120_000;
        } catch (_e) {
          recordOk = false;
        }
      }
    }

    if (!secretOk && !recordOk) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // --- end gate ---

    const escapeHtml = (v: string) =>
      String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const { subject: emailSubject, text: intro } = await renderTemplate(base44, 'admin_new_inquiry', {
      name, email, inquiry_type: inquiryType, message_subject: subject, submitted: createdAt,
    });
    // The intro can contain merge fields fed by a public form, so escape it.
    const emailBody = brandedEmail({
      title: 'New fan inquiry',
      content: `${textToHtmlParagraphs(escapeHtml(intro))}
${detailRows([
  ['Name', escapeHtml(name)],
  ['Email', escapeHtml(email)],
  ['Inquiry Type', escapeHtml(inquiryType)],
  ['Subject', escapeHtml(subject)],
  ['Submitted', createdAt],
])}
<p style="margin:22px 0 8px;color:#8B8B85;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
<div style="white-space:pre-wrap;background:#F7F5F0;border-radius:10px;padding:16px;">${escapeHtml(message)}</div>`,
      footerNote: `Reply directly to this email to respond to ${escapeHtml(name)}.`,
    });

    const { messageId } = await sendGmail(base44, {
      fromName: 'Roxsan',
      subject: emailSubject,
      body: emailBody,
      replyTo: email,
      html: true,
    });

    return Response.json({ success: true, messageId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});