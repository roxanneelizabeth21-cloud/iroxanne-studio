import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import StageSection from '@/components/home/StageSection';

// Same public Storefront token the /shop Buy Button embeds use — safe to fetch
// from the browser. We pull only image / title / price via the Storefront
// GraphQL API (no Buy Button SDK, no iframes) so the homepage stays light and
// future product edits in Shopify reflect here automatically.
const STORE_DOMAIN = 'i1qu01-q1.myshopify.com';
const STOREFRONT_TOKEN = 'd46a6f67c2416ddad6db62cabaf76541';
const PRODUCT_IDS = ['9908938997995', '9896048787691'];

async function fetchShopProducts() {
  const ids = PRODUCT_IDS.map((id) => `"gid://shopify/Product/${id}"`).join(',');
  const query = `query { nodes(ids: [${ids}]) { ... on Product { id title featuredImage { url } priceRange { minVariantPrice { amount currencyCode } } } } }`;
  const res = await fetch(`https://${STORE_DOMAIN}/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  const nodes = json?.data?.nodes || [];
  return nodes
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      title: p.title,
      image: p.featuredImage?.url,
      price: p.priceRange?.minVariantPrice,
    }))
    .filter((p) => p.title);
}

function formatPrice(price) {
  if (!price?.amount) return '';
  const n = Number(price.amount);
  if (Number.isNaN(n)) return '';
  return `$${n.toFixed(2)}`;
}

// Compact "Merch" row for the homepage — small white card thumbnails (image,
// name, price only) that link to /shop. No variant selectors or Add to Cart,
// no Buy Button SDK / iframes. Cards are always white (matching the shop
// framing) so text uses fixed neutral tones that stay readable in both modes.
export default function MerchSection({ fluid }) {
  const { data: products = [] } = useQuery({
    queryKey: ['shop-products-home'],
    queryFn: fetchShopProducts,
    staleTime: 1000 * 60 * 30,
  });

  if (products.length === 0) return null;

  return (
    <StageSection fluid={fluid} title="Merch" actionTo="/shop" actionLabel="Shop All">
      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <Link
            key={p.id}
            to="/shop"
            className="group rounded-xl border border-primary/15 bg-card/40 backdrop-blur-sm p-3 flex flex-col hover:border-primary/40 transition-colors"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-secondary/30">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/15 to-primary/5" />
              )}
            </div>
            <h3 className="mt-2 text-xs font-semibold text-foreground truncate">{p.title}</h3>
            <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
          </Link>
        ))}
      </div>
    </StageSection>
  );
}