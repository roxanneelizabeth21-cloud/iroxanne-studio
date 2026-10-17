import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { sendGmail } from '../../shared/gmail.ts';
import { brandedEmail, detailRows } from '../../shared/emailBrand.ts';
import { renderTemplate, textToHtmlParagraphs } from '../../shared/emailTemplates.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const data = body.data || {};

    // Strip CR/LF from any field that flows into MIME headers to prevent
    // header injection. Body fields are left intact (newlines are valid there).
    const stripCRLF = (v: unknown) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim();

    // --- Authorization gate (this endpoint has a public URL) ---
    // Verify either an authenticated admin OR a real ContactMessage record
    // created within the last 2 minutes that has not yet triggered an alert.
    const user = await base44.auth.me().catch(() => null);
    const isAdmin = user?.role === 'admin';

    const entityId = data.id || body.event?.entity_id;
    let rec: any = null;
    if (entityId) {
      try {
        rec = await base44.asServiceRole.entities.ContactMessage.get(entityId);
      } catch (_e) {
        rec = null;
      }
    }

    const createdMs = rec?.created_date ? new Date(rec.created_date).getTime() : 0;
    const alreadyNotified = String(rec?.description || '').startsWith('notified:');
    const recordOk = !!rec && !alreadyNotified && createdMs > 0 && (Date.now() - createdMs) < 120_000;

    if (!isAdmin && !recordOk) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (rec?.id && !alreadyNotified) {
      await base44.asServiceRole.entities.ContactMessage.update(rec.id, {
        description: `notified:${new Date().toISOString()}`,
      }).catch(() => {});
    }

    const sourceData = rec || data;
    const name = stripCRLF(sourceData.name) || 'Unknown';
    const email = stripCRLF(sourceData.email) || 'No email provided';
    const phone = stripCRLF(sourceData.phone) || '';
    const bestTime = stripCRLF(sourceData.best_time_to_contact) || '';
    const inquiryType = stripCRLF(sourceData.inquiry_type) || 'general';
    const subject = stripCRLF(sourceData.subject) || '(No subject)';
    const message = sourceData.message || '(No message)';
    const createdAt = sourceData.created_date ? new Date(sourceData.created_date).toLocaleString() : new Date().toLocaleString();

    const escapeHtml = (v: string) =>
      String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const { subject: emailSubject, text: intro } = await renderTemplate(base44, 'admin_new_inquiry', {
      name, email, inquiry_type: inquiryType, message_subject: subject, submitted: createdAt,
    });
    const emailBody = brandedEmail({
      title: 'New inquiry',
      content: `${textToHtmlParagraphs(escapeHtml(intro))}
${detailRows([
  ['Name', escapeHtml(name)],
  ['Email', escapeHtml(email)],
  ['Phone', escapeHtml(phone)],
  ['Best time to contact', escapeHtml(bestTime)],
  ['Inquiry Type', escapeHtml(inquiryType)],
  ['Subject', escapeHtml(subject)],
  ['Submitted', createdAt],
])}
<p style="margin:22px 0 8px;color:#8B7B95;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
<div style="white-space:pre-wrap;background:#F5EFF8;border-radius:10px;padding:16px;">${escapeHtml(message)}</div>`,
      footerNote: `Reply directly to this email to respond to ${escapeHtml(name)}.`,
    });

    const { messageId } = await sendGmail(base44, {
      fromName: 'iRoxanne Studio',
      subject: emailSubject,
      body: emailBody,
      replyTo: email,
      html: true,
    });

    return Response.json({ success: true, messageId });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}