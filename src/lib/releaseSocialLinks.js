import { Youtube, Instagram, Facebook } from 'lucide-react';
import { resolveIcon } from '@/lib/platformConfig';

// Fallback "Connect with Roxsan" links used when no ArtistProfileLink records
// have been created yet. Once the admin adds artist profile links in
// /admin/artist-links, those take over the Connect section on every release page.
export const RELEASE_SOCIAL_LINKS = [
  { name: 'Facebook', Icon: Facebook, url: 'https://www.facebook.com/profile.php?id=61590667173106' },
  { name: 'Instagram', Icon: Instagram, url: 'https://www.instagram.com/officialroxsan/' },
  { name: 'YouTube', Icon: Youtube, url: 'https://www.youtube.com/@RoxSan-614' },
];

// Map ArtistProfileLink records into the { name, Icon, url } shape FollowLinks expects.
export function artistLinksToFollow(links) {
  const out = [];
  for (const l of (links || [])) {
    if (!l || l.is_visible === false || !l.url) continue;
    out.push({
      name: l.display_label || l.platform_name,
      Icon: resolveIcon(l.icon_name),
      url: l.url,
    });
  }
  out.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return out;
}