// Reusable horizontal bar chart for ranking items (sources, landing pages, etc.)
export default function RankingChart({ title, icon: Icon, data, total, accentClass, formatLabel }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      <div className="space-y-2">
        {data.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
        {data.slice(0, 8).map(([label, count]) => {
          const displayLabel = formatLabel ? formatLabel(label) : label;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs w-40 truncate shrink-0">{displayLabel}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
                <div className={`h-full ${accentClass} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}