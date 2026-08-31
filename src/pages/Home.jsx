import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

import SiteNav from '@/components/home/SiteNav';
import Hero from '@/components/home/Hero';
import FeaturedWork from '@/components/home/FeaturedWork';
import Testimonials from '@/components/home/Testimonials';
import SiteFooter from '@/components/home/SiteFooter';

export default function Home() {
  const [projects, setProjects] = useState(null);
  const [testimonials, setTestimonials] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [proj, test] = await Promise.all([
          base44.entities.PortfolioItem
            .list('-sort_order', 6)
            .catch(() => []),

          base44.entities.Testimonial
            .filter(
              { approved_for_use: true },
              '-date',
              3
            )
            .catch(() => []),
        ]);

        if (!active) return;

        setProjects(proj);
        setTestimonials(test);
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
        <Hero projects={projects} loading={loading} />

        <FeaturedWork
          items={projects}
          loading={loading}
        />

        <Testimonials
          items={testimonials}
          loading={loading}
        />

      </main>

      <SiteFooter />
    </div>
  );
}