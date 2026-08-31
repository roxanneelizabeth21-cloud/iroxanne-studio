// iRoxanne Studio — public placeholder.
// The full services-focused public site is planned. For now this is a simple
// branded coming-soon screen with no music content.
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 mb-6">
          <span className="font-display text-2xl font-bold text-primary">iR</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
          iRoxanne Studio
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Custom apps for small businesses, solo founders, and creators.
        </p>
        <p className="mt-2 text-sm text-muted-foreground/80">
          Booking systems, marketing tools, e-commerce, client portals, and internal tools — built fast, by a real person.
        </p>
        <div className="mt-8 inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium tracking-wide uppercase">
          New site coming soon
        </div>
      </div>
    </div>
  );
}