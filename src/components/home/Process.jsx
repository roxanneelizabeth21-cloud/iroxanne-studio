import { Compass, Hammer, Rocket } from 'lucide-react';

const STEPS = [
  {
    icon: Compass,
    title: 'Discover',
    desc: "We start with a conversation about your business, your customers, and the problem you're solving. You leave with a clear plan and an honest estimate — no pressure.",
  },
  {
    icon: Hammer,
    title: 'Build',
    desc: 'I design and build your custom app, sharing progress as I go. You review, we refine, and you watch it come to life — usually in weeks, not months.',
  },
  {
    icon: Rocket,
    title: 'Launch',
    desc: 'Your app goes live on web and mobile. I handle the launch, hand over the keys, and stick around for support whenever you need it.',
  },
];

export default function Process() {
  return (
    <section id="process" className="mx-auto max-w-6xl border-t border-border px-6 py-20">
      <div>
        <h2 className="font-sans text-3xl font-bold tracking-tight">How it works</h2>
        <p className="mt-2 text-muted-foreground">A simple, transparent process — no jargon, no surprises.</p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative rounded-2xl border border-border bg-card/50 p-6">
            <span className="text-sm font-semibold text-primary">0{i + 1}</span>
            <step.icon className="mt-3 h-7 w-7 text-primary" />
            <h3 className="mt-4 font-sans text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}