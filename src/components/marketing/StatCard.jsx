import { cn } from '@/lib/utils';

export default function StatCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-display text-3xl font-bold mt-1">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', accent || 'bg-primary/10 text-primary')}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}