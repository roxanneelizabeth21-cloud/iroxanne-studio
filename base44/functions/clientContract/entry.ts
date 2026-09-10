import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Public, token-verified access for a client to view and e-sign their contract.
// No user auth — the access_token in the contract link is the credential.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { id, token, action, signerName } = body || {};
    if (!id || !token) return Response.json({ error: 'Missing contract id or token' }, { status: 400 });

    let contract;
    try {
      contract = await base44.asServiceRole.entities.Contract.get(id);
    } catch {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }
    if (contract.access_token !== token) return Response.json({ error: 'Invalid or expired link' }, { status: 403 });

    if (action === 'sign') {
      if (!signerName || !signerName.trim()) return Response.json({ error: 'Please type your full name to sign' }, { status: 400 });
      if (['signed', 'deposit_paid', 'active', 'completed'].includes(contract.status)) {
        return Response.json({ error: 'This contract has already been signed' }, { status: 409 });
      }
      const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
      const updated = await base44.asServiceRole.entities.Contract.update(id, {
        status: 'signed',
        signed_at: new Date().toISOString(),
        signer_name: signerName.trim(),
        signer_ip: ip
      });
      return Response.json({ contract: updated });
    }

    return Response.json({ contract });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}