import { ArrowRight } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="bg-[#FAF7F0] border-t border-[#2D2A4A]/6">
      {/* CTA band */}
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-12 text-center">
        <h2 className="text-[30px] md:text-[36px] font-semibold text-[#2D2A4A] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Ready to build something?
        </h2>
        <p className="mt-3 text-[15px] text-[#2D2A4A]/45 max-w-md mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
          Tell me about your business and I'll put together a free proposal, usually within 2 business days.
        </p>
        <a href="/quote" className="inline-flex items-center gap-2 mt-7 h-12 px-8 rounded-full bg-[#2D2A4A] text-white text-[14px] font-semibold transition hover:bg-[#3D3A5A] shadow-[0_8px_32px_rgba(45,42,74,0.15)]" style={{ fontFamily: "'Inter', sans-serif" }}>
          Get a free quote <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#2D2A4A]/6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 md:px-8 py-6 text-[12px] text-[#2D2A4A]/35 sm:flex-row" style={{ fontFamily: "'Inter', sans-serif" }}>
          <span className="font-semibold text-[#2D2A4A]/60">iRoxanne Studio</span>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="hover:text-[#2D2A4A]/60 transition">Privacy</a>
            <a href="/terms" className="hover:text-[#2D2A4A]/60 transition">Terms</a>
            <a href="/contact" className="hover:text-[#2D2A4A]/60 transition">Contact</a>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}