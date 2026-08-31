import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { listShopifyProducts } from '../../shared/shopifyProduct.ts';

// Returns the live Shopify catalog behind the app's Shop page. This is the only
// source of truth for which merch products exist.
export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const products = await listShopifyProducts();
  return Response.json({ ok: true, count: products.length, products });
}