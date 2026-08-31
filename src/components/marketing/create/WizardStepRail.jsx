import { Check } from 'lucide-react';
import { STEPS as POST_STEPS } from '@/lib/createPost';

// Vertical step rail. Completed steps are returnable; a step not reached yet
// stays disabled so nothing can be skipped. The connecting line is solid
// behind completed steps and dotted ahead.
export default function WizardStepRail({ step, maxStep, onGoTo, steps: STEPS = POST_STEPS, label = 'Create Post steps' }) {
  return (
    <nav aria-label={label}>
      <ol className="space-y-1">
        {STEPS.map((s, i) => {
          const current = i === step;
          const done = i < maxStep;
          const reachable = i <= maxStep;
          const lineDone = i < maxStep;
          return (
            <li key={s.key} className="relative flex gap-3">
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[11px] top-7 h-[calc(100%-0.75rem)] border-l ${lineDone ? 'border-solid border-accent' : 'border-dotted border-border'}`}
                />
              )}
              <button
                type="button"
                onClick={() => reachable && onGoTo(i)}
                disabled={!reachable}
                aria-current={current ? 'step' : undefined}
                className={`relative flex flex-1 items-start gap-3 rounded-lg px-1 py-2 text-left transition-colors ${
                  reachable ? 'hover:bg-secondary/40' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <span
                  className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums ${
                    current
                      ? 'border-accent bg-accent text-accent-foreground'
                      : done
                        ? 'border-accent/60 bg-accent/15 text-accent'
                        : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {done && !current ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Step {i + 1}</span>
                  <span className={`block text-sm ${current ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">Step {step + 1} of {STEPS.length}: {STEPS[step].label}</p>
    </nav>
  );
}