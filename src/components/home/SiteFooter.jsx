export default function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
        <span className="font-sans font-semibold text-foreground">
          <span className="ir-gradient-text">iR</span>oxanne Studio
        </span>
        <span>We build apps. You grow.</span>
        <span>© {new Date().getFullYear()} iRoxanne Studio</span>
      </div>
    </footer>
  );
}