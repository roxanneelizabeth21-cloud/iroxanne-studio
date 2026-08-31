import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroSection from '@/components/home/HeroSection.jsx';
import MerchSection from '@/components/home/MerchSection';
import StageSection from '@/components/home/StageSection';
import MusicReleaseFeaturedBanner from '@/components/MusicReleaseFeaturedBanner';
import MusicReleaseCard from '@/components/MusicReleaseCard';
import VideoCard from '@/components/VideoCard';
import NewsletterSignup from '@/components/NewsletterSignup';
import PromoBannerStack from '@/components/PromoBannerStack';
import InstagramFeed from '@/components/home/InstagramFeed';
import PullToRefresh from '@/components/PullToRefresh';
import DocumentMeta from '@/components/DocumentMeta';

export default function Home() {
  // Stage Black is a dark-stage look: render the home page in dark mode so the
  // near-black stage + gold-rimmed glass modules match the design, restoring the
  // visitor's prior theme when they navigate away.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    if (!wasDark) root.classList.add('dark');
    return () => { if (!wasDark) root.classList.remove('dark'); };
  }, []);

  const queryClient = useQueryClient();
  const { data: releases = [] } = useQuery({
    queryKey: ['music-releases-home'],
    queryFn: () => base44.entities.MusicRelease.list('-release_date', 20),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['videos-home'],
    queryFn: () => base44.entities.Video.list('-created_date', 3),
  });

  const { data: hpSettingsList, isLoading: settingsLoading } = useQuery({
    queryKey: ['homepage-settings'],
    queryFn: () => base44.entities.HomePageSettings.list(),
  });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['music-releases-home'] }),
      queryClient.invalidateQueries({ queryKey: ['videos-home'] }),
      queryClient.invalidateQueries({ queryKey: ['homepage-settings'] }),
    ]);
  };

  const hpSettings = hpSettingsList?.[0] || {};

  // Exclude deactivated releases from homepage display
  const activeReleases = releases.filter((r) => r.is_active !== false);

  // Respect featured_release_id override from settings
  const featured = hpSettings.featured_release_id
    ? activeReleases.find((r) => r.id === hpSettings.featured_release_id) || activeReleases.find((r) => r.featured) || activeReleases[0]
    : activeReleases.find((r) => r.featured) || activeReleases[0];

  const latestReleases = activeReleases.filter((r) => r.id !== featured?.id).slice(0, 3);

  const showVideos = hpSettings.show_video_preview !== false && videos.length > 0;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div>
      <DocumentMeta
        title={hpSettings.hero_title ? `${hpSettings.hero_title} — Official Site` : undefined}
        image={hpSettings.homepage_social_share_image || undefined}
        url={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined}
        type="website"
        siteName="Roxsan Music"
      />
      <PromoBannerStack pageKey="home" />
      <HeroSection settings={hpSettings} />

      {/* Featured Release */}
      {hpSettings.show_featured_release !== false && featured && (
        <section className="px-4 py-3">
          <div className="max-w-5xl mx-auto">
            <MusicReleaseFeaturedBanner release={featured} />
          </div>
        </section>
      )}

      {/* Latest Music + Latest Videos — side by side when both have content */}
      <div className="px-4 py-3 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {latestReleases.length > 0 && (
          <StageSection fluid title="Latest Music" actionTo="/music" actionLabel="View All" className={showVideos ? '' : 'md:col-span-2'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {latestReleases.map((r) => (
                <MusicReleaseCard key={r.id} release={r} />
              ))}
            </div>
          </StageSection>
        )}
        {showVideos && (
          <StageSection fluid title="Latest Videos" actionTo="/videos" actionLabel="View All" className={latestReleases.length > 0 ? '' : 'md:col-span-2'}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </StageSection>
        )}
      </div>

      {/* Merch + Instagram — side by side */}
      <div className="px-4 py-3 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <MerchSection fluid />
        <InstagramFeed fluid />
      </div>

      {hpSettings.show_newsletter !== false && <NewsletterSignup />}
    </div>
    </PullToRefresh>
  );
}