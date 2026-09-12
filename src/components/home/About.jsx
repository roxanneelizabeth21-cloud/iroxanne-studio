export default function About() {
  return (
    <section id="about" className="bg-white py-24 px-5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid md:grid-cols-[1fr_1.3fr] gap-12 items-start">
          <div>
            <p className="text-[13px] font-medium text-[#B8942E] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>About</p>
            <h2 className="text-[34px] md:text-[40px] font-semibold text-[#2D2A4A] tracking-tight leading-[1.1]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              One person.<br />No agency.
            </h2>
            <div className="mt-8 h-1 w-12 bg-[#C9A84C]/40 rounded-full" />
          </div>
          <div className="space-y-5 text-[15.5px] leading-[1.75] text-[#2D2A4A]/55" style={{ fontFamily: "'Inter', sans-serif" }}>
            <p>
              iRoxanne Studio is me — <span className="font-semibold text-[#2D2A4A]">Roxanne</span>. I build custom apps for small businesses, solo founders, and creators who need software that actually fits how they work.
            </p>
            <p>
              When you work with me, you talk to the person building your app — no account managers, no hand-offs, no markup for a team you'll never meet. That means faster turnaround, fairer pricing, and an app built around your real needs instead of a template.
            </p>
            <p>
              Every project starts with understanding your business and ends with an app you own — on web and mobile. From booking platforms to full e-commerce suites to AI-powered business tools, I build the kind of software that would cost $300–600 per month if you assembled it from off-the-shelf SaaS — and I build it custom for you, once.
            </p>
            <a href="/quote" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#2D2A4A] hover:text-[#B8942E] transition mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              Let's talk about your idea <span className="text-[#B8942E]">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
