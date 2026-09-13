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