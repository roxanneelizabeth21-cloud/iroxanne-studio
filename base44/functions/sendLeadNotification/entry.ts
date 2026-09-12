import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { esc, resolveAdminEmail, brandedEmail, brandButton, detailRows } from '../../shared/emailBrand.ts';

// Fired immediately when a new Lead is created.
// 1) Notifies the studio admin with the lead's details.
// 2) Sends a warm welcome email to the client.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const leadId = body.lead_id || body.id || body.entity_id;
    if (!leadId) return Response.json({ error: 'Missing lead_id' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    const adminEmail = await resolveAdminEmail(base44).catch(() => '');
    const arr = (a) => Array.isArray(a) ? a.join(', ') : (a || '');
    const BUDGET_LABELS = { under_1500:'Under $1,500','1500_3000':'$1,500–$3,000','3000_5000':'$3,000–$5,000','5000_8000':'$5,000–$8,000','8000_plus':'$8,000+',not_sure:'Not sure yet' };
    const PRICING_LABELS = { fixed:'Fixed project price', hourly:'Hourly', not_sure:'Not sure' };
    const budgetLabel = (v) => BUDGET_LABELS[v] || v || '';

    // 1) Admin notification
    if (adminEmail) {
      const rows: [string, string][] = [
        ['Name', lead.name || ''],
        ['Email', lead.email || ''],
        ['Business', lead.business_name || ''],
        ['Budget', budgetLabel(lead.budget_range)],
        ['Estimated', lead.estimated_price_low != null ? `$${lead.estimated_price_low}–$${lead.estimated_price_high} (${lead.estimated_tier || ''})` : ''],
        ['Pitch', lead.quick_pitch || ''],
      ].filter(([, v]) => v);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: adminEmail,
        subject: `New quote request: ${lead.name || lead.email}`,
        html: brandedEmail({
          title: 'New quote request',
          content: `<p style="margin:0 0 16px;">A new project inquiry just came in.</p>${detailRows(rows)}<p style="margin:18px 0 0;">${brandButton('Review in dashboard', 'https://iroxannestudio.base44.app/admin/contracts')}</p>`,
          footerNote: 'iRoxanne Studio, one builder, not an agency.',
        }),
      }).catch((e) => console.log('admin notify failed', e?.message));
    }

    const callSettings=await base44.asServiceRole.entities.CallSettings.list('-updated_date',1).catch(()=>[]);
    const bookingLink=callSettings[0]?.enabled && lead.booking_token ? 'https://iroxannestudio.base44.app/book-call?lead='+encodeURIComponent(lead.id)+'&t='+encodeURIComponent(lead.booking_token) : '';
    // 2) Client welcome: single rich confirmation reflecting what they submitted.
    if (lead.email) {
      const firstName = (lead.name || '').split(' ')[0] || 'there';
      const summary: [string, string][] = [
        ['Business', lead.business_name || ''],
        ['What it does', lead.quick_pitch || ''],
        ['The problem', lead.problem_to_solve || ''],
        ['Must-have features', arr(lead.must_have_features)],
        ['Integrations needed', arr(lead.integrations_needed)],
        ['Budget', budgetLabel(lead.budget_range)],
        ['Pricing preference', PRICING_LABELS[lead.pricing_model_preference] || lead.pricing_model_preference || ''],
        ['Ideal launch', lead.ideal_launch_date || ''],
        ['Needs training', lead.training_needed ? 'Yes' : ''],
        ['Wants ongoing support', lead.ongoing_support_needed ? 'Yes' : ''],
      ].filter(([, v]) => v);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.email,
        subject: "We've got your project details — iRoxanne Studio",
        html: brandedEmail({
          title: `Thanks, ${esc(firstName)}!`,
          content: `<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:#2D2A4A;">Thanks, ${esc(firstName)}!</h1><p style="margin:0 0 16px;">I've received your project details and I'll review them personally — no bots, no agency hand-offs. Expect a reply within 1 business day with next steps and a rough estimate.</p>
            ${summary.length ? `<p style="margin:0 0 8px;font-size:13px;font-weight:600;">What you told me:</p>${detailRows(summary)}` : ''}
            ${bookingLink ? '<p style="margin:20px 0 8px;">If a conversation would help, choose an available time for an optional call.</p><p>'+brandButton('Schedule an optional call',bookingLink)+'</p>' : ''}
            <p style="margin:22px 0 0;">${brandButton('See my work', 'https://iroxannestudio.com')}</p>
            <p style="margin:24px 0 0;font-size:13px;">— Roxanne, iRoxanne Studio</p>`,
          footerNote: 'iRoxanne Studio, one builder, not an agency.',
        }),
      }).catch((e) => console.log('client welcome failed', e?.message));
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}