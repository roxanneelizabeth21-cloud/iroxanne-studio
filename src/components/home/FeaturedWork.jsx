import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function FeaturedWork({ items, loading }) {
  if (!loading && (!items || items.length === 0)) return null;
  return (
    <section id="work" className="bg-white py-14 px-5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-medium text-[#B8942E] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Selected work</p>
        <h2 className="text-[34px] md:text-[40px] font-semibold text-[#2D2A4A] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          A few projects I’ve worked on
        </h2>
        <p className="mt-3 max-w-[480px] text-[15px] text-[#2D2A4A]/50 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          Each project starts with someone’s idea. These examples show some of the different ways an app can support a new venture or an existing business.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(loading ? Array.from({ length: 3 }) : items).map((item, i) => {
            const hasCaseStudy = !!item?.slug;
            const inner = (
              <>
                <div className="aspect-[4/3] overflow-hidden bg-[#FAF7F0]">
                  {item?.cover_image_url ? (
                    <img src={item.cover_image_url} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm text-[#2D2A4A]/25" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {item?.title || ''}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-[#2D2A4A]" style={{ fontFamily: "'Inter', sans-serif" }}>{item?.title || '—'}</h3>
                    {!hasCaseStudy && item?.project_url && (
                      <a href={item.project_url} target="_blank" rel="noreferrer" className="text-[#2D2A4A]/30 hover:text-[#B8942E] transition">
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {item?.category && <p className="text-[11px] font-medium text-[#B8942E]/70 mt-1 tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{item.category}</p>}
                  <p className="mt-2 text-[13px] text-[#2D2A4A]/45 leading-relaxed line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>{item?.tagline || item?.description}</p>
                </div>
              </>
            );
            const cls = 'group block overflow-hidden rounded-2xl border border-[#2D2A4A]/6 bg-white transition hover:border-[#B8942E]/30 hover:shadow-[0_12px_40px_rgba(45,42,74,0.06)]';
            return hasCaseStudy ? (
              <Link key={item?.id || i} to={`/work/${item.slug}`} className={cls}>{inner}</Link>
            ) : (
              <article key={item?.id || i} className={cls}>{inner}</article>
            );
          })}
        </div>
      </div>
    </section>
  );
}