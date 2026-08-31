import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Loader2, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageBanner from '@/components/PageBanner';

// Public legal page (Privacy Policy / Terms of Use).
// Content is stored in the LegalPage entity (public read, admin write) and
// rendered as Markdown. page_key comes from the route: /privacy, /terms.
export default function LegalPage() {
  const location = useLocation();
  const slug = location.pathname.replace('/', ''); // 'privacy' | 'terms'
  const pageKey = slug;

  const { data: page, isLoading } = useQuery({
    queryKey: ['legal-page', pageKey],
    queryFn: async () => {
      const results = await base44.entities.LegalPage.filter({ page_key: pageKey });
      return results[0] || null;
    },
  });

  const lastUpdated = page?.last_updated
    ? new Date(page.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <>
      <PageBanner pageKey={slug} />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !page ? (
          <div className="text-center py-20">
            <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
            <h1 className="font-display text-2xl font-semibold mb-2">
              {slug === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
            </h1>
            <p className="text-sm text-muted-foreground">
              This page is being prepared. Please check back soon.
            </p>
          </div>
        ) : (
          <article>
            <header className="mb-10 text-center">
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                {page.title || (slug === 'terms' ? 'Terms of Use' : 'Privacy Policy')}
              </h1>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Last updated {lastUpdated}
                </p>
              )}
            </header>
            <div className="prose-legal text-foreground/90 leading-relaxed space-y-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h3]:font-semibold [&_h3]:mt-6 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-semibold">
              <ReactMarkdown>{page.content || ''}</ReactMarkdown>
            </div>
          </article>
        )}
      </section>
    </>
  );
}