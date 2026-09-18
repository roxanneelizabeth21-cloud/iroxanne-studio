export default function Testimonials({ items, loading }) {
  const list = (items || []).slice(0, 3);
  if (list.length === 0) return null;
  return (
    <section className="bg-[#2D2A4A] py-8 px-5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-medium text-[#C9A84C] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Client words</p>
        <h2 className="text-[34px] md:text-[40px] font-semibold text-white tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          What it's like to work together
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => {
            const anonymous = t.client_anonymous || !t.client_name;
            const name = anonymous ? 'A recent client' : t.client_name;
            const initials = anonymous ? '★' : name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
            return (
              <figure key={t.id} className="rounded-2xl bg-card/[0.06] border border-white/[0.08] p-5 backdrop-blur-sm">
                <div className="h-1 w-8 rounded-full bg-[#C9A84C]/50 mb-5" />
                <blockquote className="text-[15px] leading-[1.8] text-white/80" style={{ fontFamily: "'Inter', sans-serif" }}>
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#C9A84C]/20 text-[11px] font-semibold text-[#C9A84C]">{initials}</span>
                  <div>
                    <span className="text-[13px] font-medium text-white/90" style={{ fontFamily: "'Inter', sans-serif" }}>{name}</span>
                    {t.project_name && <span className="block text-[11px] text-white/40">{t.project_name}</span>}
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}