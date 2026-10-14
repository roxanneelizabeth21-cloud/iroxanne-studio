import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';
import CalendarPreview from '@/components/home/CalendarPreview';
import BusinessConcepts from '@/components/home/BusinessConcepts';
export default function Ideas(){return <div className="studio-public min-h-screen"><SiteNav/><main className="pt-[72px]"><header className="studio-wrap py-5"><h1 className="font-display text-4xl md:text-5xl">What could we build for you?</h1><p className="studio-subtitle">Explore a business concept or bring an idea of your own. I build custom websites and apps around what you need.</p><a href="/contact" className="studio-text-link">Already know what you need? Talk with Roxanne ↗</a></header><BusinessConcepts/><CalendarPreview/></main><SiteFooter/></div>;}
