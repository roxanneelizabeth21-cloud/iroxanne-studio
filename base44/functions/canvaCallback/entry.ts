import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { CANVA_REDIRECT_URI, CANVA_TOKEN_URL } from '../../shared/canva.ts';

function page(title, message) {
  return new Response(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<div style="font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1.5rem;text-align:center">` +
      `<h1 style="font-size:1.25rem">${title}</h1><p style="color:#555">${message}</p></div>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

// Canva redirects here after the owner approves access. Called without a user
// session, so it runs as the service role and is authenticated by matching the
// one-time `state` value created by canvaConnect.
export default async function (req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const canvaError = url.searchParams.get('error');

    if (!state) return page('Canva connection failed', 'The link was missing its security token. Start the connection again from your app.');

    const base44 = createClientFromRequest(req);
    const matches = await base44.asServiceRole.entities.CanvaAuth.filter({ state });
    const record = matches[0];
    if (!record) return page('Canva connection failed', 'This connection link has expired. Start the connection again from your app.');

    if (canvaError || !code) {
      await base44.asServiceRole.entities.CanvaAuth.update(record.id, {
        status: 'failed',
        error: canvaError || 'No authorization code returned',
      });
      return page('Canva connection failed', 'Canva did not grant access. You can try connecting again from your app.');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: record.code_verifier,
      redirect_uri: CANVA_REDIRECT_URI,
    });
    const basic = btoa(`${secrets.get('CANVA_CLIENT_ID')}:${secrets.get('CANVA_CLIENT_SECRET')}`);
    const tokenRes = await fetch(CANVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const token = await tokenRes.json();

    if (!tokenRes.ok || !token.access_token) {
      await base44.asServiceRole.entities.CanvaAuth.update(record.id, {
        status: 'failed',
        error: token.error_description || token.error || `Token request failed (${tokenRes.status})`,
      });
      return page('Canva connection failed', 'Canva rejected the connection. Check the app credentials and try again.');
    }

    await base44.asServiceRole.entities.CanvaAuth.update(record.id, {
      status: 'connected',
      access_token: token.access_token,
      refresh_token: token.refresh_token || '',
      expires_at: new Date(Date.now() + (token.expires_in || 0) * 1000).toISOString(),
      code_verifier: '',
      error: '',
    });

    return page('Canva connected', 'You can close this tab and go back to your app.');
  } catch (error) {
    return page('Canva connection failed', 'Something went wrong finishing the connection. Please try again.');
  }
}