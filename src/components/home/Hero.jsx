import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Hero({ projects, loading }) {
  const trustNames = !loading
    ? (projects || [])
        .map((project) =>
          project.business_name ||
          project.client_name ||
          project.title ||
          project.project_title ||
          project.name
        )
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return (
    <section
      className="
        relative isolate overflow-hidden
        bg-[#15162B]
        pt-[82px]
      "
    >
      {/* =========================================
          BACKGROUND
      ========================================== */}

      {/* subtle indigo upper glow */}
      <div
        className="
          pointer-events-none absolute
          left-[10%] top-[-260px]
          h-[540px] w-[760px]
          rounded-full
          bg-[#5559C3]/10
          blur-[130px]
        "
      />

      {/* plum / rose glow behind arcs */}
      <div
        className="
          pointer-events-none absolute
          right-[-160px] top-[105px]
          h-[560px] w-[760px]
          rounded-full
          bg-[radial-gradient(circle,rgba(209,71,94,0.20)_0%,rgba(138,66,102,0.14)_33%,rgba(85,89,195,0.06)_52%,transparent_73%)]
          blur-[26px]
        "
      />

      {/* very subtle grid */}
      <div
        className="
          pointer-events-none absolute inset-0 opacity-[0.11]
          [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)]
          [background-size:48px_48px]
        "
      />

      {/* =========================================
          LARGE LIGHT ORBITS
          This recreates the right-side visual
          from the top-left concept.
      ========================================== */}

      <div className="pointer-events-none absolute inset-0 hidden lg:block">

        {/* outer faint orbit */}
        <div
          className="
            absolute
            right-[-185px] top-[135px]
            h-[330px] w-[770px]
            rotate-[-13deg]
            rounded-[50%]
            border border-[#B45991]/22
          "
        />

        {/* large purple orbit */}
        <div
          className="
            absolute
            right-[-125px] top-[165px]
            h-[260px] w-[650px]
            rotate-[-13deg]
            rounded-[50%]
            border border-[#A95394]/45
            shadow-[0_0_18px_rgba(169,83,148,0.20)]
          "
        />

        {/* primary bright rose orbit */}
        <div
          className="
            absolute
            right-[-70px] top-[200px]
            h-[205px] w-[555px]
            rotate-[-13deg]
            rounded-[50%]
            border border-[#E06B81]/75
            shadow-[0_0_14px_rgba(224,107,129,0.45),0_0_38px_rgba(209,71,94,0.20)]
          "
        />

        {/* brightest inner orbit */}
        <div
          className="
            absolute
            right-[-5px] top-[236px]
            h-[135px] w-[435px]
            rotate-[-13deg]
            rounded-[50%]
            border border-[#FF987D]/70
            shadow-[0_0_12px_rgba(255,152,125,0.65),0_0_30px_rgba(209,71,94,0.30)]
          "
        />

        {/* brightest arc highlight */}
        <div
          className="
            absolute
            right-[40px] top-[258px]
            h-[91px] w-[345px]
            rotate-[-13deg]
            rounded-[50%]
            border-r-[2px]
            border-t-[2px]
            border-[#FFD0BF]/85
            blur-[0.2px]
            drop-shadow-[0_0_8px_rgba(255,170,150,0.8)]
          "
        />
      </div>

      {/* =========================================
          HERO CONTENT
      ========================================== */}

      <div
        className="
          relative z-10 mx-auto
          flex min-h-[660px] max-w-7xl
          flex-col
          px-5 pb-10 pt-14
          md:px-8 md:pt-20
          lg:min-h-[690px] lg:pt-[92px]
        "
      >
        <div className="flex flex-1 items-center">

          <div className="max-w-[650px]">

            <h1
              className="
                text-[50px] font-semibold
                leading-[0.98]
                tracking-[-0.045em]
                text-[#F4F2F0]
                sm:text-[62px]
                md:text-[72px]
                lg:text-[76px]
              "
            >
              <span className="block">
                Your Idea.
              </span>

              <span className="block">
                Our App.
              </span>

              <span
                className="
                  block
                  bg-gradient-to-r
                  from-[#A961A3]
                  via-[#D1475E]
                  to-[#FF7860]
                  bg-clip-text
                  text-transparent
                "
              >
                Real Results.
              </span>
            </h1>

            <p
              className="
                mt-7 max-w-[460px]
                text-[15px] leading-7
                text-white/58
                sm:text-base
              "
            >
              Custom apps that streamline your business,
              delight your clients, and drive growth.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <Button
                asChild
                className="
                  h-11 rounded-lg border-0
                  bg-gradient-to-r
                  from-[#8A4266]
                  via-[#D1475E]
                  to-[#FF6C47]
                  px-6
                  text-[13px] font-semibold text-white
                  shadow-[0_10px_30px_rgba(209,71,94,0.25)]
                  transition
                  hover:brightness-110
                "
              >
                <a href="/quote">
                  Get a Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                className="
                  h-11 rounded-lg
                  border-white/20
                  bg-transparent
                  px-6
                  text-[13px] font-semibold text-white
                  hover:border-white/30
                  hover:bg-white/[0.05]
                  hover:text-white
                "
              >
                <a href="#work">
                  See Our Work
                </a>
              </Button>

            </div>

          </div>

        </div>

        {/* =========================================
            TRUST / PROJECT STRIP
        ========================================== */}

        <div className="pb-9 pt-10">

          {trustNames.length > 0 ? (
            <>
              <p className="mb-5 text-center text-[10px] uppercase tracking-[0.16em] text-white/28">
                Selected work
              </p>

              <div
                className="
                  flex flex-wrap
                  items-center justify-center
                  gap-x-9 gap-y-4
                  md:gap-x-12
                "
              >
                {trustNames.map((name) => (
                  <span
                    key={name}
                    className="
                      text-sm font-semibold
                      tracking-wide text-white/35
                    "
                  >
                    {name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="mb-5 text-center text-[10px] uppercase tracking-[0.16em] text-white/28">
                Designed for businesses ready to work smarter
              </p>

              <div
                className="
                  flex flex-wrap items-center justify-center
                  gap-x-8 gap-y-3
                  text-[12px] font-medium
                  text-white/32
                "
              >
                <span>Custom Apps</span>
                <span className="text-[#D1475E]/70">•</span>
                <span>Client Portals</span>
                <span className="text-[#D1475E]/70">•</span>
                <span>Business Automation</span>
                <span className="text-[#D1475E]/70">•</span>
                <span>Internal Tools</span>
                <span className="text-[#D1475E]/70">•</span>
                <span>Connected Workflows</span>
              </div>
            </>
          )}

        </div>
      </div>

      {/* bottom divider */}
      <div
        className="
          absolute inset-x-0 bottom-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/10
          to-transparent
        "
      />
    </section>
  );
}