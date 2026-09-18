import { MessageCircle, Hammer, Rocket } from 'lucide-react';

const STEPS = [
  { icon: MessageCircle, title: '1. Tell me about your idea', desc: 'Start with a short quote request. Share what you know, even if it is only an idea. You do not need a business name, a finished plan, or a list of features.' },
  { icon: MessageCircle, title: '2. Work out the next steps', desc: 'I review your request and follow up by email. If a call would help, we can arrange one. Together we clarify what you need and whether you want a full build or guidance.' },
  { icon: Hammer, title: '3. Review your proposal', desc: 'You receive the proposed scope, price, and timeline to review online. You can ask for changes before accepting. Once you accept, I prepare your agreement for signature.' },
  { icon: Hammer, title: '4. Get ready for the build', desc: 'After signing, you receive your deposit request. Then a separate guided intake collects the project details, content, and preferences we need, one topic at a time.' },
  { icon: Hammer, title: '5. Build and review together', desc: 'I build the agreed features and share progress for your feedback. If your project includes milestone payments, those are set out in your agreement.' },
  { icon: Rocket, title: '6. Prepare for launch', desc: 'We review the finished app, work through the handoff, and arrange the final payment as agreed. I explain how to manage your app and discuss any support you may need.' },
];

export default function Process() {
  return (
    <section id="process" className="scroll-mt-24 bg-background py-8 px-5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-medium text-[#876b26] dark:text-[#D5BB82] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>How it works</p>
        <h2 className="text-[34px] md:text-[40px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          From your first idea to your custom app
        </h2>

        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">Here is what to expect when I build your app. If you are building it yourself and need guidance, we agree on the sessions and support that fit your needs.</p>
        <div className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative pl-10 md:pl-0 md:pr-8 pb-8 md:pb-0">
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