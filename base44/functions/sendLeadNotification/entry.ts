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

    // 2) Client welcome
    if (lead.email) {
      const firstName = (lead.name || '').split(' ')[0] || 'there';
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.email,
        subject: 'Thanks for your request — iRoxanne Studio',
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="color:#4A3755;">Hi ${esc(firstName)},</h2>
          <p style="color:#3a3a35;font-size:15px;line-height:1.6;">Thanks for reaching out to iRoxanne Studio! I received your project details and I'll review them personally — no bots, no agency hand-offs.</p>
          <p style="color:#3a3a35;font-size:15px;line-height:1.6;">Expect a personal reply within 1 business day with next steps and a rough estimate. In the meantime, feel free to browse some of the apps I've built.</p>
          <p style="margin-top:18px;"><a href="https://iroxannestudio.com" style="background:#4A3755;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;">See my work</a></p>
          <p style="color:#8B8B85;font-size:13px;margin-top:24px;">— Roxanne, iRoxanne Studio</p>
        </div>`,
      }).catch((e) => console.log('client welcome failed', e?.message));
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}