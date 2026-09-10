import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ArrowUpRight, Calendar } from 'lucide-react';
import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';

export default function CaseStudy() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const results = await base44.entities.PortfolioItem.filter({ slug });
        if (active) setItem(results[0] || null);
      } catch {
        if (active) setItem(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-6 pt-[140px] pb-20">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to work
        </Link>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !item ? (
          <div className="py-32 text-center">
            <h1 className="font-sans text-2xl font-bold">Project not found</h1>
            <p className="mt-2 text-muted-foreground">This case study isn't available yet.</p>
            <Link to="/" className="mt-6 inline-block text-primary hover:underline">View all work</Link>
          </div>
        ) : (
          <article className="mt-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {item.category && (
                <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{item.category}</span>
              )}
              {item.date_built && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(item.date_built).getFullYear()}
                </span>
              )}
            </div>

            <h1 className="mt-4 font-sans text-4xl font-bold tracking-tight">{item.title}</h1>
            {item.tagline && <p className="mt-3 text-lg text-muted-foreground">{item.tagline}</p>}

            {item.cover_image_url && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-border">
                <img src={item.cover_image_url} alt={item.title} className="w-full object-cover" />
              </div>
            )}

            {item.client_shareable && item.client_name && (
              <p className="mt-6 text-sm text-muted-foreground">
                Built for <span className="font-semibold text-foreground">{item.client_name}</span>
              </p>
            )}

            {item.description && (
              <div className="mt-8 space-y-4 text-base leading-relaxed text-foreground/90">
                {item.description.split('\n').map((p, i) => (p.trim() ? <p key={i}>{p}</p> : null))}
              </div>
            )}

            {item.tech_used?.length > 0 && (
              <div className="mt-8">
                <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">Built with</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tech_used.map((tech) => (
                    <span key={tech} className="rounded-lg border border-border bg-card/50 px-3 py-1 text-xs">{tech}</span>
                  ))}
                </div>
              </div>
            )}

            {item.screenshots?.length > 0 && (
              <div className="mt-8">
                <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">Gallery</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {item.screenshots.map((src, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-border">
                      <img src={src} alt={`${item.title} screenshot ${i + 1}`} className="w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.video_url && (
              <div className="mt-8">
                <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">Demo</h2>
                <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-border">
                  {item.video_url.includes('youtube') || item.video_url.includes('youtu.be') ? (
                    <iframe
                      src={item.video_url.replace('watch?v=', 'embed/')}
                      className="h-full w-full"
                      title={`${item.title} demo`}
                      allowFullScreen
                    />
                  ) : (
                    <video src={item.video_url} controls className="h-full w-full" />
                  )}
                </div>
              </div>
            )}

            {item.project_url && (
              <a
                href={item.project_url}
                target="_blank"
                rel="noreferrer"
                className="mt-10 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Visit live project <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}