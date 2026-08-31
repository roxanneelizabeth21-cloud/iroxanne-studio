// Per-release personal story from Roxsan. Renders nothing when the release has
// no behind_the_scenes text, so pages without a story show no empty section.
export default function BehindTheSongSection({ theme, text }) {
  const body = (text || '').trim();
  if (!body) return null;
  const paragraphs = body.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <section className="relative px-4 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] mb-3 text-center" style={{ color: theme.accent }}>
          Behind the Song
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-6 text-center" style={{ color: theme.text }}>
          The Story
        </h2>
        <div className="space-y-4 text-base leading-relaxed" style={{ color: theme.textMuted }}>
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    </section>
  );
}