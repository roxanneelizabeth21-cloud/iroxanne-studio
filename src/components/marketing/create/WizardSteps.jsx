import { Check } from 'lucide-react';
import { STEPS } from '@/lib/createPost';

// Compact, plain-text progress indicator. Completed steps are returnable; a step
// the owner has not reached yet stays disabled so nothing can be skipped.
export default function WizardSteps({ step, maxStep, onGoTo }) {
  return (
    <nav aria-label="Create Post steps" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => {
          const current = i === step;
          const done = i < maxStep;
          const reachable = i <= maxStep;
          return (
            <li key={s.key} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => reachable && onGoTo(i)}
                disabled={!reachable}
                aria-label={`Step ${i + 1}: ${s.label}`}
                aria-current={current ? 'step' : undefined}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  current
                    ? 'border-primary bg-primary text-primary-foreground'
                    : reachable
                      ? 'border-border bg-card/60 text-foreground hover:border-primary/40'
                      : 'border-border/50 bg-card/30 text-muted-foreground cursor-not-allowed'
                }`}
              >
                <span className="tabular-nums">{i + 1}</span>
                {s.label}
                {done && !current && <Check className="h-3 w-3" aria-label="completed" />}
              </button>
              {i < STEPS.length - 1 && <span aria-hidden="true" className="text-muted-foreground">›</span>}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">Step {step + 1} of {STEPS.length}: {STEPS[step].label}</p>
    </nav>
  );
}