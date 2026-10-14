import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

import SiteNav from '@/components/home/SiteNav';
import Hero from '@/components/home/Hero';

import Process from '@/components/home/Process';
import FeaturedWork from '@/components/home/FeaturedWork';
import About from '@/components/home/About';
import CalendarPreview from '@/components/home/CalendarPreview';
import BusinessConcepts from '@/components/home/BusinessConcepts';
import '@/components/home/studio.css';
import Testimonials from '@/components/home/Testimonials';
import VideoShowcase from '@/components/home/VideoShowcase';
import SiteFooter from '@/components/home/SiteFooter';

export default function Home() {
  const [projects, setProjects] = useState(null);
  const [testimonials, setTestimonials] = useState(null);
  const [headshotUrl, setHeadshotUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        setTimeout(() => {
          target.style.scrollMarginTop = '96px';
          target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
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
            .list('sort_order', 100)
            .catch(() => []),

          base44.functions.invoke('testimonialFeedback', { action: 'public' })
            .then(r => (r.data || r).items || []).catch(() => []),

          base44.entities.HomePageSettings
            .list()
            .catch(() => []),
        ]);

        if (!active) return;

        const slugs = ['quiet-time-daily', 'booked-now-what', 'nestflow'];
        setProjects(slugs.map(slug => (proj || []).find(p => p.slug === slug)).filter(Boolean));
        setTestimonials(test);
        setHeadshotUrl(settings?.[0]?.about_headshot_url || null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="studio-public min-h-screen bg-background text-foreground">
      <SiteNav />

      <main>
        <Hero projects={projects} loading={loading}  />


        <CalendarPreview />
        <BusinessConcepts />
        <FeaturedWork items={projects} loading={loading} />
        <Process />
        <About headshotUrl={headshotUrl} />

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