import { ArrowRight } from 'lucide-react';

// TODO: Replace with the Base44 media URL once Roxanne uploads the headshot
const HEADSHOT_URL = '/uploads/56D3C09F-D8D3-4958-A480-47CAE6B4970C.jpeg';

export default function Hero({ projects, loading }) {
  const trustNames = !loading
    ? (projects || []).map((p) => p.business_name || p.client_name || p.title).filter(Boolean).slice(0, 6)
    : [];

  return (
    <section className="relative overflow-hidden bg-[#FAF7F0] pt-[72px]">
      {/* Subtle warm glows */}
      <div className="pointer-events-none absolute right-[5%] top-[15%] h-[500px] w-[500px] rounded-full bg-[#C9A84C]/5 blur-[120px]" />
      <div className="pointer-events-none absolute left-[-5%] bottom-[10%] h-[300px] w-[300px] rounded-full bg-[#2D2A4A]/3 blur-[80px]" />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8 pt-16 pb-16 md:pt-20 md:pb-24 lg:pt-24 lg:pb-28">
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-14 items-center">
          {/* Left — copy */}
          <div>
            <p className="text-[13px] font-medium text-[#B8942E] tracking-wide mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              Custom apps for small businesses
            </p>

            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", lineHeight: '1.05', letterSpacing: '-0.02em' }}
                className="text-[#2D2A4A] text-[44px] sm:text-[54px] md:text-[58px] lg:text-[68px] font-semibold">
              Your vision,{' '}
              <span className="italic font-medium">built</span>{' '}
              into software that runs your business.
            </h1>

            <p className="mt-7 max-w-[480px] text-[15.5px] leading-[1.7] text-[#2D2A4A]/55" style={{ fontFamily: "'Inter', sans-serif" }}>
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

          {/* Right — headshot */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              {/* Decorative accent behind the photo */}
              <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-[#C9A84C]/15 via-transparent to-[#2D2A4A]/8 blur-sm" />
              <div className="relative overflow-hidden rounded-[24px] shadow-[0_24px_64px_rgba(45,42,74,0.12)]">
                <img
                  src={HEADSHOT_URL}
                  alt="Roxanne — iRoxanne Studio"
                  className="w-[280px] lg:w-[320px] xl:w-[350px] aspect-[3/4] object-cover object-top"
                />
                {/* Subtle gold bottom edge */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#C9A84C]/0 via-[#C9A84C]/40 to-[#C9A84C]/0" />
              </div>
            </div>
          </div>
        </div>

        {/* Value strip */}
        <div className="mt-20 pt-8 border-t border-[#2D2A4A]/8">
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
          <div className="mt-12 flex flex-wrap items-center justify-start gap-x-8 gap-y-3">
            {trustNames.map((name) => (
              <span key={name} className="text-[13px] font-medium text-[#2D2A4A]/30 tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>{name}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
