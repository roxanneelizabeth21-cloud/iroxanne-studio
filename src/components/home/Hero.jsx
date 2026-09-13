import { ArrowRight } from 'lucide-react';

export default function Hero({ projects, loading }) {
  const trustNames = !loading
    ? (projects || [])
        .map((p) => p.business_name || p.client_name || p.title)
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return (
    <div className="pt-[72px]">
    <section className="relative isolate overflow-hidden bg-[#302634]">
      <img src="/images/hero-facebook-plum.png" alt="" aria-hidden="true" fetchPriority="high" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center" />
      <div className="relative mx-auto flex min-h-[340px] max-w-6xl items-center justify-center px-5 py-10 text-center md:min-h-[400px] md:px-8 md:py-12">
        <div className="w-full max-w-[800px]">
          <p className="text-[13px] font-medium text-[#D5BB82] tracking-[0.16em] mb-5" style={{ fontFamily: "'Inter', sans-serif" }}>
            Custom apps for new ideas and small businesses
          </p>

          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", lineHeight: '1.05', letterSpacing: '-0.02em' }}
              className="text-[#FAF3E5] text-[38px] sm:text-[48px] md:text-[56px] lg:text-[62px] font-medium">
            An idea to explore.{' '}
            <span>A place to begin.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-[560px] text-[15.5px] leading-[1.7] text-[#E4DCE2]" style={{ fontFamily: "'Inter', sans-serif" }}>
            I’m Roxanne. I help turn early ideas and business needs into custom apps. We can start with a conversation.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3.5">
            <a href="/quote" className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-[#E9D5A5] text-[#302634] text-[14px] font-semibold transition hover:bg-[#F5E5BE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E9D5A5] shadow-[0_8px_32px_rgba(45,42,74,0.18)]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Get a free quote <ArrowRight className="h-4 w-4" />
            </a>
            {!loading && projects?.length > 0 && <a href="#work" onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              const target = document.getElementById('work');
              if (!target) return;
              event.preventDefault();
              target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
              target.focus({ preventScroll: true });
            }} className="inline-flex items-center gap-2 h-12 px-7 rounded-full border-2 border-[#C9B78C]/60 text-[#FAF3E5] text-[14px] font-semibold transition hover:border-[#E9D5A5] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E9D5A5]" style={{ fontFamily: "'Inter', sans-serif" }}>
              View my projects
            </a>}
          </div>
        </div>

      </div>
    </section>
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        {/* Value strip */}
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-[28px] font-semibold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Your idea</p>
              <p className="text-[13px] text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>A starting point for our conversation</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>A clear plan</p>
              <p className="text-[13px] text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Scope and cost discussed together</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Your feedback</p>
              <p className="text-[13px] text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Room to review as we build</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Next steps</p>
              <p className="text-[13px] text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Guidance as you prepare to launch</p>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        {trustNames.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-start gap-x-8 gap-y-3">
            {trustNames.map((name) => (
              <span key={name} className="text-[13px] font-medium text-muted-foreground tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}