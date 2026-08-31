import { createClientFromRequest } from "npm:@base44/sdk";
import { probeImage } from "../../shared/imageMeta.ts";

// Public per-release share-preview endpoint.
// Route: GET https://<app-domain>/functions/releaseShareMeta?slug=<slug>
//
// Returns a full HTML document whose <head> carries Open Graph / Twitter meta
// pointing to the release's cover art (social_share_image || cover_image_url),
// so social crawlers and iMessage / text-message previews render the release
// artwork instead of the global brand image hardcoded in index.html.
//
// The <body> contains only a JavaScript redirect to the real landing page
// (/release/<slug>). Preview bots do not execute JS, so they read the og meta
// from this response; humans who open the link are redirected to the full page.
export default async function (req: Request): Promise<Response> {
  const url = new URL(req.url);
  let slug = url.searchParams.get("slug");
  let destParam = url.searchParams.get("dest");

  // POST callers (e.g. the platform test harness) may pass the slug in the body.
  if (!slug && (req.method === "POST" || req.method === "PUT")) {
    try {
      const body = await req.json();
      if (body && typeof body.slug === "string") slug = body.slug;
      if (body && typeof body.dest === "string" && !destParam) destParam = body.dest;
    } catch {
      // ignore non-JSON body
    }
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  let release: any = null;
  try {
    const matches = await base44.asServiceRole.entities.MusicRelease.filter({ slug });
    release = Array.isArray(matches) && matches.length ? matches[0] : null;
  } catch {
    release = null;
  }

  // The platform invokes this function through an internal dispatcher host
  // (base44-dispatcher-production…), so url.origin is NOT publicly routable.
  // Redirecting a human there returns {"error":"unauthorized","detail":"invalid
  // dispatcher secret"}. Derive the real public origin from forwarded headers,
  // falling back to the site's public domain.
  const publicOrigin = getPublicOrigin(req) || "https://iroxanne.com";
  // dest=go sends humans to the pre-save capture page (/go/<slug>) instead of
  // the release page, so ad links can use this endpoint and still land fans on
  // the email-capture flow while crawlers read the release's own artwork below.
  const dest = destParam === "go" ? "go" : "release";
  const landingUrl = `${publicOrigin}/${dest}/${encodeURIComponent(slug)}`;
  // Canonical = the function URL itself. Facebook's scraper follows og:url and
  // re-scrapes that URL; if it points at the SPA landing page (/release/<slug>)
  // Facebook reads the default index.html meta (brand logo), not this response.
  // Self-referential canonical keeps Facebook reading THESE tags. Humans are
  // still JS-redirected to the real landing page below.
  const canonicalUrl = `${publicOrigin}/functions/releaseShareMeta?slug=${encodeURIComponent(slug)}${dest === "go" ? "&dest=go" : ""}`;

  if (!release) {
    // Unknown slug — redirect to /music so the link never dead-ends.
    return new Response(redirectHtml(`${publicOrigin}/music`), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const cover = release.social_share_image || release.cover_image_url || release.hero_image_url || "";
  const title = release.title || "New Music";
  const artist = release.artist_name || "Roxsan";
  const description = release.share_description || release.description || release.tagline || "";
  const fullTitle = `${title} — ${artist}`;

  // Declaring the image's real size + type lets crawlers render the card with
  // the artwork on the FIRST scrape. Without it, Facebook must download and
  // measure the file itself and drops the image from that first preview for
  // larger covers — which is why some releases previewed with art and some
  // didn't. Measured per request, so it is correct for every release forever.
  const probed = cover ? await probeImage(cover) : null;
  const imageTags = cover
    ? [
      `<meta property="og:image" content="${escapeAttr(cover)}" />`,
      `<meta property="og:image:secure_url" content="${escapeAttr(cover)}" />`,
      `<meta property="og:image:alt" content="${escapeAttr(title + ' — cover art')}" />`,
      probed ? `<meta property="og:image:type" content="${escapeAttr(probed.type)}" />` : '',
      probed ? `<meta property="og:image:width" content="${probed.width}" />` : '',
      probed ? `<meta property="og:image:height" content="${probed.height}" />` : '',
      `<meta name="twitter:image" content="${escapeAttr(cover)}" />`,
      `<meta name="twitter:image:alt" content="${escapeAttr(title + ' — cover art')}" />`,
    ].filter(Boolean).join('\n')
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeAttr(description)}" />
<link rel="canonical" href="${escapeAttr(canonicalUrl)}" />
<meta property="og:type" content="music.song" />
<meta property="og:site_name" content="Roxsan Music" />
<meta property="og:title" content="${escapeAttr(fullTitle)}" />
<meta property="og:description" content="${escapeAttr(description)}" />
<meta property="og:url" content="${escapeAttr(canonicalUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeAttr(fullTitle)}" />
<meta name="twitter:description" content="${escapeAttr(description)}" />
${imageTags}
</head>
<body>
<noscript>
<meta http-equiv="refresh" content="0;url=${escapeAttr(landingUrl)}" />
<a href="${escapeAttr(landingUrl)}">Continue to ${escapeHtml(fullTitle)}</a>
</noscript>
<script>window.location.replace(${JSON.stringify(landingUrl)});</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function redirectHtml(target: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${escapeAttr(target)}"><title>Redirecting…</title></head><body><noscript><a href="${escapeAttr(target)}">Continue</a></noscript><script>window.location.replace(${JSON.stringify(target)});</script></body></html>`;
}

function getPublicOrigin(req: Request): string | null {
  const xfh = req.headers.get("x-forwarded-host");
  if (xfh) {
    const host = xfh.split(",")[0].trim();
    const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
    return `${proto}://${host}`;
  }
  const fwd = req.headers.get("forwarded");
  if (fwd) {
    const host = fwd.match(/host=([^;,]+)/i)?.[1]?.trim();
    if (host) {
      const proto = fwd.match(/proto=([^;,]+)/i)?.[1]?.trim() || "https";
      return `${proto}://${host}`;
    }
  }
  return null;
}

function escapeHtml(s: string): string {
  return String(s || "").replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}
function escapeAttr(s: string): string {
  return String(s || "").replace(/[&<>"]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"));
}