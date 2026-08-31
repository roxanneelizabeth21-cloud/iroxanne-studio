import { Check } from 'lucide-react';

// Horizontal step bar for the canvas wizard — keeps the three steps on one
// line at the top so the working area stays tall.
export default function CanvasStepBar({ steps, step, maxStep, onGoTo, label = 'Wizard steps' }) {
  return (
    <nav aria-label={label} className="rounded-xl bg-secondary/40 p-1.5">
      <ol className="flex items-center gap-1">
        {steps.map((s, i) => {
          const current = i === step;
          const done = i < maxStep;
          const reachable = i <= maxStep;
          return (
            <li key={s.key} className="flex flex-1 items-center gap-1 min-w-0">
              <button
                type="button"
                onClick={() => reachable && onGoTo(i)}
                disabled={!reachable}
                aria-current={current ? 'step' : undefined}
                className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 transition-colors ${
                  current ? 'bg-card shadow-sm' : reachable ? 'hover:bg-card/60' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold tabular-nums ${
                    current
                      ? 'border-accent bg-accent text-accent-foreground'
                      : done
                        ? 'border-accent/60 bg-accent/15 text-accent'
                        : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {done && !current ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={`truncate text-sm ${current ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
              </button>
              {i < steps.length - 1 && <span aria-hidden="true" className={`hidden sm:block h-px w-4 shrink-0 ${done ? 'bg-accent' : 'bg-border'}`} />}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">Step {step + 1} of {steps.length}: {steps[step].label}</p>
    </nav>
  );
}