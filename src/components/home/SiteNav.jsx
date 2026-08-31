import { ArrowRight } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/6a94dbc673f0d144b6ed36bb/d414309b5_CodexImageAug31202602_28_43PM.png';

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center">
          <img src={LOGO_URL} alt="iRoxanne Studio" className="h-12 w-auto" />
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#services" className="transition-colors hover:text-foreground">Services</a>
          <a href="#work" className="transition-colors hover:text-foreground">Work</a>
        </nav>
        <a
          href="mailto:hello@iroxanne.com"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"
        >
          Get a Quote <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}