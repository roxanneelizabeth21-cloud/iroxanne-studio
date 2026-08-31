import { ArrowUpRight } from 'lucide-react';

export default function FeaturedWork({ items, loading }) {
  if (!loading && (!items || items.length === 0)) return null;
  return (
    <section id="work" className="mx-auto max-w-6xl border-t border-white/5 px-6 py-20">
      <div>
        <h2 className="font-sans text-3xl font-bold tracking-tight">Selected work</h2>
        <p className="mt-2 text-muted-foreground">Real apps, built for real businesses.</p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(loading ? Array.from({ length: 3 }) : items).map((item, i) => (
          <article
            key={item?.id || i}
            className="group rounded-2xl border border-white/10 bg-card/50 transition hover:border-primary/40"
          >
            <div className="aspect-video overflow-hidden bg-muted/30">
              {item?.cover_image_url ? (
                <img
                  src={item.cover_image_url}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                  {item?.title || (loading ? '' : 'Project')}
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{item?.title || (loading ? '—' : '')}</h3>
                {item?.project_url && (
                  <a href={item.project_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item?.tagline || item?.description}</p>
              {item?.tech_used?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.tech_used.slice(0, 4).map((t) => (
                    <span key={t} className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}