import { Play, Youtube, Music2, Music, Disc3, Disc2, Radio, Heart, Music3 } from 'lucide-react';

export const PLATFORM_DEFAULTS = [
  { platform_type: 'apple_music', platform_name: 'Apple Music', display_label: 'Listen on Apple Music', icon_name: 'Music', sort_order: 1 },
  { platform_type: 'spotify', platform_name: 'Spotify', display_label: 'Listen on Spotify', icon_name: 'Music2', sort_order: 2 },
  { platform_type: 'youtube', platform_name: 'YouTube', display_label: 'Watch on YouTube', icon_name: 'Youtube', sort_order: 3 },
  { platform_type: 'amazon_music', platform_name: 'Amazon Music', display_label: 'Listen on Amazon Music', icon_name: 'Disc2', sort_order: 4 },
  { platform_type: 'tidal', platform_name: 'TIDAL', display_label: 'Listen on TIDAL', icon_name: 'Disc3', sort_order: 5 },
  { platform_type: 'pandora', platform_name: 'Pandora', display_label: 'Listen on Pandora', icon_name: 'Radio', sort_order: 6 },
  { platform_type: 'iheartradio', platform_name: 'iHeartRadio', display_label: 'Listen on iHeartRadio', icon_name: 'Heart', sort_order: 7 },
  { platform_type: 'deezer', platform_name: 'Deezer', display_label: 'Listen on Deezer', icon_name: 'Music', sort_order: 8 },
  { platform_type: 'itunes', platform_name: 'iTunes', display_label: 'Listen on iTunes', icon_name: 'Music2', sort_order: 9 },
  { platform_type: 'tiktok_instagram', platform_name: 'TikTok / Instagram Audio', display_label: 'Listen on TikTok & Instagram', icon_name: 'Music3', sort_order: 10 },
  { platform_type: 'other', platform_name: 'Other Platforms', display_label: 'Find it everywhere', icon_name: 'Play', sort_order: 11 },
];

const ICON_MAP = { Play, Youtube, Music2, Music, Disc3, Disc2, Radio, Heart, Music3 };

export function resolveIcon(iconName) {
  return ICON_MAP[iconName] || Play;
}