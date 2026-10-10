import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';
import Services from '@/components/home/Services';
import { AppSolutions } from '@/components/home/Pricing';

export default function Solutions() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="pt-[72px]">
        <Services />
        <AppSolutions />
      </main>
      <SiteFooter />
    </div>
  );
}
