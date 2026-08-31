import { Quote } from 'lucide-react';

export default function Testimonials({ items, loading }) {
  const list = (items || []).slice(0, 2);
  if (!loading && list.length === 0) return null;
  return (
    <section className="mx-auto max-w-4xl border-t border-white/5 px-6 py-20">
      <h2 className="text-center font-sans text-3xl font-bold tracking-tight">What clients say</h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {list.map((t) => {
          const anonymous = t.client_anonymous || !t.client_name;
          const name = anonymous ? 'A recent client' : t.client_name;
          const mark = anonymous
            ? '★'
            : name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
          return (
            <figure key={t.id} className="rounded-2xl border border-white/10 bg-card/50 p-6">
              <Quote className="h-6 w-6 text-primary/60" />
              <blockquote className="mt-3 text-lg leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {mark}
                </span>
                <span className="text-sm text-muted-foreground">{name}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}