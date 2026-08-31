import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Music as MusicIcon, Disc3 } from 'lucide-react';
import MusicReleaseCard from '@/components/MusicReleaseCard';
import MusicReleaseFeaturedBanner from '@/components/MusicReleaseFeaturedBanner';
import PageBanner from '@/components/PageBanner';
import PromoBannerStack from '@/components/PromoBannerStack';
import PullToRefresh from '@/components/PullToRefresh';

export default function Music() {
  const queryClient = useQueryClient();
  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['music-releases-public'],
    queryFn: () => base44.entities.MusicRelease.list('-release_date', 200),
  });

  const { data: hpSettingsList } = useQuery({
    queryKey: ['homepage-settings'],
    queryFn: () => base44.entities.HomePageSettings.list(),
  });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['music-releases-public'] }),
      queryClient.invalidateQueries({ queryKey: ['homepage-settings'] }),
      queryClient.invalidateQueries({ queryKey: ['tracks'] }),
      queryClient.invalidateQueries({ queryKey: ['music-platform-links'] }),
    ]);
  };

  const hpSettings = hpSettingsList?.[0] || {};
  const visible = releases.filter((r) => r.is_active !== false);
  const featured = hpSettings.featured_release_id
    ? visible.find((r) => r.id === hpSettings.featured_release_id) || visible.find((r) => r.featured) || visible[0] || null
    : visible.find((r) => r.featured) || visible[0] || null;
  const rest = visible.filter((r) => r.id !== featured?.id);
  const isAlbum = (r) => /album/i.test(r.release_type || '');
  const albums = rest.filter(isAlbum);
  const singles = rest.filter((r) => !isAlbum(r));

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen">
        <PromoBannerStack pageKey="music" />
        <PageBanner pageKey="music" icon={MusicIcon} badge="Discography" title="Music" subtitle="Every song is a piece of the story. Listen wherever you feel most at home." />

        <div className="max-w-6xl mx-auto px-4 pb-20 space-y-12">
          {featured && <MusicReleaseFeaturedBanner release={featured} />}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (albums.length > 0 || singles.length > 0) ? (
            <>
              {albums.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-5">
                    <Disc3 className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-2xl font-semibold">Albums</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {albums.map((r) => (
                      <MusicReleaseCard key={r.id} release={r} />
                    ))}
                  </div>
                </section>
              )}
              {singles.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-5">
                    <MusicIcon className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-2xl font-semibold">Singles</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {singles.map((r) => (
                      <MusicReleaseCard key={r.id} release={r} />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            !featured && (
              <div className="text-center py-20">
                <MusicIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Music coming soon. Stay tuned.</p>
              </div>
            )
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}