import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <section
      className="
        relative isolate overflow-hidden
        bg-[#15162B]
        pt-[82px]
      "
    >
      {/* subtle background lighting */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(circle_at_75%_45%,rgba(209,71,94,0.16),transparent_30%),radial-gradient(circle_at_65%_25%,rgba(85,89,195,0.10),transparent_28%)]
        "
      />

      <div
        className="
          relative z-10 mx-auto
          grid min-h-[680px] max-w-7xl
          items-center gap-10
          px-5 pb-10 pt-16
          md:px-8
          lg:grid-cols-[1fr_1fr]
          lg:pt-20
        "
      >
        {/* LEFT CONTENT */}
        <div className="max-w-[650px]">
          <h1
            className="
              text-[54px] font-semibold
              leading-[0.98]
              tracking-[-0.045em]
              text-[#F4F2F0]
              sm:text-[64px]
              md:text-[74px]
              lg:text-[78px]
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
              mt-7 max-w-[500px]
              text-[17px] leading-8
              text-white/70
            "
          >
            Custom apps that streamline your business,
            delight your clients, and drive growth.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              asChild
              className="
                h-12 rounded-[18px] border-0
                bg-gradient-to-r
                from-[#8A4266]
                via-[#D1475E]
                to-[#FF6C47]
                px-8
                text-sm font-semibold text-white
                shadow-[0_10px_30px_rgba(209,71,94,0.28)]
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
                h-12 rounded-[18px]
                border-white/20
                bg-transparent
                px-8
                text-sm font-semibold text-white
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

        {/* RIGHT GRAPHIC */}
        <div
          className="
            relative hidden
            min-h-[430px]
            items-center justify-center
            lg:flex
          "
        >
          {/* glow */}
          <div
            className="
              absolute
              h-[430px] w-[520px]
              rounded-full
              bg-[radial-gradient(circle,rgba(209,71,94,0.18)_0%,rgba(138,66,102,0.12)_35%,transparent_72%)]
              blur-[10px]
            "
          />

          {/* orbital system */}
          <div className="relative h-[390px] w-[540px]">
            <div
              className="
                absolute left-0 top-[40px]
                h-[220px] w-[520px]
                rotate-[-13deg]
                rounded-[50%]
                border border-[#A95394]/30
              "
            />

            <div
              className="
                absolute left-[30px] top-[75px]
                h-[180px] w-[470px]
                rotate-[-13deg]
                rounded-[50%]
                border border-[#C45B86]/50
                shadow-[0_0_18px_rgba(196,91,134,0.20)]
              "
            />

            <div
              className="
                absolute left-[70px] top-[112px]
                h-[140px] w-[400px]
                rotate-[-13deg]
                rounded-[50%]
                border border-[#E06B81]/75
                shadow-[0_0_16px_rgba(224,107,129,0.35),0_0_34px_rgba(209,71,94,0.18)]
              "
            />

            <div
              className="
                absolute left-[115px] top-[145px]
                h-[105px] w-[330px]
                rotate-[-13deg]
                rounded-[50%]
                border border-[#FF987D]/75
                shadow-[0_0_14px_rgba(255,152,125,0.55),0_0_30px_rgba(209,71,94,0.22)]
              "
            />

            <div
              className="
                absolute left-[160px] top-[170px]
                h-[72px] w-[250px]
                rotate-[-13deg]
                rounded-[50%]
                border-t-[2px] border-r-[2px]
                border-[#FFD0BF]/90
                drop-shadow-[0_0_8px_rgba(255,170,150,0.8)]
              "
            />
          </div>
        </div>
      </div>

      {/* bottom divider */}
      <div
        className="
          absolute inset-x-0 bottom-0 h-px
          bg-gradient-to-r
          from-transparent
          via-white/10
          to-transparent
        "
      />
    </section>
  );
}