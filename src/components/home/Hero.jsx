import { ArrowRight, Sparkles } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/6a94dbc673f0d144b6ed36bb/d414309b5_CodexImageAug31202602_28_43PM.png';

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.28),transparent_55%)]" />
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Custom apps, built by a real person
        </span>
        <h1 className="mt-6 font-sans text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Apps that help your <span className="ir-gradient-text">business grow</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Booking systems, marketing tools, e-commerce, client portals, and internal tools — built fast for small businesses, solo founders, and creators.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="mailto:hello@iroxanne.com"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90"
          >
            Get a Quote <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#work"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white/5"
          >
            See Work
          </a>
        </div>
        <div className="mx-auto mt-14 max-w-sm rounded-2xl bg-black p-6 shadow-2xl shadow-black/50 ring-1 ring-white/10">
          <img src={LOGO_URL} alt="iRoxanne Studio — We build apps. You grow." className="h-auto w-full rounded-lg" />
        </div>
      </div>
    </section>
  );
}