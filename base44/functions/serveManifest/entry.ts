// Serves the PWA web app manifest as JSON at a same-origin URL.
// Route: GET /functions/serveManifest
//
// The Base44 SPA fallback returns index.html for unknown root paths (e.g.
// /site.webmanifest), so a static manifest file in public/ is not served as
// JSON. This function returns the manifest with the correct content-type so
// both favicon auditors and PWA installability checks can parse it.
export default async function (req: Request): Promise<Response> {
  const manifest = {
  "name": "iRoxanne Studio",
  "short_name": "iRoxanne",
  "description": "Custom app development and personal build guidance.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#FAF7F0",
  "theme_color": "#302634",
  "categories": [
    "business",
    "productivity"
  ],
  "icons": [
    {
      "src": "https://iroxannestudio.com/branding/iR-favicon-light-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "https://iroxannestudio.com/branding/iR-favicon-light-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
};

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}