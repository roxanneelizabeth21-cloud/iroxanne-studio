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
          <div className="mx-auto max-w-5xl px-5 md:px-8 py-8 grid gap-6 md:grid-cols-[240px_1fr] items-center">
            {headshotUrl && <img src={headshotUrl} alt="Roxanne, founder of iRoxanne Studio" className="w-48 md:w-60 aspect-[3/4] object-cover object-top rounded-2xl border border-[#D5BB82]/40 shadow-xl mx-auto" />}
            <div>
              <p className="text-sm tracking-widest text-[#D5BB82]">ABOUT IROXANNE STUDIO</p>
              <h1 className="font-display text-4xl md:text-5xl mt-4">Hi, I’m Roxanne.</h1>
              <p className="mt-4 max-w-xl leading-relaxed text-[#E4DCE2]">I help people turn an idea into something they can use and share. You do not need to have it all figured out before we begin.</p>
              <a href="/quote" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#E9D5A5] text-[#302634] px-7 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Request a quote <ArrowRight className="h-4 w-4"/></a>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-5 md:px-8 py-8">
        <h2 className="font-display text-3xl">A little about me and how I work</h2>
        <div className="mt-6 space-y-4 text-[15.5px] leading-[1.75] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
          <p>I’ve been building apps for nearly 20 years, starting when bringing an idea to life meant writing the code behind it. Those years have taught me how to ask the right questions, work through challenges, and build around what people actually need.</p>
          <p>Today, newer tools let me bring that experience to projects in a different way. They can reduce the time and cost involved in development, making a custom app more accessible to someone starting a business or exploring an idea.</p>
          <p>That’s what excites me about iRoxanne Studio: combining years of hands-on experience with new possibilities to help people create something they might once have thought was out of reach.</p>
          <p>You don’t need a finished plan or technical knowledge to begin. Bring your idea, and we’ll work out the next steps together.</p>


        </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}