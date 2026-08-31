import { Calendar, Megaphone, ShoppingCart, Users, Wrench } from 'lucide-react';

const SERVICES = [
  { icon: Calendar, title: 'Booking systems', desc: 'Scheduling, appointments, and reservations that fill your calendar.' },
  { icon: Megaphone, title: 'Marketing tools', desc: 'Content engines and automations that keep you visible.' },
  { icon: ShoppingCart, title: 'E-commerce', desc: 'Storefronts and checkout that turn visitors into customers.' },
  { icon: Users, title: 'Client portals', desc: 'Secure logins where clients manage their own stuff.' },
  { icon: Wrench, title: 'Internal tools', desc: 'Dashboards and workflows that run your back office.' },
];

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl border-t border-white/5 px-6 py-20">
      <h2 className="font-sans text-3xl font-bold tracking-tight">What I build</h2>
      <p className="mt-2 text-muted-foreground">One person, end-to-end — design, build, launch, and support.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-white/10 bg-card/50 p-6 transition hover:border-primary/40 hover:bg-card"
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