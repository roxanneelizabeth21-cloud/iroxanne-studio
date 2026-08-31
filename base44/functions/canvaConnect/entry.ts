import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import {
  CANVA_AUTHORIZE_URL,
  CANVA_REDIRECT_URI,
  CANVA_SCOPES,
  codeChallenge,
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

    const clientId = secrets.get('CANVA_CLIENT_ID');
    if (!clientId) return Response.json({ error: 'CANVA_CLIENT_ID is not set' }, { status: 500 });

    const state = randomString(24);
    const verifier = randomString(64);
    await base44.entities.CanvaAuth.create({
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