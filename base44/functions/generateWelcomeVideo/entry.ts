import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendStudioEmail } from '../../shared/studioEmail.ts';
import { esc, brandedEmail, brandButton } from '../../shared/emailBrand.ts';
import { clientLink } from '../../shared/studioUrl.ts';

// Pre-generated welcome video — no HeyGen API calls needed.
// Used for all clients after they sign their project agreement.
const WELCOME_VIDEO_URL = 'https://media.base44.com/videos/public/6a94dbc673f0d144b6ed36bb/25302317b_7F0FCDF4-20D6-1E91-E411-ADB07720E45D.mp4';

// Called after a contract is signed — sends the pre-generated welcome video
// to the client and marks the contract so duplicates are skipped.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isAdmin = user?.role === 'admin';

    const body = await req.json().catch(() => ({}));
    const { contract_id, token, regenerate } = body || {};
    if (!contract_id) return Response.json({ error: 'contract_id is required' }, { status: 400 });

    if (regenerate && !isAdmin) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const contract = await base44.asServiceRole.entities.Contract.get(contract_id).catch(() => null);
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

    // Require either an authenticated admin or the contract's private access_token.
    const hasValidToken = typeof token === 'string' && token.length >= 16 && contract.access_token === token;
    if (!isAdmin && !hasValidToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Idempotent — skip if already sent (unless explicitly regenerating as admin).
    if (!regenerate && contract.welcome_video_status === 'ready' && contract.welcome_video_sent_at) {
      return Response.json({ ok: true, status: 'already_sent' });
    }

    if (!contract.client_email) {
      return Response.json({ error: 'Contract has no client email' }, { status: 400 });
    }

    const firstName = (contract.signer_name || contract.client_name || '').split(' ')[0] || 'there';
    const contractLink = clientLink({ headers: {} }, 'contract', contract_id, contract.access_token);

    await sendStudioEmail(base44, {
      to: contract.client_email,
      subject: 'A personal welcome from Roxanne — ' + contract.project_title,
      body: brandedEmail({
        title: 'Your welcome video is ready, ' + esc(firstName) + '.',
        content: '<p style="margin:0 0 16px;">Here is a short studio welcome as we get started on <strong>' + esc(contract.project_title) + '</strong>. Take a look — it covers what happens next and what to expect as we get started.</p>' +
          '<p style="margin:0 0 16px;">' + brandButton('Watch my welcome video', WELCOME_VIDEO_URL) + '</p>' +
          '<p style="margin:0 0 16px;">' + brandButton('View your signed agreement', contractLink) + '</p>' +
          '<p style="margin:0;color:#8B7B95;font-size:13px;">— Roxanne, iRoxanne Studio</p>',
        footerNote: 'iRoxanne Studio — one builder, not an agency.',
      }),
    });

    await base44.asServiceRole.entities.Contract.update(contract_id, {
      welcome_video_url: WELCOME_VIDEO_URL,
      welcome_video_status: 'ready',
      welcome_video_sent_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      status: 'sent',
      video_url: WELCOME_VIDEO_URL,
    });
  } catch (error) {
    console.error('generateWelcomeVideo error', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}