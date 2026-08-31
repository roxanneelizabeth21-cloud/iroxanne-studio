import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SiteNav() {
  return (
    <header
      className="
        absolute inset-x-0 top-0 z-50
        border-b border-white/[0.04]
        bg-transparent
      "
    >
      <div
        className="
          mx-auto flex h-[82px] max-w-7xl
          items-center justify-between
          px-5 md:px-8
        "
      >
        {/* Transparent logo, left */}
        <a href="/" className="flex shrink-0 items-center">
          <img
            src="https://media.base44.com/images/public/6a94dbc673f0d144b6ed36bb/ff9831304_Untitled.png"
            alt="iRoxanne Studio"
            className="h-11 w-11 rounded-lg object-cover md:h-12 md:w-12"
          />
        </a>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-9 md:flex">
          <a
            href="#services"
            className="text-[13px] font-medium text-white/65 transition hover:text-white"
          >
            Services
          </a>

          <a
            href="#work"
            className="text-[13px] font-medium text-white/65 transition hover:text-white"
          >
            Work
          </a>

          <a
            href="#process"
            className="text-[13px] font-medium text-white/65 transition hover:text-white"
          >
            Process
          </a>

          <a
            href="#about"
            className="text-[13px] font-medium text-white/65 transition hover:text-white"
          >
            About
          </a>

          <a
            href="/contact"
            className="text-[13px] font-medium text-white/65 transition hover:text-white"
          >
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="
              hidden h-10 rounded-lg border-0 px-5
              bg-gradient-to-r
              from-[#8A4266]
              via-[#D1475E]
              to-[#FF6C47]
              text-xs font-semibold text-white
              shadow-[0_8px_28px_rgba(209,71,94,0.26)]
              transition hover:brightness-110
              sm:inline-flex
            "
          >
            <a href="/quote">
              Get a Quote
            </a>
          </Button>

          <button
            type="button"
            aria-label="Open navigation"
            className="
              flex h-10 w-10 items-center justify-center
              rounded-lg border border-white/10
              bg-white/[0.04]
              md:hidden
            "
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}