// A titled card section used to lay the full-page post editor out in clear,
// scannable blocks instead of cramped tabs.
export default function PostEditorSection({ icon: Icon, title, hint, children }) {
  return (
    <section className="glass rounded-2xl p-4 sm:p-5 space-y-4">
      <header className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          {Icon && <Icon className="h-4 w-4 text-primary" aria-hidden="true" />}
          {title}
        </h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </header>
      {children}
    </section>
  );
}