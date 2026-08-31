export default function YouTubeSection({ embedUrl }) {
  if (!embedUrl) return null;
  return (
    <section id="youtube" className="relative px-4 py-14 sm:py-16 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#e8b85a] mb-3">Visuals</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#f5e6d3]">Watch on YouTube</h2>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#d4a04a] to-transparent" />
        </div>
        <div
          className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#3d2b1f]/60"
          style={{ boxShadow: '0 0 60px rgba(232,112,60,0.18), 0 20px 50px rgba(0,0,0,0.5)' }}
        >
          <iframe
            src={embedUrl}
            title="YouTube video"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}