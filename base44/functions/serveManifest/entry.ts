// Serves the PWA web app manifest as JSON at a same-origin URL.
// Route: GET /functions/serveManifest
//
// The Base44 SPA fallback returns index.html for unknown root paths (e.g.
// /site.webmanifest), so a static manifest file in public/ is not served as
// JSON. This function returns the manifest with the correct content-type so
// both favicon auditors and PWA installability checks can parse it.
export default async function (req: Request): Promise<Response> {
  const manifest = {
    name: "iRoxanne Studio",
    short_name: "iRoxanne",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0D0D0D",
    theme_color: "#0D0D0D",
    icons: [
      {
        src: "https://base44.app/api/apps/6a048221a7f23eb1bf35a88e/files/mp/public/6a048221a7f23eb1bf35a88e/378283318_web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://base44.app/api/apps/6a048221a7f23eb1bf35a88e/files/mp/public/6a048221a7f23eb1bf35a88e/fb08b04ee_web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
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