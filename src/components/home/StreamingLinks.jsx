import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PlatformLogo, { hasPlatformLogo } from '@/components/release-landing/PlatformLogo';

const PLATFORMS = [
  { name: 'Spotify', platformType: 'spotify', settingKey: 'streaming_spotify_url', color: 'from-green-500/20 to-green-600/10' },
  { name: 'Apple Music', platformType: 'apple_music', settingKey: 'streaming_apple_music_url', color: 'from-pink-500/20 to-pink-600/10' },
  { name: 'YouTube', platformType: 'youtube', settingKey: 'streaming_youtube_url', color: 'from-red-500/20 to-red-600/10' },
  { name: 'TikTok', platformType: 'tiktok_instagram', settingKey: 'streaming_tiktok_url', color: 'from-cyan-500/20 to-cyan-600/10' },
  { name: 'Amazon Music', platformType: 'amazon_music', settingKey: 'streaming_amazon_music_url', color: 'from-blue-500/20 to-blue-600/10' },
];

export default function StreamingLinks() {
  const { data: settingsList = [] } = useQuery({
    queryKey: ['homepage-settings'],
    queryFn: () => base44.entities.HomePageSettings.list(),
  });

  const settings = settingsList[0] || {};

  const platforms = PLATFORMS.map((p) => ({
    ...p,
    href: settings[p.settingKey] || null,
  }));

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-center mb-10">
          Stream <span className="text-primary">Everywhere</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {platforms.map((p, i) => (
            <motion.a
              key={p.name}
              href={p.href || undefined}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl glass glass-hover bg-gradient-to-br ${p.color} ${!p.href ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {hasPlatformLogo(p.platformType) ? (
                <PlatformLogo platformType={p.platformType} className="h-5 w-5" />
              ) : (
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">{p.name}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}