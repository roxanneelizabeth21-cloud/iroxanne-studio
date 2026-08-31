import { useEffect, useRef } from 'react';
import { loadShopifySDK } from './shopifySDK';

// Hosts we trust to serve a remote <script> inside a Shopify Buy Button
// embed. Anything else (unknown CDNs, inline event handlers, javascript:
// URLs) is stripped before the embed is mounted, so a tampered embed string
// cannot execute arbitrary script in our origin.
const ALLOWED_SCRIPT_HOSTS = new Set([
  'cdn.shopify.com',
  'js.shopify.com',
  'cdn.jsdelivr.net',
]);

function isAllowedScriptSrc(src) {
  try {
    const u = new URL(src, window.location.href);
    return u.protocol === 'https:' && ALLOWED_SCRIPT_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

// Strip inline event handlers (on*) and javascript: URLs from a parsed node
// tree so inert markup we copy into the live DOM carries no executable attrs.
function sanitizeNode(node) {
  node.querySelectorAll?.('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const val = String(attr.value || '').toLowerCase().trim();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if ((name === 'href' || name === 'src' || name === 'action' || name === 'formaction') && val.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });
}

// Mounts a single Shopify Buy Button embed (its raw HTML = product <div> +
// <script>) into the page. The embed is parsed in an inert DOMParser document
// (never assigned to a live element via innerHTML), sanitized, then only
// allowlisted scripts are re-created so the embed initializes. We pre-load
// the SDK once (see shopifySDK) so multiple embeds on the same page never
// double-load the loader.
export default function ShopifyBuyButton({ embedHtml }) {
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadShopifySDK()
      .then(() => {
        if (cancelled || !ref.current) return;
        const container = ref.current;
        // Parse inert — no scripts execute, no live-DOM sink.
        const doc = new DOMParser().parseFromString(embedHtml, 'text/html');
        container.replaceChildren();
        // Copy non-script nodes, sanitized, into the live DOM.
        doc.body.childNodes.forEach((node) => {
          if (node.nodeName.toLowerCase() === 'script') return;
          const clone = node.cloneNode(true);
          if (clone.nodeType === 1) sanitizeNode(clone);
          container.appendChild(clone);
        });
        // Re-create only allowlisted scripts so the Shopify embed IIFE runs.
        doc.body.querySelectorAll('script').forEach((old) => {
          const src = old.getAttribute('src');
          if (src && !isAllowedScriptSrc(src)) return;
          const s = document.createElement('script');
          s.type = old.type || 'text/javascript';
          if (src) {
            s.src = src;
            if (old.hasAttribute('async')) s.async = true;
            if (old.hasAttribute('defer')) s.defer = true;
          } else {
            s.textContent = old.textContent;
          }
          container.appendChild(s);
        });
      })
      .catch(() => {
        if (ref.current) {
          ref.current.replaceChildren();
          const p = document.createElement('p');
          p.className = 'text-sm text-muted-foreground';
          p.textContent = 'Unable to load store. Please try again later.';
          ref.current.appendChild(p);
        }
      });
    return () => { cancelled = true; };
  }, [embedHtml]);

  return <div ref={ref} className="shopify-embed" />;
}