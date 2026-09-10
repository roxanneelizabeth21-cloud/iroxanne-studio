import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Fired 2 days after a Lead is created. Sends a gentle follow-up nudge
// only if the lead hasn't progressed to a proposal/won/lost.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const leadId = body.lead_id || body.id || body.entity_id;
    if (!leadId) return Response.json({ error: 'Missing lead_id' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) return Response.json({ skipped: true, reason: 'not found' });

    // Only nudge if the lead is still waiting (no proposal sent, not won/lost)
    if (!['new', 'contacted'].includes(lead.status)) {
      return Response.json({ skipped: true, reason: `status is ${lead.status}` });
    }

    if (lead.email) {
      const esc = (v) => String(v == null ? '' : v).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const firstName = (lead.name || '').split(' ')[0] || 'there';
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.email,
        subject: 'Still thinking about your app? — iRoxanne Studio',
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="color:#4A3755;">Hi ${esc(firstName)},</h2>
          <p style="color:#3a3a35;font-size:15px;line-height:1.6;">Just checking in on your project idea. I know how it goes — you're busy running your business and this probably slipped down the list.</p>
          <p style="color:#3a3a35;font-size:15px;line-height:1.6;">If you're still interested, the fastest next step is a quick reply with any questions, or I can put together a rough estimate based on what you told me. No pressure either way.</p>
          <p style="margin-top:18px;"><a href="https://iroxannestudio.com/quote" style="background:#4A3755;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;">Review my request</a></p>
          <p style="color:#8B8B85;font-size:13px;margin-top:24px;">— Roxanne, iRoxanne Studio</p>
        </div>`,
      }).catch((e) => console.log('followup failed', e?.message));
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}