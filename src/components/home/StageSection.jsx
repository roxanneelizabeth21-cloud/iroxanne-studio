import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Stage Black modular glass card. In `fluid` mode it renders the bare card
// (no outer section / max-width) so it can sit inside a side-by-side grid.
export default function StageSection({ title, actionTo, actionLabel, action, children, className, contentClassName, fluid }) {
  const card = (
    <div className={cn('rounded-2xl border border-primary/15 bg-card/40 backdrop-blur-xl shadow-[0_2px_30px_rgba(0,0,0,0.25)]', fluid ? 'p-4 sm:p-5 h-full' : 'p-4 sm:p-6', className)}>
      {(title || actionTo || action) && (
        <div className={cn('flex items-center justify-between', fluid ? 'mb-3' : 'mb-4 sm:mb-5')}>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
          {action ? action : actionTo ? (
            <Link to={actionTo}>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-primary">
                {actionLabel} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : null}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </div>
  );
  if (fluid) return card;
  return (
    <section className="px-4 py-3">
      <div className="max-w-6xl mx-auto">{card}</div>
    </section>
  );
}