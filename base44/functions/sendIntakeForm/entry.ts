import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireAdmin } from '../../shared/marketingAdmin.ts';

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 48; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const { contract_id } = await req.json();
    if (!contract_id) return Response.json({ error: 'contract_id is required' }, { status: 400 });

    // Load the contract
    const contract = await base44.entities.Contract.get(contract_id);
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

    // Check if an intake already exists for this contract
    const existing = (await base44.entities.ClientIntake.list()).filter((i) => i.contract_id === contract_id);
    if (existing.length > 0) {
      const link = `${getBaseUrl(req)}/intake/${existing[0].id}?t=${existing[0].access_token}`;
      return Response.json({ intake: existing[0], link, existing: true });
    }

    // Determine tier from contract or lead
    let tier = contract.estimated_tier || 'business';
    if (!['starter', 'business', 'custom'].includes(tier)) tier = 'business';

    const token = generateToken();

    const intake = await base44.entities.ClientIntake.create({
      contract_id,
      lead_id: contract.lead_id || '',
      access_token: token,
      project_tier: tier,
      status: 'pending',
      client_name: contract.client_name || '',
      client_email: contract.client_email || '',
      project_title: contract.project_title || '',
    });

    const link = `${getBaseUrl(req)}/intake/${intake.id}?t=${token}`;

    // Send email to client
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        <div style="background: linear-gradient(135deg, #2D2A4A 0%, #4A3F6B 100%); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
          <h1 style="color: #fff; font-size: 22px; margin: 0 0 8px;">Let's get started, ${contract.client_name?.split(' ')[0] || 'there'}!</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Your project <strong style="color: #C9A84C;">${contract.project_title || ''}</strong> is ready to begin.</p>
        </div>
        <p style="color: #333; font-size: 14px; line-height: 1.6;">
          To build your app as fast and accurately as possible, I need your content — text, images, documents, and details about how your business works.
        </p>
        <p style="color: #333; font-size: 14px; line-height: 1.6;">
          I've set up a form organized by page. Fill in what you can, upload your files, and save your progress anytime. The more you provide upfront, the faster I can deliver.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${link}" style="display: inline-block; background: #6D28D9; color: #fff; font-weight: 600; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px;">Fill Out Your Intake Form</a>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">You can save and return to this form anytime using the same link.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; text-align: center;">iRoxanne Studio</p>
      </div>
    `;

    await base44.integrations.Core.SendEmail({
      recipients: [contract.client_email],
      subject: `Content Intake — ${contract.project_title || 'Your Project'}`,
      body_html: emailHtml,
    });

    return Response.json({ intake, link, sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function getBaseUrl(req) {
  const url = new URL(req.url);
  // In Base44 preview/production the app URL is the origin
  return url.origin.includes('base44') ? url.origin : 'https://iroxanne.com';
}
