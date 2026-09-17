import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

import SiteNav from '@/components/home/SiteNav';
import Hero from '@/components/home/Hero';

import Process from '@/components/home/Process';
import Services from '@/components/home/Services';
import Testimonials from '@/components/home/Testimonials';
import VideoShowcase from '@/components/home/VideoShowcase';
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
            .filter({ featured: true }, 'sort_order', 3)
            .catch(() => []),

          base44.functions.invoke('testimonialFeedback', { action: 'public' })
            .then(r => (r.data || r).items || []).catch(() => []),

          base44.entities.HomePageSettings
            .list()
            .catch(() => []),
        ]);

        if (!active) return;

        setProjects(proj || []);
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


        <Services />
        <Process />
        <section id="work" className="scroll-mt-24 border-y border-border bg-card px-5 py-10">
          <div className="max-w-5xl mx-auto md:flex items-center justify-between gap-8">
            <div><h2 className="font-display text-3xl">Different ideas. Real possibilities.</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">From family life and travel to relationships and small businesses, explore a few ideas I’ve helped bring to life.</p></div>
            <a href="/ideas" className="inline-flex min-h-12 shrink-0 items-center rounded-full border border-border px-6 mt-5 md:mt-0 font-semibold">Explore the possibilities →</a>
          </div>
        </section>

        <Testimonials
          items={testimonials}
          loading={loading}
        />

        <VideoShowcase />

      </main>

      <SiteFooter />
    </div>
  );
}