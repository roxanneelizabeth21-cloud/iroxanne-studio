export default function YouTubeEmbedPlaceholder({ embedUrl, theme }) {
  if (!embedUrl) return null;
  return (
    <section id="youtube" className="relative px-4 py-14 sm:py-16 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: theme.accent }}>Visuals</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: theme.text }}>Listen on YouTube</h2>
          <div
            className="mx-auto mt-4 h-px w-24"
            style={{ background: `linear-gradient(to right, transparent, ${theme.accent}, transparent)` }}
          />
        </div>
        <div
          className="relative aspect-video w-full rounded-2xl overflow-hidden border"
          style={{ borderColor: theme.border, boxShadow: `0 0 60px ${theme.glow}, 0 20px 50px rgba(0,0,0,0.5)` }}
        >
          <iframe
            src={embedUrl}
            title="YouTube video"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}