import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { esc, resolveAdminEmail, brandedEmail, brandButton } from '../../shared/emailBrand.ts';
import { adminLink } from '../../shared/studioUrl.ts';

// Public, token-verified access for a client to view, accept, or decline
// their proposal. No user auth — the access_token in the link is the credential.
// On acceptance a draft Contract is created (prefilled from the proposal) so
// the admin only has to review and send it for signature.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { id, token, action, decline_reason, change_request } = body || {};
    if (!id || !token) return Response.json({ error: 'Missing proposal id or token' }, { status: 400 });

    let proposal;
    try {
      proposal = await base44.asServiceRole.entities.Proposal.get(id);
    } catch {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }
    if (proposal.access_token !== token) return Response.json({ error: 'Invalid or expired link' }, { status: 403 });

    const now = new Date().toISOString();
    const expiry = proposal.expires_at || proposal.valid_until;
    const expired = expiry && new Date(expiry) <= new Date() &&
      !['accepted', 'declined'].includes(proposal.status);

    // First view: mark viewed for the admin pipeline.
    if (!action) {
      if (proposal.status === 'sent') {
        proposal = await base44.asServiceRole.entities.Proposal.update(id, { status: 'viewed', viewed_at: now });
      }
      return Response.json({ proposal, expired: !!expired });
    }

    if (!['sent', 'viewed', 'changes_requested', 'accepted', 'declined'].includes(proposal.status)) return Response.json({ error: 'This proposal is not open for responses.' }, { status: 409 });
    if (expired) return Response.json({ error: 'This proposal has expired — reach out and I can refresh it for you.' }, { status: 409 });

    if (action === 'request_changes') {
      if (!['sent', 'viewed'].includes(proposal.status)) return Response.json({ error: 'This proposal cannot accept change requests right now.' }, { status: 409 });
      if (typeof change_request !== 'string' || !change_request.trim()) return Response.json({ error: 'Please describe the changes you need.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.Proposal.update(id, { status: 'changes_requested', change_request: change_request.trim().slice(0, 2000), changes_requested_at: now });
      const adminEmail = await resolveAdminEmail(base44).catch(() => '');
      if (adminEmail) await base44.asServiceRole.integrations.Core.SendEmail({
        to: adminEmail, subject: 'Proposal changes requested — ' + updated.project_title,
        html: brandedEmail({ title: 'Changes requested', content: '<p>' + esc(updated.client_name || updated.client_email) + ' requested:</p><p>' + esc(updated.change_request) + '</p>' }),
      }).catch(() => {});
      return Response.json({ proposal: updated });
    }
    if (proposal.status === 'changes_requested') return Response.json({ error: 'Your changes are being reviewed. Please wait for the revised proposal.' }, { status: 409 });
    if (action === 'decline') {
      if (['accepted', 'declined'].includes(proposal.status)) {
        return Response.json({ error: 'This proposal has already been responded to' }, { status: 409 });
      }
      const updated = await base44.asServiceRole.entities.Proposal.update(id, {
        status: 'declined',
        declined_at: now,
        decline_reason: (decline_reason || '').slice(0, 2000),
      });
      if (updated.lead_id) {
        await base44.asServiceRole.entities.Lead.update(updated.lead_id, { status: 'lost' }).catch(() => {});
      }
      const adminEmail = await resolveAdminEmail(base44).catch(() => '');
      if (adminEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          subject: `Proposal declined — ${updated.project_title}`,
          html: brandedEmail({
            title: 'Proposal declined',
            content: `<p style="margin:0 0 16px;"><strong>${esc(updated.client_name || updated.client_email)}</strong> declined the proposal for <strong>${esc(updated.project_title)}</strong>.</p>
              ${updated.decline_reason ? `<p style="margin:0 0 16px;color:#8B7B95;">Reason: ${esc(updated.decline_reason)}</p>` : ''}`,
          }),
        }).catch((e) => console.log('admin decline email failed', (e as Error)?.message));
      }
      return Response.json({ proposal: updated });
    }

    if (action === 'accept') {
      if (proposal.status === 'accepted') {
        return Response.json({ error: 'This proposal has already been accepted' }, { status: 409 });
      }
      if (proposal.status === 'declined') {
        return Response.json({ error: 'This proposal was declined — reach out if you changed your mind.' }, { status: 409 });
      }

      // Create the draft contract prefilled from the proposal.
      const total = typeof proposal.price_total === 'number' ? proposal.price_total : 0;
      const depositPct = typeof proposal.deposit_percent === 'number' ? proposal.deposit_percent : 50;
      const settingsList = await base44.asServiceRole.entities.PricingSettings.list('-updated_date');
      const settings = settingsList.find((s: any) => s.packages?.length) || settingsList[0];
      const previous = await base44.asServiceRole.entities.Contract.filter({proposal_id:id});
      let contractId = proposal.contract_id || previous[0]?.id || '';
      if (!contractId) {
        const contract = await base44.asServiceRole.entities.Contract.create({
          proposal_id: id,
          lead_id: proposal.lead_id || '',
          client_name: proposal.client_name || '',
          client_email: proposal.client_email,
          project_title: proposal.project_title,
          scope_summary: [proposal.scope_summary || '', ...(proposal.deliverables || []).map((d: string) => '• ' + d), proposal.timeline_estimate ? 'Timeline: ' + proposal.timeline_estimate : ''].filter(Boolean).join('\n\n'),
          pricing_mode: 'packages_addons',
          selected_package: proposal.selected_package || '',
          line_items: proposal.line_items || [],
          price_total: total,
          deposit_percent: depositPct,
          deposit_amount: Math.round(total * depositPct) / 100,
          payment_schedule: `${depositPct}% deposit to start, balance on launch`,
          terms: settings?.standard_terms || '',
          status: 'draft',
          estimated_tier: proposal.estimated_tier || '',
        });
        contractId = contract.id;
      }

      const updated = await base44.asServiceRole.entities.Proposal.update(id, {
        status: 'accepted',
        accepted_at: now,
        contract_id: contractId,
      });

      const firstName = (updated.client_name || '').split(' ')[0] || 'there';
      const moneyFmt = (n: unknown) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

      if (updated.client_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: updated.client_email,
          subject: `Proposal accepted — ${updated.project_title}`,
          html: brandedEmail({
            title: `Wonderful, ${esc(firstName)}!`,
            content: `<p style="margin:0 0 16px;">You've accepted the proposal for <strong>${esc(updated.project_title)}</strong>. Next step: I'll prepare your project agreement and send it over for an online signature, followed by your ${esc(String(depositPct))}% deposit to lock in your build slot.</p>
              <p style="margin:0;color:#8B7B95;font-size:13px;">Keep an eye on your inbox — the agreement is usually with you within one business day.</p>`,
            footerNote: 'iRoxanne Studio — one builder, not an agency.',
          }),
        }).catch((e) => console.log('client accept email failed', (e as Error)?.message));
      }

      const adminEmail = await resolveAdminEmail(base44).catch(() => '');
      if (adminEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          subject: `Proposal accepted — ${updated.project_title}`,
          html: brandedEmail({
            title: 'Proposal accepted 🎉',
            content: `<p style="margin:0 0 16px;"><strong>${esc(updated.client_name || updated.client_email)}</strong> accepted the proposal for <strong>${esc(updated.project_title)}</strong> — ${moneyFmt(total)}.</p>
              <p style="margin:0 0 16px;">A draft contract is ready — review it and send for signature.</p>
              <p>${brandButton('Open contracts', adminLink(req, 'contracts'))}</p>`,
          }),
        }).catch((e) => console.log('admin accept email failed', (e as Error)?.message));
      }

      return Response.json({ proposal: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
