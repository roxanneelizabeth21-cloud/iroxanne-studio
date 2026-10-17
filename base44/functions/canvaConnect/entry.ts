import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  CANVA_AUTHORIZE_URL,
  CANVA_REDIRECT_URI,
  CANVA_SCOPES,
  codeChallenge,
  getCanvaCredentials,
  randomString,
} from '../../shared/canva.ts';

// Starts the Canva connect flow: stores a PKCE verifier + state, returns the
// Canva authorization URL the admin should open.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    if (body?.action === 'status') {
      const auths = await base44.entities.CanvaAuth.list('-created_date', 10);
      const connected = (auths || []).some((a: any) => a.status === 'connected');
      const hasCredentials = (auths || []).some((a: any) => Boolean(a.client_id && a.client_secret));
      const lastFailed = !connected ? (auths || []).find((a: any) => a.status === 'failed') : null;
      return Response.json({
        connected,
        has_credentials: hasCredentials,
        last_error: lastFailed?.error || null,
      });
    }
    if (body?.action === 'save_credentials') {
      const cid = String(body.client_id || '').trim();
      const csec = String(body.client_secret || '').trim();
      if (!cid || !csec) return Response.json({ error: 'Client ID and Client Secret are required' }, { status: 400 });
      await base44.entities.CanvaAuth.create({
        client_id: cid,
        client_secret: csec,
        status: 'pending',
      });
      return Response.json({ ok: true });
    }

    const { clientId, clientSecret } = await getCanvaCredentials(base44);

    const state = randomString(24);
    const verifier = randomString(64);
    await base44.entities.CanvaAuth.create({
      client_id: clientId,
      client_secret: clientSecret,
      state,
      code_verifier: verifier,
      status: 'pending',
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: CANVA_REDIRECT_URI,
      scope: CANVA_SCOPES.join(' '),
      state,
      code_challenge_method: 'S256',
      code_challenge: await codeChallenge(verifier),
    });

    return Response.json({ authorize_url: `${CANVA_AUTHORIZE_URL}?${params.toString()}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}