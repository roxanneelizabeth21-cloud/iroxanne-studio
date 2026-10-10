import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';
import Services from '@/components/home/Services';
import { AppSolutions } from '@/components/home/Pricing';

export default function Solutions() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="pt-[72px]">
        <section className="relative isolate overflow-hidden bg-[#302634] text-[#FAF3E5]">
          <img src="/images/hero-facebook-plum.png" alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover pointer-events-none" />
          <div className="mx-auto max-w-5xl px-5 md:px-8 py-10 text-center">
            <p className="text-sm tracking-widest text-[#D5BB82]">SOLUTIONS</p>
            <h1 className="font-display text-4xl md:text-5xl mt-4">Apps built around how your business works.</h1>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-[#E4DCE2]">Booking, ordering, client portals, payments, and everyday operations, brought together in one custom app.</p>
          </div>
        </section>
        <Services />
        <AppSolutions />
      </main>
      <SiteFooter />
    </div>
  );
}
