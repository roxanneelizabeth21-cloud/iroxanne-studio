import { ArrowRight } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="studio-footer bg-background border-t border-border">
      {/* CTA band */}
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-5 text-center">
        <h2 className="text-[30px] md:text-[36px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Let’s talk about what you need.
        </h2>
        <p className="mt-3 text-[15px] text-muted-foreground max-w-md mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
          Tell me about your business, your idea, or the task you wish were easier. I’ll help you find a practical starting point.
        </p>
        <a href="/quote" className="studio-button mt-5" style={{ fontFamily: "'Inter', sans-serif" }}>
          Start a conversation <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 md:px-8 py-4 text-[12px] text-muted-foreground sm:flex-row" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="flex flex-col sm:items-start">
            <span className="font-semibold text-muted-foreground">iRoxanne Studio</span>
            <a href="mailto:info@iroxannestudio.com" className="text-muted-foreground/80 hover:text-foreground transition">info@iroxannestudio.com</a>
            <span className="text-muted-foreground/60">10612 Providence Rd STE D — PMB 747, Charlotte, NC 28277</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/ideas" className="hover:text-foreground transition">Explore ideas</a>
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