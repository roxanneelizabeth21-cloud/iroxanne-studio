import { sendStudioEmail } from '../../shared/studioEmail.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/marketingAdmin.ts';
import { esc, brandedEmail, brandButton } from '../../shared/emailBrand.ts';
import { studioUrl } from '../../shared/studioUrl.ts';

import {validateSchedule} from '../../shared/paymentSchedule.ts';

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
}

const getBaseUrl = (req: Request) => studioUrl(req);

// Admin-only: generate the access token, mark the proposal sent, and email the
// client a branded link to the public proposal page.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const { proposal_id } = await req.json();
    if (!proposal_id) return Response.json({ error: 'proposal_id is required' }, { status: 400 });

    let proposal;
    try {
      proposal = await base44.entities.Proposal.get(proposal_id);
    } catch {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }
    if (!proposal.client_email) return Response.json({ error: 'Proposal has no client email' }, { status: 400 });

    if (['accepted', 'declined'].includes(proposal.status)) return Response.json({ error: 'Create a new proposal for a completed response.' }, { status: 409 });
    const settingsList = await base44.entities.PricingSettings.list('-updated_date');
    const settings = settingsList.find((s: any) => s.packages?.length) || settingsList[0];
    const validDays = Math.max(1, Number(settings?.proposal_valid_days) || 3);
    const refresh = ['draft', 'changes_requested', 'expired'].includes(proposal.status) || !proposal.expires_at;
    const expiresAt = refresh ? new Date(Date.now() + validDays * 86400000).toISOString() : proposal.expires_at;
    if (new Date(expiresAt).getTime() <= Date.now()) return Response.json({ error: 'Edit this expired proposal before resending.' }, { status: 409 });
    if (!Number.isFinite(proposal.price_total) || proposal.price_total <= 0 || !Number.isFinite(proposal.deposit_percent) || proposal.deposit_percent < 0 || proposal.deposit_percent > 100) return Response.json({error:'Review proposal pricing and deposit before sending.'},{status:400});
    if (proposal.deposit_amount != null && (!Number.isFinite(proposal.deposit_amount) || proposal.deposit_amount <= 0 || proposal.deposit_amount > proposal.price_total)) return Response.json({error:'Review the deposit amount before proceeding.'},{status:400});
    if(proposal.payment_installments?.length) validateSchedule(proposal.payment_installments,proposal.price_total);
    // Reuse the existing token on resend so old links keep working.
    const token = proposal.access_token || generateToken();
    const updated = await base44.entities.Proposal.update(proposal_id, {
      access_token: token,
      status: 'sent',
      expires_at: expiresAt,
      valid_until: expiresAt.slice(0, 10),
      proposal_number: proposal.proposal_number || 'IR-' + new Date().getFullYear() + '-' + proposal_id.toUpperCase(),
      sent_at: new Date().toISOString(),
    });

    const link = `${getBaseUrl(req)}/proposal/${proposal_id}?t=${token}`;
    const firstName = (proposal.client_name || '').split(' ')[0] || 'there';
    const moneyFmt = (n: unknown) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '');

    let emailed = false;
    try {
      await sendStudioEmail(base44,{
        to: proposal.client_email,
        subject: `Your project proposal — ${proposal.project_title || 'iRoxanne Studio'}`,
        body: brandedEmail({
          title: `Your proposal is ready, ${esc(firstName)}`,
          content: `<p style="margin:0 0 16px;">I've put together a proposal for <strong>${esc(proposal.project_title)}</strong>${proposal.business_name ? ` for ${esc(proposal.business_name)}` : ''} — what I'll build, what it costs, and how we'd work together.</p>
            ${typeof proposal.price_total === 'number' ? `<p style="font-size:20px;font-weight:600;margin:0 0 16px;">Total investment: ${moneyFmt(proposal.price_total)}</p>` : ''}
            ${expiresAt ? `<p style="margin:0 0 16px;color:#8B7B95;font-size:13px;">This proposal is valid through ${esc(new Date(expiresAt).toUTCString())}.</p>` : ''}
            <p style="margin:0 0 20px;">Open it below to review the full scope. If it looks right, you can accept online and I'll send your agreement to sign.</p>
            <p>${brandButton('Review your proposal', link)}</p>
            <p style="margin:16px 0 0;font-size:13px;color:#8B7B95;">This link is private to you — please don't forward it.</p>`,
          footerNote: 'iRoxanne Studio — one builder, not an agency.',
        }),
      });
      emailed = true;
    } catch (e) {
      console.log('proposal email failed', (e as Error)?.message);
    }

    // Move the lead along if this proposal came from one.
    if (proposal.lead_id) {
      await base44.asServiceRole.entities.Lead.update(proposal.lead_id, { status: 'proposal_sent' }).catch(() => {});
    }

    return Response.json({ proposal: updated, link, sent: emailed });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
