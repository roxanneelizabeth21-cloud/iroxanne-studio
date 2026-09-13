import { Menu, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import BrandLogo from '@/components/BrandLogo';

const NAV_LINKS = [
  { label: 'App Examples', href: '/#work' },
  { label: 'How It Works', href: '/#process' },
  { label: 'Meet Roxanne', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const navigateSection = (event, href) => {
    setOpen(false);
    if (!href.startsWith('/#') || window.location.pathname !== '/' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(href.slice(2));
    if (!target) return;
    event.preventDefault();
    requestAnimationFrame(() => {
      target.style.scrollMarginTop = '96px';
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  };
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <header className="fixed inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 md:px-8">
          <a href="/" className="flex shrink-0 items-center">
            <BrandLogo height="h-10 md:h-11" />
          </a>
          <nav className="hidden items-center gap-1 lg:gap-3 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={(event) => navigateSection(event, l.href)} className="inline-flex min-h-12 items-center justify-center px-4 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B8942E] hover:bg-[#2D2A4A]/5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a href="/quote" className="hidden sm:inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#2D2A4A] text-white text-[13px] font-semibold transition hover:bg-[#3D3A5A] shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              Get a Quote <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <button type="button" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="homepage-mobile-menu" className="flex h-10 w-10 items-center justify-center rounded-full border border-border md:hidden">
              {open ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
            </button>
          </div>
        </div>
        {open && (
          <div id="homepage-mobile-menu" className="md:hidden border-t border-border bg-background px-5 pb-6 pt-4 space-y-4">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={(event) => navigateSection(event, l.href)} className="flex min-h-12 items-center px-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B8942E] text-base font-medium text-muted-foreground hover:text-foreground">{l.label}</a>
            ))}
            <a href="/quote" className="block text-center py-3 rounded-full bg-[#2D2A4A] text-white text-sm font-semibold">Get a Quote</a>
          </div>
        )}
      </header>
    </>
  );
}