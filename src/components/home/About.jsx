const FALLBACK_HEADSHOT_URL = '/uploads/56D3C09F-D8D3-4958-A480-47CAE6B4970C.jpeg';

export default function About({ headshotUrl }) {
  return (
    <section id="about" className="bg-card py-14 px-5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid md:grid-cols-[0.7fr_1.3fr] gap-12 lg:gap-16 items-start">
          {/* Left: photo + name */}
          <div>
            <div className="overflow-hidden rounded-[20px] shadow-[0_16px_48px_rgba(45,42,74,0.08)] max-w-[200px] sm:max-w-[240px]">
              <img
                src={headshotUrl || FALLBACK_HEADSHOT_URL}
                alt="Roxanne"
                className="w-full aspect-[3/4] object-cover object-top"
              />
            </div>
            <div className="mt-5">
              <p className="text-[22px] font-semibold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Roxanne</p>
              <p className="text-[13px] text-[#876b26] dark:text-[#D5BB82] font-medium mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Founder & Builder · Base44 Partner</p>
              <a href="https://app.base44.com/@roxanne-bruce" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm text-foreground underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">View my Base44 Partner profile <span className="sr-only">(opens in a new tab)</span></a>
            </div>
          </div>

          {/* Right: bio */}
          <div>
            <p className="text-[13px] font-medium text-[#876b26] dark:text-[#D5BB82] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>About</p>
            <h2 className="text-[34px] md:text-[40px] font-semibold text-foreground tracking-tight leading-[1.1]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Hi, I’m Roxanne.<br />Let’s talk about your idea.
            </h2>
            <div className="mt-8 h-1 w-12 bg-[#C9A84C]/40 rounded-full" />
            <div className="mt-8 space-y-5 text-[15.5px] leading-[1.75] text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              <p>
                I’m <span className="font-semibold text-foreground">Roxanne</span>, the person behind iRoxanne Studio. I help people explore their ideas and turn them into apps, whether they are just starting out or already running a business.
              </p>
              <p>
                You work directly with me. I start by listening to what you have in mind, asking questions, and helping you decide where to begin. You do not need to know the technical details or have everything worked out.
              </p>
              <p>
                My work includes booking systems, online stores, client portals, and tools for everyday tasks. We agree on the scope, cost, and next steps before the build, and you have opportunities to review the app as it takes shape.
              </p>
              <a href="/quote" className="inline-flex items-center gap-2 text-[14px] font-semibold text-foreground hover:text-[#876b26] dark:text-[#D5BB82] transition mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                Let's talk about your idea <span className="text-[#876b26] dark:text-[#D5BB82]">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}