// One heading style for every marketing page: what this page is, one line of
// plain guidance, and room for the page's own actions on the right.
export default function PageHeading({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
          {Icon && <Icon className="h-5 w-5 shrink-0 text-primary" />}
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}