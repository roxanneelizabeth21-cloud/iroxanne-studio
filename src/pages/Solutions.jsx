import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';
import Services from '@/components/home/Services';


export default function Solutions() {
  return (
    <div className="studio-public min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="pt-[72px]">
        <Services />

      </main>
      <SiteFooter />
    </div>
  );
}
