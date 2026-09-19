import { sendStudioEmail } from '../../shared/studioEmail.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { esc, resolveAdminEmail, brandedEmail, brandButton } from '../../shared/emailBrand.ts';

import { validateSignature } from '../../shared/studioDelivery.ts';
import { studioUrl, adminLink, clientUrl, clientLink } from '../../shared/studioUrl.ts';

import { ensureContractInvoice } from '../../shared/contractInvoice.ts';
import {validateSchedule} from '../../shared/paymentSchedule.ts';

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
      const installments=contract.payment_installments?.length ? validateSchedule(contract.payment_installments,contract.price_total) : [];
      if(installments.length && installments[0].amount!==contract.deposit_amount) return Response.json({error:'The payment plan and deposit do not match. Please contact iRoxanne Studio.'},{status:409});
      const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
      let signatureUrl = '';
      if (signatureMode === 'drawn' && signatureImage) {
        try {
          const encoded=String(signatureImage).split(',')[1];
          const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
          const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({
            file:new File([bytes], `signature_${id}_${Date.now()}.png`, {type:'image/png'}),
          });
          signatureUrl = uploadRes?.url || uploadRes?.file_url || '';
        } catch (e) { console.log('signature upload failed', e?.message); }
        if(!signatureUrl) return Response.json({error:'Your signature could not be saved. Please retry; the agreement has not been signed.'},{status:503});
      }
      const updated = await base44.asServiceRole.entities.Contract.update(id, {
        status: 'signed',
        signed_at: new Date().toISOString(),
        signer_name: signerName.trim().slice(0,200),
        signature_mode: signatureMode,
        signature_image: signatureUrl,
        signer_ip: ip,
        signature_consent: true,
        signer_user_agent: (req.headers.get('user-agent') || '').slice(0, 1000)
      });

      // Post-sign: create the invoice and notify the client and admin.
      // Square checkout and recorded payments update the shared payment ledger.
      const moneyFmt = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');
      const total = typeof updated.price_total === 'number' ? updated.price_total : 0;
      const deposit = typeof updated.deposit_amount === 'number' ? updated.deposit_amount : 0;

      let invoice: any;
      let invoiceToken = '';
      let invoiceUrl = '';
      let invoiceError = '';
      try {
        invoice=await ensureContractInvoice(base44.asServiceRole.entities,updated);
        invoiceToken=invoice.access_token;
        invoiceUrl=`${clientUrl()}/invoice/${invoice.id}?t=${invoiceToken}`;
      } catch(e) {
        invoiceError='Your agreement is signed. Your invoice needs attention; iRoxanne Studio will provide your payment link.';
        console.error('invoice step failed',e?.message);
      }

      // Client-facing links must always use the canonical public domain.
      const firstName = (updated.signer_name || updated.client_name || '').split(' ')[0] || 'there';
      const contractLink = clientLink(req, 'contract', id, token);

      if (updated.client_email) {
        await sendStudioEmail(base44,{
          to: updated.client_email,
          subject: 'Agreement signed — iRoxanne Studio',
          body: brandedEmail({
            title: `Your agreement is signed, ${esc(firstName)}.`, 
            content: `<p style="margin:0 0 16px;">Your project agreement for <strong>${esc(updated.project_title)}</strong> is signed and on file. I'm excited to get started.</p>
              <p style="margin:0 0 16px;">${brandButton('View your signed agreement', contractLink)}</p>
              <p style="margin:0 0 8px;">Next step is your deposit to lock in your build slot:</p>
              <p style="font-size:20px;font-weight:600;margin:0 0 16px;">Deposit due: ${moneyFmt(deposit)}</p>
              ${invoiceUrl ? `<p style="margin:0 0 16px;">${brandButton('Pay deposit online', invoiceUrl)}</p><p style="margin:0 0 16px;color:#8B7B95;font-size:13px;">Pay securely by card, or use the payment instructions I'll send separately. Remaining balance of ${moneyFmt(Math.max(total - deposit, 0))} is due per your agreed schedule.</p>` : `<p style="margin:0 0 16px;color:#8B7B95;font-size:13px;">I'll send your payment link shortly. Remaining balance of ${moneyFmt(Math.max(total - deposit, 0))} is due per your agreed schedule.</p>`}`,
            footerNote: 'iRoxanne Studio — one builder, not an agency.',
          }),
        }).catch((e) => console.log('client sign email failed', e?.message));
      }

      const adminEmail = await resolveAdminEmail(base44).catch(() => '');
      if (adminEmail) {
        await sendStudioEmail(base44,{
          to: adminEmail,
          subject: `Contract signed — ${updated.project_title}`,
          body: brandedEmail({
            title: 'Contract signed',
            content: `<p style="margin:0 0 16px;"><strong>${esc(updated.signer_name)}</strong> just signed the agreement for <strong>${esc(updated.project_title)}</strong>.</p>
              <p style="margin:0 0 8px;">Deposit due: <strong>${moneyFmt(deposit)}</strong> of ${moneyFmt(total)}.</p>
              <p style="margin:0 0 16px;color:#8B7B95;font-size:13px;">${invoiceUrl ? 'An invoice is ready. Open Invoices to review and send the payment request through Square.' : 'Action required: invoice creation failed. Open Invoices and use Prepare missing invoice for this agreement.'}</p>
              <p>${brandButton('Open contracts', adminLink(req, 'contracts'))}</p>`,
          }),
        }).catch((e) => console.log('admin sign email failed', e?.message));
      }

      return Response.json({ contract: publicContract(updated), invoice_id: invoice?.id || '', invoice_token: invoiceToken || '', invoice_warning: invoiceError });
    }

    return Response.json({ contract: publicContract(contract) });
  } catch (error) {
    console.error('clientContract error:', error?.message || error, error?.stack || '');
    return Response.json({ error: String(error?.message || error || 'Server error') }, { status: 500 });
  }
}