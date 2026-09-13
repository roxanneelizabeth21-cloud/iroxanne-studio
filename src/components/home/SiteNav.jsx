import { Menu, X, ArrowRight, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import BrandLogo from '@/components/BrandLogo';
import { base44 } from '@/api/base44Client';

const NAV_LINKS = [
  { label: 'Possibilities', href: '/#services' },
  { label: 'App Ideas', href: '/ideas' },
  { label: 'How It Works', href: '/#process' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (!authed) return;
      base44.auth.me().then((user) => {
        if (user?.role === 'admin') setIsAdmin(true);
      }).catch(() => {});
    }).catch(() => {});
  }, []);
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
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={(event) => navigateSection(event, l.href)} className="inline-flex min-h-12 items-center justify-center px-4 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B8942E] hover:bg-[#2D2A4A]/5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <a href="/admin" className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-border text-[13px] font-medium text-muted-foreground transition hover:text-foreground hover:border-primary/40">
                <Lock className="h-3.5 w-3.5" /> Admin
              </a>
            )}
            <ThemeToggle />
            <a href="/quote" className="hidden sm:inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#2D2A4A] text-white text-[13px] font-semibold transition hover:bg-[#3D3A5A] shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              Get a Quote <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <button type="button" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="homepage-mobile-menu" className="flex h-10 w-10 items-center justify-center rounded-full border border-border lg:hidden">
              {open ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
            </button>
          </div>
        </div>
        {open && (
          <div id="homepage-mobile-menu" className="lg:hidden border-t border-border bg-background px-5 pb-6 pt-4 space-y-4">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={(event) => navigateSection(event, l.href)} className="flex min-h-12 items-center px-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B8942E] text-base font-medium text-muted-foreground hover:text-foreground">{l.label}</a>
            ))}
            {isAdmin && (
              <a href="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground">
                <Lock className="h-4 w-4" /> Admin
              </a>
            )}
            <a href="/quote" className="block text-center py-3 rounded-full bg-[#2D2A4A] text-white text-sm font-semibold">Get a Quote</a>
          </div>
        )}
      </header>
    </>
  );
}