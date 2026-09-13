import { Calendar, Megaphone, ShoppingCart, Users, Wrench } from 'lucide-react';

const SERVICES = [
  { icon: Calendar, title: 'Booking systems', desc: 'Let clients request appointments and choose available times.' },
  { icon: Megaphone, title: 'Marketing tools', desc: 'Organize content, plan posts, and manage your outreach.' },
  { icon: ShoppingCart, title: 'E-commerce', desc: 'Show your products and manage orders and checkout.' },
  { icon: Users, title: 'Client portals', desc: 'Give clients a place to view their documents, requests, and updates.' },
  { icon: Wrench, title: 'Internal tools', desc: 'Bring everyday tasks, records, and project updates together.' },
];

export default function Services() {
  return (
    <section id="services" className="scroll-mt-24 mx-auto max-w-6xl border-t border-border px-6 py-20">
      <h2 className="font-sans text-3xl font-bold tracking-tight">What I can help you build</h2>
      <p className="mt-2 text-muted-foreground">Have something different in mind? You can start with an idea, and we can explore what its first version might look like.</p>
      <p className="mt-3 text-muted-foreground">I can build the app with you, or offer agreed guidance while you build it yourself. <a href="/quote?support=guidance" className="underline underline-offset-4">Ask about guidance</a>.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-border bg-card/50 p-6 transition hover:border-primary/40 hover:bg-card"
          >
            <s.icon className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}