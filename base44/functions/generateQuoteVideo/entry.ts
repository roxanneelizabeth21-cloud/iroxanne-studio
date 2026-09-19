import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendStudioEmail } from '../../shared/studioEmail.ts';
import { esc, brandedEmail, brandButton } from '../../shared/emailBrand.ts';

// Pre-generated welcome video — no HeyGen API calls needed.
const QUOTE_WELCOME_VIDEO_URL = 'https://media.base44.com/videos/public/6a94dbc673f0d144b6ed36bb/24c961373_QuoteReceivedWelcome_720p.mp4';

// Called after a new quote request is submitted. Sends the pre-generated
// welcome video to the lead and marks the lead so duplicates are skipped.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { lead_id } = body || {};
    if (!lead_id) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    // Idempotent — skip if already sent.
    if (lead.quote_video_status === 'sent') {
      return Response.json({ ok: true, status: 'already_sent' });
    }

    if (!lead.email) {
      return Response.json({ error: 'Lead has no email address' }, { status: 400 });
    }

    const firstName = (lead.name || '').split(' ')[0] || 'there';
    const projectTitle = lead.quick_pitch?.slice(0, 80) || lead.business_name || 'your project';

    await sendStudioEmail(base44, {
      to: lead.email,
      subject: 'A personal welcome from Roxanne — iRoxanne Studio',
      body: brandedEmail({
        title: 'Thanks for reaching out, ' + esc(firstName) + '.',
        content: '<p style="margin:0 0 16px;">I just received your quote request for <strong>' + esc(projectTitle) + '</strong>. I wanted to personally welcome you and let you know what happens next.</p>' +
          '<p style="margin:0 0 16px;">' + brandButton('Watch my welcome video', QUOTE_WELCOME_VIDEO_URL) + '</p>' +
          '<p style="margin:0 0 16px;color:#8B7B95;font-size:13px;">I\'ll review your details and follow up with a personalized quote shortly. Talk soon!</p>' +
          '<p style="margin:0;color:#8B7B95;font-size:13px;">— Roxanne, iRoxanne Studio</p>',
        footerNote: 'iRoxanne Studio — one builder, not an agency.',
      }),
    });

    await base44.asServiceRole.entities.Lead.update(lead_id, {
      quote_video_url: QUOTE_WELCOME_VIDEO_URL,
      quote_video_status: 'sent',
      quote_video_sent_at: new Date().toISOString(),
    });

    return Response.json({ ok: true, status: 'sent' });
  } catch (error) {
    console.error('generateQuoteVideo error', error?.message || error);
    return Response.json({ error: String(error?.message || error || 'Server error') }, { status: 500 });
  }
}