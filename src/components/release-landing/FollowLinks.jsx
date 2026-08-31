export default function FollowLinks({ heading = 'Connect with Roxsan', links = [], theme }) {
  if (!links || links.length === 0) return null;
  return (
    <section className="relative px-4 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] mb-3" style={{ color: theme.accent }}>{heading}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {links.map((l) => (
            <a
              key={l.name}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs sm:text-sm transition-all duration-300 hover:scale-[1.03]"
              style={{ borderColor: theme.border, background: theme.cardBg, color: theme.text }}
            >
              <l.Icon className="h-3.5 w-3.5 shrink-0" style={{ color: theme.accent }} />
              {l.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}