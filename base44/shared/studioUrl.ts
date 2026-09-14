// Canonical public URL for the studio, in one place.
//
// Before this existed, eleven functions hardcoded the base44 preview domain,
// four hardcoded iroxanne.com, and two derived the origin from the request —
// so client-facing links disagreed with each other. Everything that builds a
// link a client will click should go through here.
//
// The live app is iroxannestudio.com. A STUDIO_URL environment variable
// overrides it for staging, when the runtime exposes one — read defensively,
// since not every function context does.
//
// Two things this is deliberately NOT:
//   - iroxanne.com, which is a different property
//   - the Canva OAuth redirect host in shared/canva.ts, which must keep
//     matching the Canva app registration exactly

export const CANONICAL_URL = 'https://iroxannestudio.com';

// base44 preview/sandbox hosts. Links generated while working inside a preview
// should stay on that host, otherwise a test click leaves the environment.
const PREVIEW_HOST = /(^|\.)base44\.(app|com)$/i;

function normalize(raw: unknown): string {
  const value = String(raw || '').trim();
  if (!/^https:\/\/[^\s/]+/i.test(value)) return '';
  return value.replace(/\/+$/, '');
}

/**
 * The base URL to build client links from.
 *
 * Pass the request when you have one: if the call arrived on a base44 preview
 * host, links stay on that host so testing works end to end. Production
 * requests and scheduled runs (no request) resolve to the canonical domain.
 */
export function studioUrl(req?: Request, override?: unknown): string {
  const forced = normalize(override) || normalize(secretUrl());
  if (forced) return forced;
  // Always return the canonical public URL.
  // Preview hosts require Base44 login, which clients don't have.
  return CANONICAL_URL;
}

// Read STUDIO_URL if the runtime exposes secrets; absent in some contexts, so
// this must never throw.
function secretUrl(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (globalThis as any)?.Deno?.env;
    return env?.get?.('STUDIO_URL') || '';
  } catch {
    return '';
  }
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
