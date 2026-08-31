// Shared shell for every Marketing Hub section: one heading, one optional
// action, calm spacing. Keeps the Hub visually predictable top to bottom.
export default function HubSection({ title, description, action, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}