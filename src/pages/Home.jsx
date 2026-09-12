import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

import SiteNav from '@/components/home/SiteNav';
import Hero from '@/components/home/Hero';
import FeaturedWork from '@/components/home/FeaturedWork';
import Process from '@/components/home/Process';
import About from '@/components/home/About';
import Testimonials from '@/components/home/Testimonials';
import SiteFooter from '@/components/home/SiteFooter';

export default function Home() {
  const [projects, setProjects] = useState(null);
  const [testimonials, setTestimonials] = useState(null);
  const [headshotUrl, setHeadshotUrl] = useState(null);
  const [heroBackgroundImage, setHeroBackgroundImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [proj, test, settings] = await Promise.all([
          base44.entities.PortfolioItem
            .list('-sort_order', 10)
            .catch(() => []),

          base44.entities.Testimonial
            .filter(
              { approved_for_use: true },
              '-date',
              3
            )
            .catch(() => []),

          base44.entities.HomePageSettings
            .list()
            .catch(() => []),
        ]);

        if (!active) return;

        setProjects((proj || []).filter((p) => !/eventflow/i.test(p.title || p.client_name || p.business_name || '')));
        setTestimonials(test);
        setHeadshotUrl(settings?.[0]?.about_headshot_url || null);
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
    <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A4A]">
      <SiteNav />

      <main>
        <Hero projects={projects} loading={loading} heroBackgroundImage={heroBackgroundImage} />

        <FeaturedWork
          items={projects}
          loading={loading}
        />

        <Process />

        <About headshotUrl={headshotUrl} />

        <Testimonials
          items={testimonials}
          loading={loading}
        />

      </main>

      <SiteFooter />
    </div>
  );
}