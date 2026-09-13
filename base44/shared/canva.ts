// Shared Canva Connect API constants and helpers.
// Must match the redirect URI registered in the Canva developer app exactly.
// Not a link clients click, so it is intentionally NOT studioUrl/CANONICAL_URL.
// Changing this without updating Canva breaks the OAuth handshake.
export const CANVA_REDIRECT_URI = 'https://iroxanne.base44.app/functions/canvaCallback';
export const CANVA_AUTHORIZE_URL = 'https://www.canva.com/api/oauth/authorize';
export const CANVA_TOKEN_URL = 'https://api.canva.com/rest/v1/oauth/token';

export const CANVA_SCOPES = [
  'design:meta:read',
  'design:content:read',
  'design:content:write',
  'asset:read',
  'asset:write',
];

export const CANVA_API = 'https://api.canva.com/rest/v1';

// Returns a live Canva access token for the connected account, refreshing it
// when it has expired. Throws a plain message the UI can show as-is.
export async function getCanvaAccessToken(base44, clientId, clientSecret) {
  const records = await base44.asServiceRole.entities.CanvaAuth.filter({ status: 'connected' });
  const record = records.sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)))[0];
  if (!record) throw new Error('Canva is not connected yet. Connect it on the Brand page first.');

  const stillValid = record.expires_at && new Date(record.expires_at).getTime() - 60000 > Date.now();
  if (stillValid) return record.access_token;
  if (!record.refresh_token) throw new Error('Your Canva connection expired. Reconnect Canva on the Brand page.');

  const res = await fetch(CANVA_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: record.refresh_token }).toString(),
  });
  const token = await res.json();
  if (!res.ok || !token.access_token) {
    throw new Error('Your Canva connection expired. Reconnect Canva on the Brand page.');
  }
  await base44.asServiceRole.entities.CanvaAuth.update(record.id, {
    access_token: token.access_token,
    refresh_token: token.refresh_token || record.refresh_token,
    expires_at: new Date(Date.now() + (token.expires_in || 0) * 1000).toISOString(),
  });
  return token.access_token;
}

function base64Url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomString(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

// Canva requires PKCE (S256) on the authorization code flow.
export async function codeChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}