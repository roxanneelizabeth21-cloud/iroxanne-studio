// Which link gets appended at the bottom of a post, and how to build it.

export const SITE_URL = 'https://iroxanne.com';

export const LINK_TARGETS = ['Release page', 'Pre-save page', 'Streaming link', 'None'];

// Default choice when the post has no explicit selection: the pre-save (/go) page
// for an unreleased release, otherwise the public release page.
export function defaultLinkTarget(release) {
  if (!release) return 'Streaming link';
  return release.status === 'upcoming' ? 'Pre-save page' : 'Release page';
}

export function releasePageUrl(release, target) {
  if (!release?.slug) return '';
  if (target === 'Pre-save page') return `${SITE_URL}/go/${release.slug}`;
  if (target === 'Release page') return `${SITE_URL}/release/${release.slug}`;
  return '';
}

// Link to paste into posts and comments. The /release and /go pages are rendered
// by the SPA, so social crawlers (which don't run JS) see no Open Graph tags and
// show no preview card. The releaseShareMeta endpoint serves the release's own
// og:title/description/image and then redirects humans to the same landing page,
// so this URL previews correctly and still lands fans in the right place.
export function shareablePageUrl(release, target) {
  if (!release?.slug) return '';
  if (target !== 'Pre-save page' && target !== 'Release page') return '';
  const dest = target === 'Pre-save page' ? '&dest=go' : '';
  return `${SITE_URL}/functions/releaseShareMeta?slug=${encodeURIComponent(release.slug)}${dest}`;
}