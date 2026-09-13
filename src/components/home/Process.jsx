import { MessageCircle, Hammer, Rocket } from 'lucide-react';

const STEPS = [
  { icon: MessageCircle, title: 'We shape your idea', desc: "Bring an idea, a new business, or something you want to improve. You do not need a business name, a feature list, or a finished plan. We work out who your app is for and what its first version should do." },
  { icon: Hammer, title: 'We choose your support', desc: "I can design and build your app, or guide you while you build it yourself. We agree on the scope, cost, and next steps before work begins." },
  { icon: Rocket, title: 'We work through the next steps', desc: "For a full build, I share progress for your review and help you prepare for launch. For guidance, we focus on the questions and decisions we have agreed to work through together." },
];

export default function Process() {
  return (
    <section id="process" className="bg-background py-14 px-5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-medium text-[#876b26] dark:text-[#D5BB82] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>How it works</p>
        <h2 className="text-[34px] md:text-[40px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          From your first idea to your custom app
        </h2>

        <div className="mt-10 grid gap-0 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative pl-10 md:pl-0 md:pr-8 pb-12 md:pb-0">
              {/* Vertical connector (mobile) */}
              {i < STEPS.length - 1 && <div className="absolute left-[15px] top-[40px] bottom-0 w-px bg-[#2D2A4A]/8 md:hidden" />}
              {/* Horizontal connector (desktop) */}
              {i < STEPS.length - 1 && <div className="hidden md:block absolute right-0 top-[20px] h-px w-8 bg-[#2D2A4A]/10" />}

              <div className="absolute left-0 md:relative md:left-auto">
                <div className="h-[34px] w-[34px] rounded-full bg-[#2D2A4A] flex items-center justify-center">
                  <step.icon className="h-[16px] w-[16px] text-[#C9A84C]" />
                </div>
              </div>
              <h3 className="mt-5 text-[18px] font-semibold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{step.title}</h3>
              <p className="mt-2 text-[14px] text-muted-foreground leading-[1.7] max-w-[340px]" style={{ fontFamily: "'Inter', sans-serif" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}