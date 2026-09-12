import { Menu, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'Process', href: '#process' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '/contact' },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <header className="fixed inset-x-0 top-0 z-50 bg-[#FAF7F0]/80 backdrop-blur-xl border-b border-[#2D2A4A]/5">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 md:px-8">
          <a href="/" className="flex shrink-0 items-center">
            <img src="https://media.base44.com/images/public/6a94dbc673f0d144b6ed36bb/3c870c3bc_CodexImageAug31202605_02_37PM.png" alt="iRoxanne Studio" draggable="false" className="h-10 w-auto object-contain md:h-11" />
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-[13px] font-medium text-[#2D2A4A]/55 transition hover:text-[#2D2A4A]" style={{ fontFamily: "'Inter', sans-serif" }}>{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href="/quote" className="hidden sm:inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#2D2A4A] text-white text-[13px] font-semibold transition hover:bg-[#3D3A5A] shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              Get a Quote <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <button type="button" onClick={() => setOpen(!open)} aria-label="Menu" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2D2A4A]/10 md:hidden">
              {open ? <X className="h-5 w-5 text-[#2D2A4A]" /> : <Menu className="h-5 w-5 text-[#2D2A4A]" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-[#2D2A4A]/5 bg-[#FAF7F0] px-5 pb-6 pt-4 space-y-4">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block text-base font-medium text-[#2D2A4A]/70 hover:text-[#2D2A4A]">{l.label}</a>
            ))}
            <a href="/quote" className="block text-center py-3 rounded-full bg-[#2D2A4A] text-white text-sm font-semibold">Get a Quote</a>
          </div>
        )}
      </header>
    </>
  );
}
