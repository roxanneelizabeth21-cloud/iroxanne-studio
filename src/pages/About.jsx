import { ArrowRight } from 'lucide-react';
import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';

const FALLBACK_HEADSHOT_URL = '/uploads/56D3C09F-D8D3-4958-A480-47CAE6B4970C.jpeg';

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 md:px-8 pt-[130px] pb-20">
        <p className="text-[13px] font-medium text-[#876b26] dark:text-[#D5BB82] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>About</p>
        <h1 className="text-[34px] md:text-[42px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Hi, I'm Roxanne.</h1>

        <div className="mt-6 flex justify-center">
          <div className="overflow-hidden rounded-[20px] shadow-[0_16px_48px_rgba(45,42,74,0.08)] max-w-[200px] sm:max-w-[240px]">
            <img src={FALLBACK_HEADSHOT_URL} alt="Roxanne, founder of iRoxanne Studio" className="w-full aspect-[3/4] object-cover object-top" />
          </div>
        </div>

        <div className="mt-8 h-1 w-12 bg-[#C9A84C]/40 rounded-full" />

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
            I am a certified Base44 Partner, which means I build on a platform that lets me move quickly and keep costs transparent. My work includes everything from the first conversation through design, development, launch, and ongoing support if you want it. If you have an idea you would like to explore, I would love to hear about it.
          </p>

          <a href="/quote" className="inline-flex items-center gap-2 text-[14px] font-semibold text-foreground hover:text-[#876b26] dark:text-[#D5BB82] transition mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            Let's talk about your idea <ArrowRight className="h-4 w-4 text-[#876b26] dark:text-[#D5BB82]" />
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}