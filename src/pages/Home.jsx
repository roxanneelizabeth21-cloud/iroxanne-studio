import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

import SiteNav from '@/components/home/SiteNav';
import Hero from '@/components/home/Hero';
import FeaturedWork from '@/components/home/FeaturedWork';
import Process from '@/components/home/Process';
import Services from '@/components/home/Services';
import Testimonials from '@/components/home/Testimonials';
import SiteFooter from '@/components/home/SiteFooter';

export default function Home() {
  const [projects, setProjects] = useState(null);
  const [testimonials, setTestimonials] = useState(null);
  const [heroBackgroundImage, setHeroBackgroundImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        setTimeout(() => {
          target.style.scrollMarginTop = '96px';
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [proj, test, settings] = await Promise.all([
          base44.entities.PortfolioItem
            .list('-sort_order', 10)
            .catch(() => []),

          base44.functions.invoke('testimonialFeedback', { action: 'public' })
            .then(r => (r.data || r).items || []).catch(() => []),

          base44.entities.HomePageSettings
            .list()
            .catch(() => []),
        ]);

        if (!active) return;

        setProjects((proj || []).filter((p) => !/eventflow/i.test(p.title || p.client_name || p.business_name || '')));
        setTestimonials(test);
        setHeroBackgroundImage(settings?.[0]?.hero_background_image || null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <main>
        <Hero projects={projects} loading={loading} heroBackgroundImage={heroBackgroundImage} />


        <section aria-labelledby="support-heading" className="mx-auto max-w-6xl px-5 py-12 md:px-8">
          <h2 id="support-heading" className="text-[34px] md:text-[40px] font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Build with the support you need</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">You may have a clear plan, a half-built app, or just an idea. We can work out a useful next step together.</p>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-[#C9B78C]/40 bg-card/60 p-6">
              <h3 className="text-2xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Let me help you build it</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">I can help shape your idea, decide what belongs in a first version, and design and build the app with your feedback along the way.</p>
              <a className="mt-5 inline-flex min-h-12 items-center rounded-full bg-[#2D2A4A] px-6 text-sm font-semibold text-[#FAF7F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" href="/quote?support=build">Tell me about your idea</a>
            </article>
            <article className="rounded-2xl border border-[#C9B78C]/40 bg-card/60 p-6">
              <h3 className="text-2xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Build it yourself, with guidance</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">Prefer to be hands-on? I can help you plan your first version, think through features, or review what you have started. We will agree on the help you need and its cost before we begin.</p>
              <a className="mt-5 inline-flex min-h-12 items-center rounded-full border border-[#2D2A4A] px-6 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" href="/quote?support=guidance">Ask about guidance</a>
            </article>
          </div>
        </section>

        <Services />
        <Process />
        <FeaturedWork items={projects} loading={loading} />

        <Testimonials
          items={testimonials}
          loading={loading}
        />

      </main>

      <SiteFooter />
    </div>
  );
}