import { sendStudioEmail } from '../../shared/studioEmail.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/marketingAdmin.ts';
import { defaultRequests } from '../../shared/intakeRequests.ts';
import { esc, brandedEmail, brandButton } from '../../shared/emailBrand.ts';

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
}

const APP_ORIGIN = 'https://iroxannestudio.com';

// Admin-only: create a token-protected intake form for a contract and email the
// client a branded link. Reuses an existing intake for the same contract so a
// resend never creates a duplicate.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const { contract_id, mode } = await req.json(); // mode 'prepare' = create/seed checklist only, no email
    if (!contract_id) return Response.json({ error: 'contract_id is required' }, { status: 400 });

    const contract = await base44.entities.Contract.get(contract_id);
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });
    if (!contract.client_email) return Response.json({ error: 'Contract has no client email' }, { status: 400 });

    if (!['signed','deposit_paid','active'].includes(contract.status)) return Response.json({error:'Intake requires a signed, active agreement.'},{status:409});
    const existing = await base44.entities.ClientIntake.filter({ contract_id });
    if(existing.length>1) return Response.json({error:'Multiple intakes are linked to this agreement. Review them before sending.'},{status:409});
    let tier = contract.estimated_tier || 'business';
    if (!['starter', 'business', 'custom'].includes(tier)) tier = 'business';

    const token = generateToken();
    const lead = contract.lead_id ? await base44.entities.Lead.get(contract.lead_id).catch(() => null) : null;
    let intake = existing[0] || await base44.entities.ClientIntake.create({
      requests: defaultRequests(lead || {}, contract),
      contract_id,
      lead_id: contract.lead_id || '',
      access_token: token,
      project_tier: tier,
      status: 'pending',
      client_name: contract.client_name || '',
      client_email: contract.client_email,
      project_title: contract.project_title || '',
      scope_snapshot:{selected_package:contract.selected_package||'',scope_summary:contract.scope_summary||'',line_items:contract.line_items||[]},
    });

    if (!Array.isArray(intake.requests) && ['pending','sent'].includes(intake.status)) {
      intake = await base44.entities.ClientIntake.update(intake.id, { requests: defaultRequests(lead || {}, contract) });
    }
    if (mode === 'prepare') return Response.json({ intake, sent: false, prepared: true });
    const link = `${APP_ORIGIN}/intake/${intake.id}?t=${intake.access_token}`;
    const firstName = (contract.client_name || '').split(' ')[0] || 'there';

    let sent = false;
    try {
      await sendStudioEmail(base44,{
        to: contract.client_email,
        subject: `A few things I need from you — ${contract.project_title || 'your project'}`,
        from_name: 'iRoxanne Studio',
        body: brandedEmail({
          title: `Hi ${esc(firstName)}, a few things I need`,
          content: `<p style="margin:0 0 16px;">To get <strong>${esc(contract.project_title || 'your project')}</strong> started, I've put together a short checklist of what I need from you.</p>
            ${intake.request_note ? `<p style="margin:0 0 16px;">${esc(intake.request_note)}</p>` : ''}
            <p style="margin:0 0 16px;">Some answers are already filled in from our earlier conversation. Just confirm them, add what you have, and skip anything you don't. You can save and come back anytime.</p>
            <p>${brandButton('Open your checklist', link)}</p>`,
          footerNote: 'iRoxanne Studio',
        }),
      });
      sent = true;
      await base44.entities.ClientIntake.update(intake.id, { sent_at: new Date().toISOString(), ...(['pending','sent'].includes(intake.status) ? { status: 'sent' } : {}) });
    } catch (e) {
      console.log('intake email failed', (e as Error)?.message);
    }

    return Response.json({ intake, link, sent });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}