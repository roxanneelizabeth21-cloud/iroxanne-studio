export default function FollowRoxsan({ links = [] }) {
  if (!links || links.length === 0) return null;
  return (
    <section className="relative px-4 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#e8b85a] mb-3">Connect with Roxsan</p>
        <div className="flex flex-wrap justify-center gap-2">
          {links.map((l) => (
            <a
              key={l.name}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#3d2b1f]/60 bg-[#140e0a]/80 text-xs sm:text-sm text-[#f5e6d3] hover:border-[#d4a04a]/60 hover:bg-[#1f1610] transition-all duration-300 hover:scale-[1.03]"
            >
              <l.Icon className="h-3.5 w-3.5 text-[#e8b85a] shrink-0" />
              {l.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}