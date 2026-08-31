import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

// Collapsed-by-default guide used on every marketing creation page, so
// first-time instructions never crowd the working area.
export default function HowThisWorks({ steps, note }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-5 rounded-xl border border-border/60 bg-card/50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium"
      >
        <HelpCircle className="h-4 w-4 text-primary" />
        How this works
        <ChevronDown className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border/60 px-4 py-3">
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary tabular-nums">{i + 1}</span>
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ol>
          {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
        </div>
      )}
    </div>
  );
}