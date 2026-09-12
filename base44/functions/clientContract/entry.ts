import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { esc, resolveAdminEmail, brandedEmail, brandButton } from '../../shared/emailBrand.ts';

import { validateSignature } from '../../shared/studioDelivery.ts';

// Public, token-verified access for a client to view and e-sign their contract.
// No user auth — the access_token in the contract link is the credential.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { id, token, action, signerName, consent, signatureMode = 'typed', signatureImage } = body || {};
    if (!id || !token) return Response.json({ error: 'Missing contract id or token' }, { status: 400 });

    let contract;
    try {
      contract = await base44.asServiceRole.entities.Contract.get(id);
    } catch {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }
    const publicContract = (c) => Object.fromEntries(Object.entries(c).filter(([k]) => !k.startsWith('handoff_') && !['signer_ip','signer_user_agent'].includes(k)));
    if (contract.access_token !== token) return Response.json({ error: 'Invalid or expired link' }, { status: 403 });

    if (action === 'sign') {
      if (contract.status !== 'sent') return Response.json({ error: 'This agreement is not open for signature.' }, { status: 409 });
      if (consent !== true) return Response.json({ error: 'Please confirm your agreement to sign electronically.' }, { status: 400 });
      if (!validateSignature(signatureMode, signatureImage)) return Response.json({error:'Please draw your signature or choose typed signature.'},{status:400});
      if (typeof signerName !== 'string' || !signerName.trim()) return Response.json({ error: 'Please type your full name to sign' }, { status: 400 });
      if (['signed', 'deposit_paid', 'active', 'completed'].includes(contract.status)) {
        return Response.json({ error: 'This contract has already been signed' }, { status: 409 });
      }
      const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
      const updated = await base44.asServiceRole.entities.Contract.update(id, {
        status: 'signed',
        signed_at: new Date().toISOString(),
        signer_name: signerName.trim().slice(0,200),
        signature_mode: signatureMode,
        signature_image: signatureMode === 'drawn' ? signatureImage : '',
        signer_ip: ip,
        signature_consent: true,
        signer_user_agent: (req.headers.get('user-agent') || '').slice(0, 1000)
      });

      // Post-sign: create an invoice (deposit + balance tracking) and notify
      // the client + admin. Payments aren't wired yet — Stripe is the last
      // piece — so the invoice is created pending and updated once a gateway
      // is connected or the deposit is recorded offline.
      const moneyFmt = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');
      const total = typeof updated.price_total === 'number' ? updated.price_total : 0;
      const deposit = typeof updated.deposit_amount === 'number' ? updated.deposit_amount : 0;

      try {
        const existing = await base44.asServiceRole.entities.Invoice.filter({ contract_id: id }).catch(() => []);
        if (!existing || existing.length === 0) {
          await base44.asServiceRole.entities.Invoice.create({
            contract_id: id,
            client_name: updated.client_name || '',
            client_email: updated.client_email,
            project_title: updated.project_title,
            amount_total: total,
            deposit_amount: deposit,
            deposit_status: deposit > 0 ? 'pending' : 'waived',
            balance_amount: Math.max(total - deposit, 0),
            balance_status: total - deposit > 0 ? 'pending' : 'waived',
            status: 'open',
          }).catch((e) => console.log('invoice create failed', e?.message));
        }
      } catch (e) { console.log('invoice step failed', e?.message); }

      const firstName = (updated.signer_name || updated.client_name || '').split(' ')[0] || 'there';

      if (updated.client_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: updated.client_email,
          subject: 'Agreement signed — iRoxanne Studio',
          html: brandedEmail({
            title: `You're all signed in, ${esc(firstName)}!`,
            content: `<p style="margin:0 0 16px;">Your project agreement for <strong>${esc(updated.project_title)}</strong> is signed and on file. I'm excited to get started.</p>
              <p style="margin:0 0 8px;">Next step is your deposit to lock in your build slot:</p>
              <p style="font-size:20px;font-weight:600;margin:0 0 16px;">Deposit due: ${moneyFmt(deposit)}</p>
              <p style="margin:0 0 16px;color:#8B7B95;font-size:13px;">I'll send your payment link shortly. Remaining balance of ${moneyFmt(Math.max(total - deposit, 0))} is due per your agreed schedule.</p>`,
            footerNote: 'iRoxanne Studio — one builder, not an agency.',
          }),
        }).catch((e) => console.log('client sign email failed', e?.message));
      }

      const adminEmail = await resolveAdminEmail(base44).catch(() => '');
      if (adminEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: adminEmail,
          subject: `Contract signed — ${updated.project_title}`,
          html: brandedEmail({
            title: 'Contract signed',
            content: `<p style="margin:0 0 16px;"><strong>${esc(updated.signer_name)}</strong> just signed the agreement for <strong>${esc(updated.project_title)}</strong>.</p>
              <p style="margin:0 0 8px;">Deposit due: <strong>${moneyFmt(deposit)}</strong> of ${moneyFmt(total)}.</p>
              <p style="margin:0 0 16px;color:#8B7B95;font-size:13px;">An invoice is waiting for the deposit. Payments aren't connected yet — collect it offline or wire Stripe next.</p>
              <p>${brandButton('Open contracts', 'https://iroxannestudio.base44.app/admin/contracts')}</p>`,
          }),
        }).catch((e) => console.log('admin sign email failed', e?.message));
      }

      return Response.json({ contract: publicContract(updated) });
    }

    return Response.json({ contract: publicContract(contract) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}