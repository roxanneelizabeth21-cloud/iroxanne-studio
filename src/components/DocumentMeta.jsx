import { useEffect } from 'react';

// Sets document.title and Open Graph / Twitter meta tags for the current
// route. Renders nothing. Any prop left undefined keeps the existing
// (index.html global) value, so pages can override only what they know.
//
// NOTE: most social crawlers (Facebook, X, LinkedIn) read the initial HTML
// and do not run JavaScript, so these overrides are seen by JS-rendering
// previewers (iMessage, some Slack unfurls, in-app share sheets) and by the
// browser tab. For crawler-guaranteed per-page title/description on static
// pages, also set them in Dashboard → Marketing → SEO & GEO. The index.html
// global tags remain the fallback for strict crawlers.

function upsertMeta(attrName, key, value) {
  if (!value) return;
  const selector = `meta[${attrName}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function upsertCanonical(href) {
  if (!href) return;
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function DocumentMeta({ title, description, image, url, type, siteName, imageAlt }) {
  useEffect(() => {
    if (title) document.title = title;
    upsertCanonical(url);
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', siteName);
    upsertMeta('property', 'og:image:alt', imageAlt || title);
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
    upsertMeta('name', 'twitter:image:alt', imageAlt || title);
  }, [title, description, image, url, type, siteName, imageAlt]);
  return null;
}