import { ArrowRight } from 'lucide-react';

export default function Hero({ projects, loading, heroBackgroundImage }) {
  const trustNames = !loading
    ? (projects || [])
        .map((p) => p.business_name || p.client_name || p.title)
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return (
    <section className="relative overflow-hidden bg-[#FAF7F0] pt-[72px]">
      {heroBackgroundImage && (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat opacity-50"
            style={{ backgroundImage: `url(${heroBackgroundImage})`, backgroundPosition: 'center top' }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FAF7F0]/60 via-transparent to-[#FAF7F0]" />
        </>
      )}
      <div className="pointer-events-none absolute right-[5%] top-[15%] h-[500px] w-[500px] rounded-full bg-[#C9A84C]/5 blur-[120px]" />
      <div className="pointer-events-none absolute left-[-5%] bottom-[10%] h-[300px] w-[300px] rounded-full bg-[#2D2A4A]/3 blur-[80px]" />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8 pt-2 pb-10 md:pt-3 md:pb-14 lg:pt-4 lg:pb-16">
        <div className="max-w-[1000px]">
          <p className="text-[13px] font-medium text-[#B8942E] tracking-wide mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            Custom apps for small businesses
          </p>

          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", lineHeight: '1.05', letterSpacing: '-0.02em' }}
              className="text-[#2D2A4A] text-[46px] sm:text-[56px] md:text-[66px] lg:text-[76px] font-semibold">
            Your vision,{' '}
            <span className="italic font-medium">built</span>{' '}
            into software that runs your business.
          </h1>

          <p className="mt-7 max-w-[640px] text-[15.5px] leading-[1.7] text-[#2D2A4A]/55" style={{ fontFamily: "'Inter', sans-serif" }}>
            I design and build complete business apps — booking platforms, e-commerce suites, client portals, admin dashboards — custom to how you work. One person. No agency markup. Ready in weeks.
          </p>

          <div className="mt-9 flex flex-wrap gap-3.5">
            <a href="/quote" className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-[#2D2A4A] text-white text-[14px] font-semibold transition hover:bg-[#3D3A5A] shadow-[0_8px_32px_rgba(45,42,74,0.18)]" style={{ fontFamily: "'Inter', sans-serif" }}>
              Get a free quote <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#work" className="inline-flex items-center gap-2 h-12 px-7 rounded-full border-2 border-[#2D2A4A]/12 text-[#2D2A4A] text-[14px] font-semibold transition hover:border-[#2D2A4A]/25 hover:bg-[#2D2A4A]/3" style={{ fontFamily: "'Inter', sans-serif" }}>
              See the work
            </a>
          </div>
        </div>

        {/* Value strip */}
        <div className="mt-14 pt-6 border-t border-[#2D2A4A]/8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-[28px] font-semibold text-[#2D2A4A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>7+</p>
              <p className="text-[13px] text-[#2D2A4A]/45 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Apps launched</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold text-[#2D2A4A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>2 weeks</p>
              <p className="text-[13px] text-[#2D2A4A]/45 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Typical turnaround</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold text-[#2D2A4A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>$300–600</p>
              <p className="text-[13px] text-[#2D2A4A]/45 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>Monthly SaaS replaced</p>
            </div>
            <div>
              <p className="text-[28px] font-semibold text-[#2D2A4A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>100%</p>
              <p className="text-[13px] text-[#2D2A4A]/45 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>You own it</p>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        {trustNames.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-start gap-x-8 gap-y-3">
            {trustNames.map((name) => (
              <span key={name} className="text-[13px] font-medium text-[#2D2A4A]/30 tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{name}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}