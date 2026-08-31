import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ShopifyBuyButton from './ShopifyBuyButton';

// Storefront credentials — the same public token the Buy Button embeds use,
// so fetching from the browser is safe. The Storefront API is GraphQL-only;
// the previous REST product endpoint returned nothing with this token, which
// is why descriptions never appeared.
const STORE_DOMAIN = 'i1qu01-q1.myshopify.com';
const STOREFRONT_TOKEN = 'd46a6f67c2416ddad6db62cabaf76541';

function stripHtml(html) {
  if (typeof document === 'undefined') return '';
  // Parse inert via DOMParser — never assign untrusted HTML to a live DOM
  // element, so any markup in the description cannot execute against our DOM.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').trim();
}

// White product card for the /shop grid. The Shopify Buy Button SDK renders
// title / price / variant selectors / Add to Cart (description disabled in the
// embed). We fetch the live description from the Shopify Storefront GraphQL
// API and reveal it with a touch-friendly "Details" accordion below the card
// content — collapsed by default, click to expand/collapse. The card is
// always white by design (the SDK cards are white), so description text uses a
// fixed dark tone that stays readable on the white surface in both light and
// dark page modes.
export default function ShopProductCard({ embedHtml, productId }) {
  // null = loading, string = resolved (may be empty)
  const [description, setDescription] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!productId) { setDescription(''); return; }
    const query = `{ product(id: "gid://shopify/Product/${productId}") { descriptionHtml } }`;
    fetch(`https://${STORE_DOMAIN}/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setDescription(data?.data?.product?.descriptionHtml || '');
      })
      .catch(() => { if (!cancelled) setDescription(''); });
    return () => { cancelled = true; };
  }, [productId]);

  const hasDescription = !!description && !!stripHtml(description);

  return (
    <div className="w-full h-full bg-white rounded-2xl border border-border shadow-sm p-4 sm:p-6 flex flex-col">
      <div className="flex justify-center">
        <ShopifyBuyButton embedHtml={embedHtml} />
      </div>

      {hasDescription && (
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary"
            aria-expanded={expanded}
          >
            {expanded ? 'Hide details' : 'Details'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && (
            <div
              className="mt-3 text-sm leading-relaxed text-neutral-700 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_em]:italic"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>
      )}
    </div>
  );
}