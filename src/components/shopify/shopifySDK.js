// Loads the Shopify Buy Button SDK exactly once for the whole page.
// Each embed's own IIFE checks `window.ShopifyBuy.UI` and calls its
// ShopifyBuyInit() directly once the SDK is ready, so no embed ever triggers a
// duplicate <script> append (the conflict that happens when two embeds race
// the loader).
let sdkPromise = null;

export function loadShopifySDK() {
  if (typeof window !== 'undefined' && window.ShopifyBuy && window.ShopifyBuy.UI) {
    return Promise.resolve();
  }
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(s);
    s.onload = () => {
      const wait = () => {
        if (window.ShopifyBuy && window.ShopifyBuy.UI) resolve();
        else setTimeout(wait, 50);
      };
      wait();
    };
    s.onerror = () => reject(new Error('Failed to load Shopify Buy Button SDK'));
  });
  return sdkPromise;
}