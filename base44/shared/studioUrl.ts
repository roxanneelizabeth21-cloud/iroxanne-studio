// Canonical public URL for the studio, in one place.
//
// Before this existed, eleven functions hardcoded the base44 preview domain,
// four hardcoded iroxanne.com, and two derived the origin from the request —
// so client-facing links disagreed with each other. Everything that builds a
// link a client will click should go through here.
//
// The live app is iroxannestudio.com.
//
// Two things this is deliberately NOT:
//   - iroxanne.com, which is a different property
//   - the Canva OAuth redirect host in shared/canva.ts, which must keep
//     matching the Canva app registration exactly

export const CANONICAL_URL = 'https://iroxannestudio.com';

function normalize(raw: unknown): string {
  const value = String(raw || '').trim();
  if (!/^https:\/\/[^\s/]+/i.test(value)) return '';
  return value.replace(/\/+$/, '');
}

/**
 * The base URL to build client links from.
 */
export function studioUrl(_req?: Request, override?: unknown): string {
  const forced = normalize(override);
  if (forced) return forced;
  // Always return the canonical public URL.
  // Preview hosts require Base44 login, which clients don't have.
  return CANONICAL_URL;
}

/** Public-facing URL for client documents. Never returns a preview/admin host. */
export function clientUrl(): string {
  return CANONICAL_URL;
}

/** Build an absolute studio path: studioPath(req, '/invoice/abc') */
export function studioPath(req: Request | undefined, path: string): string {
  const clean = String(path || '');
  return `${studioUrl(req)}${clean.startsWith('/') ? clean : `/${clean}`}`;
}

/** A token-gated client document link — invoice, contract, proposal, intake, handoff.
 *  ALWAYS uses the canonical public URL so clients never hit Base44 admin/login. */
export function clientLink(req: Request | undefined, kind: string, id: string, token: string): string {
  return `${CANONICAL_URL}/${kind}/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`;
}

/** An admin deep link, for the notification emails Roxanne gets. */
export function adminLink(req: Request | undefined, path = ''): string {
  const clean = String(path || '').replace(/^\/+/, '');
  return `${studioUrl(req)}/admin${clean ? `/${clean}` : ''}`;
}