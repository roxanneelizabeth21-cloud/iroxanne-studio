import { useEffect, useState } from 'react';
import { Play, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VideoShowcase() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('getPublicVideos', {});
        const data = res?.data ?? res;
        if (active) setVideos(data?.videos || []);
      } catch {
        if (active) setVideos([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (!loading && videos.length === 0) return null;

  const openVideo = (video) => setActive(video);
  const closeVideo = () => setActive(null);

  return (
    <section id="videos" className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-20">
      <p className="text-[12px] font-medium text-[#876b26] dark:text-[#D5BB82] tracking-[0.2em] uppercase mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Watch</p>
      <h2 className="text-[32px] md:text-[40px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Videos</h2>
      <p className="mt-3 text-[15px] text-muted-foreground max-w-xl" style={{ fontFamily: "'Inter', sans-serif" }}>A look at some of the projects and moments I've shared.</p>

      {loading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onPlay={openVideo} />
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={closeVideo}>
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeVideo} className="absolute -top-10 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close video">
              <X className="h-5 w-5" />
            </button>
            {active.youtube_url ? (
              <iframe
                src={active.youtube_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                className="aspect-video w-full rounded-xl bg-black shadow-2xl"
                title={active.title}
                allowFullScreen
              />
            ) : (
              <video
                src={active.file}
                controls
                autoPlay
                className="aspect-video w-full rounded-xl bg-black shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function VideoCard({ video, onPlay }) {
  const hasYouTube = !!video?.youtube_url;
  const hasFile = !!video?.file;

  return (
    <button
      onClick={() => onPlay(video)}
      className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-video overflow-hidden">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[#2D2A4A]/5 text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            {video.title}
          </div>
        )}
        <div className="absolute inset-0 grid place-items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#2D2A4A] shadow-md transition group-hover:scale-110">
            <Play className="h-5 w-5" />
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-[14px] font-semibold text-foreground line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>{video.title}</h3>
        {video.description && (
          <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>{video.description}</p>
        )}
      </div>
    </button>
  );
}