import { ArrowUpRight } from 'lucide-react';

export default function FeaturedWork({ items, loading }) {
  if (!loading && (!items || items.length === 0)) return null;
  return (
    <section id="work" className="mx-auto max-w-6xl border-t border-border px-6 py-20">
      <div>
        <h2 className="font-sans text-3xl font-bold tracking-tight">Selected work</h2>
        <p className="mt-2 text-muted-foreground">I build for anyone.</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {(loading ? Array.from({ length: 3 }) : items).map((item, i) => (
          <article
            key={item?.id || i}
            className="group overflow-hidden rounded-xl border border-border bg-card/50 transition hover:border-primary/40"
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
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{item?.title || (loading ? '—' : '')}</h3>
                {item?.project_url && (
                  <a href={item.project_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item?.tagline || item?.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}