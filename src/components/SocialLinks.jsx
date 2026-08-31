import { useQuery } from '@tanstack/react-query';
import { Facebook, Instagram } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PlatformLogo, { hasPlatformLogo } from '@/components/release-landing/PlatformLogo';

// Always-on social profiles (real destinations).
const SOCIALS = [
  { label: 'Instagram', Icon: Instagram, url: 'https://www.instagram.com/officialroxsan/' },
  { label: 'Facebook', Icon: Facebook, url: 'https://www.facebook.com/profile.php?id=61590667173106' },
  { label: 'YouTube', platformType: 'youtube', url: 'https://www.youtube.com/@RoxSan-614' },
];

// Streaming platforms shown only when a URL is configured in Homepage settings.
const STREAMING = [
  { label: 'Spotify', platformType: 'spotify', settingKey: 'streaming_spotify_url' },
  { label: 'Apple Music', platformType: 'apple_music', settingKey: 'streaming_apple_music_url' },
  { label: 'Amazon Music', platformType: 'amazon_music', settingKey: 'streaming_amazon_music_url' },
  { label: 'TikTok', platformType: 'tiktok_instagram', settingKey: 'streaming_tiktok_url' },
];

export default function SocialLinks({ className = '' }) {
  const { data: settingsList = [] } = useQuery({
    queryKey: ['homepage-settings'],
    queryFn: () => base44.entities.HomePageSettings.list(),
    staleTime: 60_000,
  });
  const settings = settingsList[0] || {};

  const items = [
    ...SOCIALS,
    ...STREAMING
      .filter((s) => settings[s.settingKey])
      .map((s) => ({ ...s, url: settings[s.settingKey] })),
  ];

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {items.map((s) => (
        <a
          key={s.label}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
          className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary hover:glow-blue-sm transition-all duration-300"
        >
          {s.platformType && hasPlatformLogo(s.platformType) ? (
            <PlatformLogo platformType={s.platformType} className="h-5 w-5" />
          ) : s.Icon ? (
            <s.Icon className="h-4 w-4" />
          ) : null}
        </a>
      ))}
    </div>
  );
}