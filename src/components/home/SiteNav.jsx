import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';

export default function SiteNav() {
  return (
    <header
      className="
        absolute inset-x-0 top-0 z-50
        border-b border-border/40
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
            src="https://media.base44.com/images/public/6a94dbc673f0d144b6ed36bb/7380fe8cf_CodexImageAug31202603_50_41PM.png"
            alt="iRoxanne Studio"
            draggable="false"
            className="hidden h-12 w-auto object-contain mix-blend-screen dark:block md:h-14"
          />
          <img
            src="https://media.base44.com/images/public/6a94dbc673f0d144b6ed36bb/3c870c3bc_CodexImageAug31202605_02_37PM.png"
            alt="iRoxanne Studio"
            draggable="false"
            className="h-12 w-auto rounded-lg object-contain dark:hidden md:h-14"
          />
        </a>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-9 md:flex">
          <a
            href="#work"
            className="text-[13px] font-medium text-foreground/65 transition hover:text-foreground"
          >
            Work
          </a>

          <a
            href="#process"
            className="text-[13px] font-medium text-foreground/65 transition hover:text-foreground"
          >
            Process
          </a>

          <a
            href="#about"
            className="text-[13px] font-medium text-foreground/65 transition hover:text-foreground"
          >
            About
          </a>

          <a
            href="/contact"
            className="text-[13px] font-medium text-foreground/65 transition hover:text-foreground"
          >
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-foreground/75"><ThemeToggle /></div>
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
              rounded-lg border border-border
              bg-muted
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