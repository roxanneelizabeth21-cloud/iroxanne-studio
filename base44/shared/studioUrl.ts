// Canonical public URL for the studio, in one place.
//
// Before this existed, eleven functions hardcoded the base44 preview domain,
// four hardcoded iroxanne.com, and two derived the origin from the request —
// so client-facing links disagreed with each other. Everything that builds a
// link a client will click should go through here.
//
// The live app is iroxanne.com. A STUDIO_URL environment variable overrides it
// for staging, when the runtime exposes one — read defensively, since not every
// function context does.

export const CANONICAL_URL = 'https://iroxanne.com';

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

  if (req) {
    try {
      const url = new URL(req.url);
      if (PREVIEW_HOST.test(url.hostname)) return `${url.protocol}//${url.host}`;
    } catch { /* fall through to canonical */ }
  }
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

/** Build an absolute studio path: studioPath(req, '/invoice/abc') */
export function studioPath(req: Request | undefined, path: string): string {
  const clean = String(path || '');
  return `${studioUrl(req)}${clean.startsWith('/') ? clean : `/${clean}`}`;
}

/** A token-gated client document link — invoice, contract, proposal, intake, handoff. */
export function clientLink(req: Request | undefined, kind: string, id: string, token: string): string {
  return `${studioUrl(req)}/${kind}/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`;
}

/** An admin deep link, for the notification emails Roxanne gets. */
export function adminLink(req: Request | undefined, path = ''): string {
  const clean = String(path || '').replace(/^\/+/, '');
  return `${studioUrl(req)}/admin${clean ? `/${clean}` : ''}`;
}
