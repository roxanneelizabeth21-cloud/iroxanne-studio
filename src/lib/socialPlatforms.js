// THE single platform configuration for the marketing suite.
// Every icon, label, colour, capability and profile-URL lookup comes from here —
// no component defines its own platform map.
//
// Instagram and Facebook publish directly through the existing Meta workflow
// (publishPostToSocial). TikTok and YouTube have NO publishing integration:
// they are manual-sharing destinations only.

import { InstagramGlyph, FacebookGlyph, TikTokGlyph, YouTubeGlyph } from '@/components/marketing/PlatformIcons';

export const SOCIAL_PLATFORMS = [
  {
    id: 'instagram',
    label: 'Instagram',
    entityValue: 'Instagram', // the value stored on MarketingPost.platform / publish_targets
    Icon: InstagramGlyph,
    color: { bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400', dot: 'bg-pink-500', border: 'border-pink-500/30' },
    canPublish: true,
    canManualShare: true,
    profileField: 'instagram_profile_url',
    profileLabel: 'Open Instagram Profile',
    actionLabel: 'Publish to Instagram',
    tooltip: 'Review and publish to Instagram',
    ariaLabel: 'Instagram',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    entityValue: 'Facebook',
    Icon: FacebookGlyph,
    color: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-500/30' },
    canPublish: true,
    canManualShare: true,
    profileField: 'facebook_page_url',
    profileLabel: 'Open Facebook Page',
    actionLabel: 'Publish to Facebook',
    tooltip: 'Review and publish to Facebook',
    ariaLabel: 'Facebook',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    entityValue: 'TikTok',
    Icon: TikTokGlyph,
    color: { bg: 'bg-slate-500/15', text: 'text-slate-700 dark:text-slate-200', dot: 'bg-slate-900', border: 'border-slate-500/30' },
    canPublish: false,
    canManualShare: true,
    profileField: 'tiktok_profile_url',
    profileLabel: 'Open TikTok Profile',
    actionLabel: 'Open TikTok Profile',
    tooltip: 'Prepare media and open TikTok',
    ariaLabel: 'TikTok',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    entityValue: 'YouTube',
    Icon: YouTubeGlyph,
    color: { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500', border: 'border-red-500/30' },
    canPublish: false,
    canManualShare: true,
    profileField: 'youtube_channel_url',
    profileLabel: 'Open YouTube Channel',
    actionLabel: 'Open YouTube Channel',
    tooltip: 'Prepare media and open YouTube',
    ariaLabel: 'YouTube',
  },
];

// Every alias seen in stored data, filters, agent output and older code.
const ALIASES = {
  instagram: 'instagram', ig: 'instagram', insta: 'instagram', 'instagram business': 'instagram',
  facebook: 'facebook', fb: 'facebook', 'facebook page': 'facebook', 'facebook pages': 'facebook', meta: 'facebook',
  tiktok: 'tiktok', 'tik tok': 'tiktok',
  youtube: 'youtube', yt: 'youtube', 'youtube shorts': 'youtube',
};

// 'both' historically meant Instagram + Facebook together.
export function normalizePlatform(value) {
  if (!value) return null;
  const key = String(value).trim().toLowerCase();
  return ALIASES[key] || null;
}

export function normalizePlatformList(value) {
  const raw = Array.isArray(value) ? value : [value];
  const out = [];
  for (const v of raw) {
    if (String(v || '').trim().toLowerCase() === 'both') {
      out.push('instagram', 'facebook');
      continue;
    }
    const id = normalizePlatform(v);
    if (id) out.push(id);
  }
  return [...new Set(out)];
}

export function getPlatform(value) {
  const id = normalizePlatform(value) || (SOCIAL_PLATFORMS.some((p) => p.id === value) ? value : null);
  return SOCIAL_PLATFORMS.find((p) => p.id === id) || null;
}

export const PUBLISHING_PLATFORMS = SOCIAL_PLATFORMS.filter((p) => p.canPublish);
export const MANUAL_PLATFORMS = SOCIAL_PLATFORMS.filter((p) => !p.canPublish);

// The entity value ('Instagram') for a canonical id ('instagram').
export function entityValue(id) {
  return getPlatform(id)?.entityValue || '';
}

export function isHttpsUrl(url) {
  const v = String(url || '').trim();
  if (!v) return false;
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
}

// The saved profile / page / channel URL for a platform, from the BrandProfile.
export function profileUrl(brandProfile, platformId) {
  const p = getPlatform(platformId);
  if (!p || !brandProfile) return '';
  const v = String(brandProfile[p.profileField] || '').trim();
  return isHttpsUrl(v) ? v : '';
}

// A profile link is NEVER an authenticated connection. "Connected" is reserved
// for real API connections (Instagram + Facebook via Meta).
export function profileLinkStatus(brandProfile, platformId) {
  return profileUrl(brandProfile, platformId) ? 'Profile Link Added' : 'Profile Link Missing';
}

// Open a normal https profile link in a new tab. On mobile the OS may hand the
// link to the installed app through its universal-link behaviour — that is the
// device's decision, never something the app can force or promise.
export function openProfileUrl(url) {
  if (!isHttpsUrl(url)) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}