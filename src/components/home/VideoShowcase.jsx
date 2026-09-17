import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Play } from 'lucide-react';

function VideoCard({ video = {} }) {
  const [open, setOpen] = useState(false);
  const hasYouTube = !!video?.youtube_url;
  const hasFile = !!video?.optional_video_file;
  const embedUrl = hasYouTube
    ? video.youtube_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
    : null;

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-[#B8942E]/30 hover:shadow-[0_12px_40px_rgba(45,42,74,0.06)]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block w-full aspect-video overflow-hidden bg-background"
        aria-label={`Play ${video.title}`}
      >
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
            {video.title}
          </div>
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/20 transition group-hover:bg-black/30">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-[#2D2A4A] shadow-lg transition group-hover:scale-110">
            <Play className="h-5 w-5 fill-current" />
          </span>
        </span>
      </button>
      <div className="p-5">
        <h3 className="text-[15px] font-semibold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{video.title}</h3>
        {video.description && (
          <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>{video.description}</p>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {embedUrl ? (
              <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
                <iframe
                  src={`${embedUrl}?autoplay=1`}
                  title={video.title}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : hasFile ? (
              <video
                src={video.optional_video_file}
                controls
                autoPlay
                className="aspect-video w-full rounded-xl bg-black shadow-2xl"
              />
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-4 -right-4 grid h-9 w-9 place-items-center rounded-full bg-white text-[#2D2A4A] shadow-lg"
              aria-label="Close video"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

VideoCard.defaultProps = { video: {} };

export default function VideoShowcase({ limit = 6 }) {
  const [videos, setVideos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await base44.entities.Video.list('-created_date', limit);
        if (active) setVideos(list || []);
      } catch {
        if (active) setVideos([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [limit]);

  if (!loading && (!videos || videos.length === 0)) return null;

  return (
    <section id="videos" className="scroll-mt-24 px-5 py-12 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-medium text-[#876b26] dark:text-[#D5BB82] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Watch</p>
        <h2 className="text-[28px] md:text-[32px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Videos
        </h2>
        <p className="mt-3 max-w-[480px] text-[15px] text-muted-foreground leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          A look at some of the projects and moments I've shared.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(loading ? Array.from({ length: 3 }) : videos).map((video, i) => (
            <VideoCard key={video?.id || i} video={video || {}} />
          ))}
        </div>
      </div>
    </section>
  );
}