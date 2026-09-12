import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/marketingAdmin.ts';
import { esc, brandedEmail, brandButton } from '../../shared/emailBrand.ts';

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
}

const APP_ORIGIN = 'https://iroxannestudio.base44.app';

// Admin-only: create a token-protected intake form for a contract and email the
// client a branded link. Reuses an existing intake for the same contract so a
// resend never creates a duplicate.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const { contract_id } = await req.json();
    if (!contract_id) return Response.json({ error: 'contract_id is required' }, { status: 400 });

    const contract = await base44.entities.Contract.get(contract_id);
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });
    if (!contract.client_email) return Response.json({ error: 'Contract has no client email' }, { status: 400 });

    const existing = await base44.entities.ClientIntake.filter({ contract_id }).catch(() => []);
    if (existing && existing.length > 0) {
      const link = `${APP_ORIGIN}/intake/${existing[0].id}?t=${existing[0].access_token}`;
      return Response.json({ intake: existing[0], link, existing: true });
    }

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
      client_email: contract.client_email,
      project_title: contract.project_title || '',
    });

    const link = `${APP_ORIGIN}/intake/${intake.id}?t=${token}`;
    const firstName = (contract.client_name || '').split(' ')[0] || 'there';

    let sent = false;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: contract.client_email,
        subject: `Content intake — ${contract.project_title || 'your project'}`,
        html: brandedEmail({
          title: `Let's get started, ${esc(firstName)}!`,
          content: `<p style="margin:0 0 16px;">Your project <strong>${esc(contract.project_title || 'your app')}</strong> is ready to begin. To build it as fast and accurately as possible, I need your content — text, images, documents, and details about how your business works.</p>
            <p style="margin:0 0 16px;">I've set up a form organized by page. Fill in what you can, upload your files, and save your progress anytime. The more you provide upfront, the faster I can deliver.</p>
            <p>${brandButton('Fill out your intake form', link)}</p>
            <p style="margin:16px 0 0;font-size:13px;color:#8B7B95;">You can save and return to this form anytime using the same link.</p>`,
          footerNote: 'iRoxanne Studio — one builder, not an agency.',
        }),
      });
      sent = true;
    } catch (e) {
      console.log('intake email failed', (e as Error)?.message);
    }

    return Response.json({ intake, link, sent });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}