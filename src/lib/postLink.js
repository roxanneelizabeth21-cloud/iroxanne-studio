// Which link gets appended at the bottom of a post, and how to build it.
// Canonical studio domain. Keep in sync with CANONICAL_URL in
// base44/shared/studioUrl.ts — the backend copy that builds client emails.
export const SITE_URL = 'https://iroxannestudio.com';
export const LINK_TARGETS = ['Portfolio page', 'Consult booking', 'Get a Quote', 'None'];

export function defaultLinkTarget(item) {
  if (!item?.id || item.id === '__studio_service__') return 'Get a Quote';
  return 'Portfolio page';
}
export function consultBookingUrl() { return `${SITE_URL}/book-call`; }
export function getQuoteUrl() { return `${SITE_URL}/quote`; }
export function portfolioPageUrl(item) {
  if (!item) return '';
  if (item.project_url) return item.project_url;
  if (item.slug) return `${SITE_URL}/work/${item.slug}`;
  return '';
}
export function pageUrl(item, target) {
  if (target === 'Portfolio page') return portfolioPageUrl(item);
  if (target === 'Consult booking') return consultBookingUrl();
  if (target === 'Get a Quote') return getQuoteUrl();
  return '';
}
export const releasePageUrl = pageUrl;
export function shareablePageUrl(item, target) { return pageUrl(item, target); }
