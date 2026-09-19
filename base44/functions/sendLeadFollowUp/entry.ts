import { requireAuthenticated } from '../../shared/marketingAdmin.ts';
import { sendStudioEmail } from '../../shared/studioEmail.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { esc, brandedEmail, brandButton } from '../../shared/emailBrand.ts';

// Fired 2 days after a Lead is created. Sends a gentle follow-up nudge
// only if the lead hasn't progressed to a proposal/won/lost.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard=await requireAuthenticated(base44);
    if(!guard.ok)return guard.response;
    const body = await req.json().catch(() => ({}));
    const leadId = body.lead_id || body.id || body.entity_id;
    if (!leadId) return Response.json({ error: 'Missing lead_id' }, { status: 400 });

    let lead;
    try {
      lead = await base44.asServiceRole.entities.Lead.get(leadId);
    } catch {
      return Response.json({ skipped: true, reason: 'not found' });
    }

    if(lead.is_test_record)return Response.json({skipped:true,reason:'test record'});
    // Only nudge if the lead is still waiting (no proposal sent, not won/lost)
    if (!['new', 'contacted'].includes(lead.status)) {
      return Response.json({ skipped: true, reason: `status is ${lead.status}` });
    }

    if (lead.email) {
      const firstName = (lead.name || '').split(' ')[0] || 'there';
      await sendStudioEmail(base44,{
        to: lead.email,
        subject: 'Still thinking about your app? — iRoxanne Studio',
        body: brandedEmail({
          title: `Hi ${esc(firstName)},`,
          content: `<p style="margin:0 0 16px;">Just checking in on your project idea. I know how it goes — you're busy running your business and this probably slipped down the list.</p>
            <p style="margin:0 0 16px;">If you're still interested, the fastest next step is a quick reply with any questions, or I can put together a rough estimate based on what you told me. No pressure either way.</p>
            <p style="margin:18px 0 0;">${brandButton('Review my request', 'https://iroxannestudio.com/quote')}</p>
            <p style="margin:24px 0 0;font-size:13px;">— Roxanne, iRoxanne Studio</p>`,
          footerNote: 'iRoxanne Studio — one builder, not an agency.',
        }),
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}