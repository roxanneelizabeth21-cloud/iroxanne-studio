import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#292745]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 md:px-8">

        <a href="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="iRoxanne Studio"
            className="h-11 w-auto object-contain md:h-12"
          />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#services"
            className="text-sm text-white/65 transition hover:text-white"
          >
            Services
          </a>

          <a
            href="#work"
            className="text-sm text-white/65 transition hover:text-white"
          >
            Work
          </a>

          <a
            href="#process"
            className="text-sm text-white/65 transition hover:text-white"
          >
            Process
          </a>

          <a
            href="#about"
            className="text-sm text-white/65 transition hover:text-white"
          >
            About
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="
              hidden rounded-full border-0
              bg-gradient-to-r from-[#69407D] via-[#8A4266] to-[#C97064]
              px-6 text-white
              shadow-[0_8px_28px_rgba(138,66,102,0.24)]
              hover:opacity-90
              sm:inline-flex
            "
          >
            <a href="/quote">Get a Quote</a>
          </Button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

      </div>
    </header>
  );
}