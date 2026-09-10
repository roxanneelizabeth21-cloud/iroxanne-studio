export default function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
        <span className="font-sans font-semibold text-foreground">
          <span className="ir-gradient-text">iR</span>oxanne Studio
        </span>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="hover:text-foreground">Privacy</a>
          <a href="/terms" className="hover:text-foreground">Terms</a>
          <a href="/contact" className="hover:text-foreground">Contact</a>
        </div>
        <span>© {new Date().getFullYear()} iRoxanne Studio</span>
      </div>
    </footer>
  );
}