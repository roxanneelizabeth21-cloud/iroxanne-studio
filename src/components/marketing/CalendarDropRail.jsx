import { dateKey } from '@/lib/marketing';

// Visual Grid only shows day groups that already have posts, so a drag had
// nowhere to land. While a drag is active this rail offers every day of the
// next three weeks as a drop target.
export default function CalendarDropRail({ overKey, dropHandlers, days = 21 }) {
  const start = new Date();
  const list = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="sticky top-2 z-20 glass rounded-2xl p-2.5 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Drop on a day to reschedule</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {list.map((d) => {
          const key = dateKey(d);
          const isOver = overKey === key;
          return (
            <div
              key={key}
              data-date={key}
              {...dropHandlers(key)}
              className={`shrink-0 w-14 rounded-lg border px-1 py-2 text-center transition-colors ${isOver ? 'border-primary bg-primary/15 ring-1 ring-primary/50' : 'border-border/50 bg-card/60'}`}
            >
              <p className="text-[10px] uppercase text-muted-foreground">
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </p>
              <p className="text-sm font-semibold leading-tight">{d.getDate()}</p>
              <p className="text-[9px] text-muted-foreground">
                {d.toLocaleDateString(undefined, { month: 'short' })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}