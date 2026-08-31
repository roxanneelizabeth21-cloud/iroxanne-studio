// Which link gets appended at the bottom of a post, and how to build it.
// Repurposed for the service business: a post promotes a PortfolioItem, and the
// link is either the project's page (live URL or /portfolio/<slug>) or the
// consult-booking page. No Open Graph proxy — links go directly to the destination.

export const SITE_URL = 'https://iroxanne.com';

export const LINK_TARGETS = ['Portfolio page', 'Consult booking', 'None'];

// Default choice when the post has no explicit selection: the portfolio page
// when a project is attached, otherwise the consult-booking page.
export function defaultLinkTarget(item) {
  return item?.id ? 'Portfolio page' : 'Consult booking';
}

export function consultBookingUrl() {
  return `${SITE_URL}/consult`;
}

// The public page for a portfolio item: its live project URL if set, otherwise
// the studio's /portfolio/<slug> page.
export function portfolioPageUrl(item) {
  if (!item) return '';
  if (item.project_url) return item.project_url;
  if (item.slug) return `${SITE_URL}/portfolio/${item.slug}`;
  return '';
}

// Destination URL for a chosen link target.
export function pageUrl(item, target) {
  if (target === 'Portfolio page') return portfolioPageUrl(item);
  if (target === 'Consult booking') return consultBookingUrl();
  return '';
}

// Kept for any legacy consumer that still imports releasePageUrl.
export const releasePageUrl = pageUrl;

// Link to paste into posts and comments. Direct link — no proxy step.
export function shareablePageUrl(item, target) {
  return pageUrl(item, target);
}