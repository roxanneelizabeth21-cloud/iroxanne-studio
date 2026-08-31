import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoCard from '@/components/VideoCard';
import PageBanner from '@/components/PageBanner';
import PullToRefresh from '@/components/PullToRefresh';

function getYouTubeEmbedUrl(url, autoplay = false) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}${autoplay ? '?autoplay=1' : ''}`;
}


export default function Videos() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [activeVideo, setActiveVideo] = useState(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['all-videos'],
    queryFn: () => base44.entities.Video.list('-created_date'),
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['all-videos'] });
  };

  const featured = videos.find((v) => v.featured) || videos[0];
  const filtered = filter === 'all' ? videos : videos.filter((v) => v.type === filter);
  const featuredEmbedUrl = getYouTubeEmbedUrl(featured?.youtube_url);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen">
      <PageBanner pageKey="videos" icon={Film} badge="Visual Stories" title="Videos" subtitle="Watch the music come to life." />

      <div className="max-w-6xl mx-auto px-4 pb-20 space-y-12">
        {/* Featured Video */}
        {featured && (featuredEmbedUrl || featured.optional_video_file) && (
          <div className="rounded-2xl overflow-hidden glow-blue">
            <div className="aspect-video">
              {featuredEmbedUrl ? (
                <iframe
                  src={featuredEmbedUrl}
                  title={featured.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  loading="lazy"
                />
              ) : (
                <video
                  src={featured.optional_video_file}
                  controls
                  className="w-full h-full object-cover"
                  poster={featured.thumbnail}
                />
              )}
            </div>
            <div className="p-6 glass">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-semibold">{featured.title}</h2>
                  {featured.description && <p className="text-sm text-muted-foreground mt-1">{featured.description}</p>}
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize shrink-0">
                  {featured.type?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="overflow-x-auto">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="music_video">Music Videos</TabsTrigger>
              <TabsTrigger value="lyric_video">Lyric Videos</TabsTrigger>
              <TabsTrigger value="reel">Reels</TabsTrigger>
              <TabsTrigger value="behind_the_scenes">BTS</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((v) => (
              <VideoCard key={v.id} video={v} onClick={setActiveVideo} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Film className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No videos in this category yet.</p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveVideo(null)}
          >
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 transition-colors" onClick={() => setActiveVideo(null)}>
              <X className="h-6 w-6" />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video rounded-xl overflow-hidden">
                {activeVideo.optional_video_file && !activeVideo.youtube_url ? (
                  <video
                    src={activeVideo.optional_video_file}
                    autoPlay
                    controls
                    className="w-full h-full"
                    poster={activeVideo.thumbnail}
                  />
                ) : (
                  <iframe
                    src={getYouTubeEmbedUrl(activeVideo.youtube_url, true)}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                )}
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-white font-display text-lg font-semibold">{activeVideo.title}</h3>
                {activeVideo.description && <p className="text-white/60 text-sm mt-1">{activeVideo.description}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PullToRefresh>
  );
}