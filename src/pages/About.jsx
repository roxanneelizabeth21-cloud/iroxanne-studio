import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';

export default function About() {
  const [headshotUrl, setHeadshotUrl] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const settings = await base44.entities.HomePageSettings.list().catch(() => []);
        if (!active) return;
        setHeadshotUrl(settings?.[0]?.about_headshot_url || null);
      } catch {
        /* ignore — image just won't show */
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="pt-[72px]">
        <section className="relative isolate overflow-hidden bg-[#302634] text-[#FAF3E5]">
          <img src="/images/hero-facebook-plum.png" alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover pointer-events-none" />
          <div className="mx-auto max-w-5xl px-5 md:px-8 py-12 grid gap-8 md:grid-cols-[240px_1fr] items-center">
            {headshotUrl && <img src={headshotUrl} alt="Roxanne, founder of iRoxanne Studio" className="w-48 md:w-60 aspect-[3/4] object-cover object-top rounded-2xl border border-[#D5BB82]/40 shadow-xl mx-auto" />}
            <div>
              <p className="text-sm tracking-widest text-[#D5BB82]">ABOUT IROXANNE STUDIO</p>
              <h1 className="font-display text-4xl md:text-5xl mt-4">Hi, I’m Roxanne.</h1>
              <p className="mt-4 max-w-xl leading-relaxed text-[#E4DCE2]">I help people turn an idea into something they can use and share. You do not need to have it all figured out before we begin.</p>
              <a href="/quote" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#E9D5A5] text-[#302634] px-7 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Request a quote <ArrowRight className="h-4 w-4"/></a>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-5 md:px-8 py-14">
        <h2 className="font-display text-3xl">A little about me and how I work</h2>
        <div className="mt-8 space-y-5 text-[15.5px] leading-[1.75] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
          <p>
            I'm <span className="font-semibold text-foreground">Roxanne</span>, the founder and builder behind iRoxanne Studio. I build custom apps for people who have an idea and want help turning it into something real. Whether you are launching a new business, running a small team, or just exploring a concept, I work with you to shape the idea, decide what belongs in a first version, and build it step by step with your feedback along the way.
          </p>
          <p>
            iRoxanne Studio is a custom app development service. I build booking systems, online stores, client portals, internal tools, and marketing dashboards. Every project starts with a conversation: I listen to what you need, ask questions, and help you figure out where to begin. You do not need to know the technical details or have everything worked out before we talk. We agree on the scope, cost, and timeline before any build begins.
          </p>
          <p>
            This service is for small business owners, solo founders, creators, and anyone with an idea they want to explore. If you have been told your project is too small for a traditional agency, or too custom for a no-code template, that is exactly who I build for. You work directly with me, not a team of account managers. There are no handoffs to someone you have never met, and no layers between you and the person building your app.
          </p>
          <p>
            I am a Base44 Partner, which means I build on a platform that lets me move quickly and keep costs transparent. My work includes everything from the first conversation through design, development, launch, and ongoing support if you want it. If you have an idea you would like to explore, I would love to hear about it.
          </p>

          <a href="/quote" className="inline-flex items-center gap-2 text-[14px] font-semibold text-foreground hover:text-[#876b26] dark:text-[#D5BB82] transition mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            Let's talk about your idea <ArrowRight className="h-4 w-4 text-[#876b26] dark:text-[#D5BB82]" />
          </a>
        </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}