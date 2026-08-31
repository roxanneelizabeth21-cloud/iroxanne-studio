import { ArrowRight } from 'lucide-react';

export default function ClosingCTA() {
  return (
    <section id="contact" className="mx-auto max-w-5xl px-6 py-20">
      <div className="ir-gradient rounded-3xl p-10 text-center shadow-2xl shadow-primary/20 sm:p-14">
        <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Let&apos;s build your app</h2>
        <p className="mx-auto mt-3 max-w-md text-white/85">
          Tell me about your project and I&apos;ll follow up within two business days with a custom proposal.
        </p>
        <a
          href="mailto:hello@iroxanne.com"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-black/30 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-black/40"
        >
          Get a Quote <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}