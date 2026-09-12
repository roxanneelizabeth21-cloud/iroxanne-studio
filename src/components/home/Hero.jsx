import { ArrowRight } from 'lucide-react';

export default function Hero({ projects, loading }) {
  const trustNames = !loading
    ? (projects || [])
        .map((p) => p.business_name || p.client_name || p.title)
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return (
    <section className="relative isolate overflow-hidden bg-[#302634] pt-[72px]" style={{ backgroundImage: 'radial-gradient(ellipse at 6% 15%, rgba(130,92,119,0.42), transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(79,53,75,0.32), transparent 60%), linear-gradient(115deg, #443342, #302634 58%, #251e2a)' }}>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
        <filter id="hero-plum-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-plum-grain)" opacity="0.65" />
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute -right-48 top-24 hidden h-[620px] w-[480px] rounded-full border border-[#B69A60]/30 lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 hidden h-[46%] w-[8%] border-l border-t border-[#B69A60]/30 bg-[#241d29]/30 lg:block" />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8 pt-2 pb-10 md:pt-3 md:pb-14 lg:pt-4 lg:pb-16">
        <div className="max-w-[1000px]">
          <p className="text-[13px] font-medium text-[#D5BB82] tracking-wide mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            Custom apps for new ideas and small businesses
          </p>

          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", lineHeight: '1.05', letterSpacing: '-0.02em' }}
              className="text-[#FAF3E5] text-[46px] sm:text-[56px] md:text-[66px] lg:text-[76px] font-semibold">
            An idea to explore.{' '}
            <span className="italic font-medium">A place to begin.</span>
          </h1>

          <p className="mt-7 max-w-[640px] text-[15.5px] leading-[1.7] text-[#E4DCE2]" style={{ fontFamily: "'Inter', sans-serif" }}>
            I’m Roxanne. I design and build custom apps, and I can help you work out what yours could look like. Whether you have an early idea or a business you want to develop, we can start with a conversation.
          </p>

          <div className="mt-9 flex flex-wrap gap-3.5">
            <a href="/quote" className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-[#E9D5A5] text-[#302634] text-[14px] font-semibold transition hover:bg-[#F5E5BE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E9D5A5] shadow-[0_8px_32px_rgba(45,42,74,0.18)]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Get a free quote <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#work" className="inline-flex items-center gap-2 h-12 px-7 rounded-full border-2 border-[#C9B78C]/60 text-[#FAF3E5] text-[14px] font-semibold transition hover:border-[#E9D5A5] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E9D5A5]" style={{ fontFamily: "'Inter', sans-serif" }}>
              See the work
            </a>
          </div>
        </div>

        {/* Value strip */}
        <div className="mt-14 pt-6 border-t border-[#B69A60]/35">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-[28px] font-semibold text-[#FAF3E5]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Your idea</p>
              <p className="text-[13px] text-[#D3C7D1] mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>A starting point for our conversation</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold text-[#FAF3E5]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>A clear plan</p>
              <p className="text-[13px] text-[#D3C7D1] mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Scope and cost discussed together</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold text-[#FAF3E5]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Your feedback</p>
              <p className="text-[13px] text-[#D3C7D1] mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Room to review as we build</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold text-[#FAF3E5]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Next steps</p>
              <p className="text-[13px] text-[#D3C7D1] mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Guidance as you prepare to launch</p>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        {trustNames.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-start gap-x-8 gap-y-3">
            {trustNames.map((name) => (
              <span key={name} className="text-[13px] font-medium text-[#D3C7D1] tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{name}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}