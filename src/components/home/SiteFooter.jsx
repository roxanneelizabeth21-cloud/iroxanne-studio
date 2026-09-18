import { ArrowRight } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="bg-background border-t border-border">
      {/* CTA band */}
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-8 text-center">
        <h2 className="text-[30px] md:text-[36px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Have an idea you’d like to explore?
        </h2>
        <p className="mt-3 text-[15px] text-muted-foreground max-w-md mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
          Tell me a little about what you have in mind. It is okay if you are still figuring it out; we can talk through the next steps together.
        </p>
        <a href="/quote" className="inline-flex items-center gap-2 mt-5 h-12 px-8 rounded-full bg-[#2D2A4A] text-white text-[14px] font-semibold transition hover:bg-[#3D3A5A] shadow-[0_8px_32px_rgba(45,42,74,0.15)]" style={{ fontFamily: "'Inter', sans-serif" }}>
          Get a free quote <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 md:px-8 py-4 text-[12px] text-muted-foreground sm:flex-row" style={{ fontFamily: "'Inter', sans-serif" }}>
          <span className="font-semibold text-muted-foreground">iRoxanne Studio</span>
          <div className="flex items-center gap-5">
            <a href="/ideas" className="hover:text-foreground transition">App ideas</a>
            <a href="/about" className="hover:text-muted-foreground transition">About</a>
            <a href="/privacy" className="hover:text-muted-foreground transition">Privacy</a>
            <a href="/terms" className="hover:text-muted-foreground transition">Terms</a>
            <a href="/contact" className="hover:text-muted-foreground transition">Contact</a>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}