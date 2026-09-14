import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import BrandedPageHeader, { BrandedFooter, PrintButton } from '@/components/BrandedPageHeader';
import { RUSH_TERMS, defaultHandoff } from '../../base44/shared/studioDelivery.ts';

// Read the live sources used by new agreements and the two public legal pages.
// Never put client records, private links, signature data, or credentials here.
export default function DocumentReview() {
  useEffect(() => {
    const tag = document.createElement('meta');
    tag.name = 'robots'; tag.content = 'noindex, nofollow';
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['document-review'],
    queryFn: async () => {
      const [settings, pages] = await Promise.all([
        base44.entities.PricingSettings.list('-updated_date', 100),
        base44.entities.LegalPage.list('-updated_date', 100),
      ]);
      const populated = settings.filter(s => s.standard_terms?.trim());
      if (populated.length !== 1) throw new Error('The agreement source needs an administrator review. Expected one populated master template.');
      const master = populated[0];
      const getPage = key => {
        const matches = pages.filter(p => p.page_key === key);
        if (matches.length !== 1 || !matches[0].content?.trim()) throw new Error('The ' + key + ' policy needs an administrator review.');
        return matches[0];
      };
      const terms = getPage('terms'), privacy = getPage('privacy');
      return {
        revision: 'Agreement ' + master.updated_date + ' | Terms ' + terms.updated_date + ' | Privacy ' + privacy.updated_date,
        documents: [
          { id: 'agreement', title: 'Project Agreement', note: 'The current master terms copied into new project agreements. Each client agreement also includes its own scope, deliverables, price, and payment schedule. Existing agreements retain their saved terms.', content: master.standard_terms },
          { id: 'rush', title: 'Optional rush schedule addendum', note: 'Included only when an agreement is designated as a rush project.', content: master.rush_terms ?? RUSH_TERMS },
          { id: 'terms', title: terms.title || 'Terms of Use', note: 'The same website policy displayed at /terms.', content: terms.content, markdown: true },
          { id: 'privacy', title: privacy.title || 'Privacy Policy', note: 'The same policy displayed at /privacy.', content: privacy.content, markdown: true },
        ],
      };
    },
  });
  const download = () => {
    const text = 'iRoxanne Studio — document review\nRetrieved: ' + new Date().toISOString() + '\nSource revisions: ' + data.revision +
      '\n\n' + data.documents.map(d => d.title + '\n' + d.note + '\n\n' + d.content).join('\n\n--------------------\n\n') +
      '\n\nDEFAULT HANDOFF CHECKLIST (customized for each project)\n' + defaultHandoff().map(x => '- ' + x.category + ': ' + x.label).join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'iRoxanne-Studio-document-review.txt'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="studio-surface min-h-screen bg-background px-4 py-10">
    <div className="max-w-4xl mx-auto space-y-8">
      <BrandedPageHeader title="Document review" subtitle="iRoxanne Studio — current agreement and website policies" />
      <p>This page presents the saved documents currently used by the app. It is read-only and does not create, accept, or sign an agreement. The website policies and project agreement serve different purposes.</p>
      {isLoading && <p role="status">Loading current documents…</p>}
      {error && <div role="alert"><p>{error.message}</p><Button onClick={() => refetch()}>Try again</Button></div>}
      {data && <>
        <div className="flex flex-wrap items-center gap-4 print:hidden">
          <Button onClick={download}>Download all document text</Button><PrintButton />
        </div>
        <p className="text-xs break-words text-muted-foreground">Source revisions: {data.revision}</p>
        <nav aria-label="Review documents" className="flex flex-wrap gap-4 print:hidden">
          {data.documents.map(d => <a key={d.id} className="underline" href={'#' + d.id}>{d.title}</a>)}
          <a className="underline" href="#flow">Client flow</a>
        </nav>
        {data.documents.map(d => <article id={d.id} key={d.id} className="scroll-mt-6 border rounded-xl bg-card p-5 sm:p-8">
          <h2 className="font-display text-2xl mb-3">{d.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{d.note}</p>
          {d.markdown ? <div className="text-foreground leading-7 space-y-4 [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:mt-6 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6"><ReactMarkdown>{d.content}</ReactMarkdown></div>
            : <div className="text-foreground text-sm whitespace-pre-wrap leading-7">{d.content}</div>}
        </article>)}
        <section id="flow" className="border rounded-xl bg-card p-5 sm:p-8 space-y-4">
          <h2 className="font-display text-2xl">Client flow and project-specific documents</h2>
          <p>Project-specific proposals, agreements, invoices, intakes, and handoffs use private client links. Ask Roxanne for a designated test project's links to examine those screens. Do not use an existing client's documents for testing.</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li><Link className="underline" to="/quote">Quote request</Link>: contact details and email verification, project choices, budget, and submission confirmation.</li>
            <li><Link className="underline" to="/book-call">Optional call booking</Link>: availability and confirmation.</li>
            <li>Proposal: scope, deliverables, investment, timeline, and accept / request changes / decline.</li>
            <li>Agreement: project-specific details and saved terms, optional rush addendum, typed or drawn signature, and electronic consent.</li>
            <li>Invoice: deposit, balance, voluntary payments, payment history, and Square checkout. Published checkout can take real money; do not submit payment merely to review the document.</li>
            <li>Content intake: dynamic project sections, account setup and referral disclosure, content and document uploads.</li>
            <li>Handoff: completed delivery checklist and express acceptance or follow-up request, after completion and full payment.</li>
            <li>Testimonial request: optional permission to publish and chosen display name.</li>
          </ol>
          <h3 className="font-semibold">Default handoff checklist</h3>
          <p className="text-sm">These are the starting checklist items. Each project's actual checklist records its own completion and notes.</p>
          <ul className="list-disc pl-6 space-y-1">{defaultHandoff().map(x => <li key={x.id}>{x.label}</li>)}</ul>
          <p className="text-sm">Reading these documents does not verify checkout, email delivery, calendar connections, or the complete live workflow.</p>
        </section>
      </>}
      <BrandedFooter />
    </div>
  </div>;
}
