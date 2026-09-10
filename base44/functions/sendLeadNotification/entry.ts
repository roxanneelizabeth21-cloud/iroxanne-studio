import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

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

    // Resolve the admin/studio email
    let adminEmail = '';
    const brand = await base44.asServiceRole.entities.BrandProfile.list().catch(() => []);
    if (brand[0]?.notify_email) adminEmail = brand[0].notify_email;
    if (!adminEmail) {
      const users = await base44.asServiceRole.entities.User.list().catch(() => []);
      const admin = users.find((u) => u.role === 'admin') || users[0];
      adminEmail = admin?.email || '';
    }

    const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const row = (label, val) => val ? `<tr><td style="padding:6px 12px;color:#8B8B85;font-size:13px;vertical-align:top;">${label}</td><td style="padding:6px 12px;font-size:14px;">${esc(val)}</td></tr>` : '';
    const arr = (a) => Array.isArray(a) ? a.join(', ') : (a || '');
    const BUDGET_LABELS = { under_5k:'Under $5,000','5k_10k':'$5,000 – $10,000','10k_20k':'$10,000 – $20,000','20k_50k':'$20,000 – $50,000','50k_plus':'$50,000+',not_sure:'Not sure yet' };
    const PRICING_LABELS = { fixed:'Fixed project price', hourly:'Hourly', not_sure:'Not sure' };

    // 1) Admin notification
    if (adminEmail) {
      const rows = [
        row('Name', lead.name),
        row('Email', lead.email),
        row('Business', lead.business_name),
        row('Budget', lead.budget_range),
        row('Estimated', lead.estimated_price_low != null ? `$${lead.estimated_price_low}–$${lead.estimated_price_high} (${lead.estimated_tier || ''})` : ''),
        row('Pitch', lead.quick_pitch),
      ].join('');
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: adminEmail,
        subject: `New quote request — ${lead.name || lead.email}`,
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="color:#4A3755;margin:0 0 8px;">New quote request</h2>
          <p style="color:#6B6B65;margin:0 0 16px;">A new project inquiry just came in.</p>
          <table style="border-collapse:collapse;background:#F7F5F0;border-radius:10px;overflow:hidden;">${rows}</table>
          <p style="margin-top:18px;"><a href="https://iroxannestudio.base44.app/admin/contracts" style="background:#4A3755;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;">Review in dashboard</a></p>
        </div>`,
      }).catch((e) => console.log('admin notify failed', e?.message));
    }

    // 2) Client welcome — single rich confirmation reflecting what they submitted.
    if (lead.email) {
      const firstName = (lead.name || '').split(' ')[0] || 'there';
      const summary = [
        row('Business', lead.business_name),
        row('What it does', lead.quick_pitch),
        row('The problem', lead.problem_to_solve),
        row('Must-have features', arr(lead.must_have_features)),
        row('Integrations needed', arr(lead.integrations_needed)),
        row('Budget', BUDGET_LABELS[lead.budget_range] || lead.budget_range),
        row('Pricing preference', PRICING_LABELS[lead.pricing_model_preference] || lead.pricing_model_preference),
        row('Ideal launch', lead.ideal_launch_date),
        row('Needs training', lead.training_needed ? 'Yes' : ''),
        row('Wants ongoing support', lead.ongoing_support_needed ? 'Yes' : ''),
      ].join('');
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.email,
        subject: "We've got your project details — iRoxanne Studio",
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#4C2A63 0%,#7A3D5C 50%,#C97064 100%);padding:36px 24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:26px;">Thanks, ${esc(firstName)}!</h1>
          </div>
          <div style="padding:30px 24px;background:#FFFFFF;border:1px solid #ECE6DC;border-top:none;border-radius:0 0 12px 12px;">
            <p style="color:#3a3a35;font-size:15px;line-height:1.6;margin:0 0 16px;">I've received your project details and I'll review them personally — no bots, no agency hand-offs. Expect a reply within 1 business day with next steps and a rough estimate.</p>
            ${summary ? `<p style="margin:0 0 8px;color:#8B8B85;font-size:13px;font-weight:600;">What you told me:</p><table style="width:100%;border-collapse:collapse;background:#F7F5F0;border-left:4px solid #4C2A63;border-radius:8px;overflow:hidden;">${summary}</table>` : ''}
            <p style="margin:22px 0 0;"><a href="https://iroxannestudio.com" style="display:inline-block;background:#4A3755;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-size:14px;">See my work</a></p>
            <p style="color:#8B8B85;font-size:13px;margin-top:24px;">— Roxanne, iRoxanne Studio</p>
          </div>
        </div>`,
      }).catch((e) => console.log('client welcome failed', e?.message));
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}