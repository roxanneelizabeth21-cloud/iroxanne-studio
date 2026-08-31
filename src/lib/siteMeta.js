// Public site identity used for canonical / og:url tags. Always the artist's
// own domain — never the platform hostname the app happens to be served from.
export const SITE_ORIGIN = 'https://iroxanne.com';

export const SITE_NAME = 'Roxsan Music';

// Default 1200x630 brand share image (same asset as index.html).
export const DEFAULT_SHARE_IMAGE =
  'https://media.base44.com/images/public/6a048221a7f23eb1bf35a88e/fa7a93756_FBFallback-1200x630.png';

export function canonicalUrl(path = '/') {
  const clean = String(path || '/').split('?')[0].split('#')[0];
  return `${SITE_ORIGIN}${clean === '/' ? '' : clean.replace(/\/$/, '')}`;
}

const BRAND_DESCRIPTION =
  'Roxsan is a songwriter and storyteller blending country-pop warmth with contemporary Christian depth — music written from real life, faith, and hope. Stream her music and pre-save new releases.';

// Per-route share metadata for the public pages rendered inside AppLayout.
export const PAGE_META = {
  '/': { title: 'Roxsan Music', description: BRAND_DESCRIPTION, type: 'music.musician' },
  '/music': { title: 'Music — Roxsan', description: 'Albums, singles, and previews from Roxsan. Stream, pre-save, and find every release in one place.' },
  '/videos': { title: 'Videos — Roxsan', description: 'Music videos, lyric videos, and behind-the-scenes clips from Roxsan.' },
  '/about': { title: 'About Roxsan', description: 'The story behind Roxsan — a songwriter blending country-pop warmth with contemporary Christian depth.' },
  '/gallery': { title: 'Gallery — Roxsan', description: 'Photos from the studio, the stage, and life behind the songs.' },
  '/contact': { title: 'Contact Roxsan', description: 'Booking, press, and fan mail — get in touch with Roxsan.' },
  '/press': { title: 'Press Kit — Roxsan', description: 'Official bio, photos, and press assets for Roxsan.' },
  '/privacy': { title: 'Privacy Policy — Roxsan Music', description: 'How Roxsan Music handles your information.' },
  '/terms': { title: 'Terms of Use — Roxsan Music', description: 'Terms for using the Roxsan Music website.' },
};