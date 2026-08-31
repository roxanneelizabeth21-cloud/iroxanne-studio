import PageBanner from '@/components/PageBanner';
import PromoBannerStack from '@/components/PromoBannerStack';
import ShopProductCard from '@/components/shopify/ShopProductCard';
import { EMBED_PRODUCT_1, EMBED_PRODUCT_2, EMBED_PRODUCT_3, EMBED_PRODUCT_4, EMBED_PRODUCT_5 } from '@/components/shopify/shopifyEmbeds';

export default function Shop() {
  return (
    <div className="min-h-screen">
      <PageBanner pageKey="store" />

      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="text-center mb-10 mt-2">
          <PromoBannerStack pageKey="shop" />
          <h2 className="font-display text-3xl font-bold text-glow">Shop Roxsan</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Official merchandise powered by Shopify. Add items to your cart and check out securely.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch justify-items-center">
          <ShopProductCard embedHtml={EMBED_PRODUCT_5} productId="9908938997995" />
          <ShopProductCard embedHtml={EMBED_PRODUCT_2} productId="9896048787691" />
          <ShopProductCard embedHtml={EMBED_PRODUCT_3} productId="9905052221675" />
        </div>
      </div>
    </div>
  );
}