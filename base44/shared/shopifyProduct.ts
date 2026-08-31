// Resolves a product's live Shopify photo, used as the locked design reference
// for merch image generation so the printed artwork stays identical across a series.

const SHOP_DOMAIN = 'i1qu01-q1.myshopify.com';
const STOREFRONT_TOKEN = 'd46a6f67c2416ddad6db62cabaf76541';

async function storefront(query: string) {
  const res = await fetch(`https://${SHOP_DOMAIN}/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return null;
  return await res.json().catch(() => null);
}

// The live product catalog of the Shop page's Shopify store — the single source
// of truth for what merch actually exists.
export async function listShopifyProducts() {
  const json = await storefront(`{
    products(first: 50) {
      edges { node {
        id title handle description onlineStoreUrl availableForSale
        featuredImage { url }
        priceRange { minVariantPrice { amount currencyCode } }
      } }
    }
  }`);
  const edges = json?.data?.products?.edges || [];
  return edges.map((e: any) => ({
    shopify_product_id: String(e.node.id).split('/').pop(),
    title: e.node.title,
    handle: e.node.handle,
    description: e.node.description,
    url: e.node.onlineStoreUrl || `https://${SHOP_DOMAIN}/products/${e.node.handle}`,
    available: e.node.availableForSale,
    image_url: e.node.featuredImage?.url || '',
    price: e.node.priceRange?.minVariantPrice?.amount || '',
    currency: e.node.priceRange?.minVariantPrice?.currencyCode || 'USD',
  }));
}