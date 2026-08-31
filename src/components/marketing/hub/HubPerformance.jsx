import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingPerformance from '@/pages/marketing/MarketingPerformance';
import { totalMetrics, formatDate } from '@/lib/marketing';

const CELL = 'rounded-xl border-[0.5px] border-border bg-card/60 px-4 py-3';

function Metric({ label, value }) {
  return (
    <div className={CELL}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums mt-0.5">{Number(value || 0).toLocaleString()}</p>
    </div>
  );
}

// Section 3: a small snapshot, with the full analytics view disclosed on demand
// inside the Hub (Performance is no longer its own navigation destination).
export default function HubPerformance({ posts }) {
  const [open, setOpen] = useState(false);

  const withMetrics = useMemo(
    () => posts.filter((p) => p.manual_metrics && Object.keys(p.manual_metrics).length > 0),
    [posts],
  );
  const totals = useMemo(() => totalMetrics(withMetrics), [withMetrics]);
  const best = useMemo(
    () => withMetrics.map((p) => ({ p, views: Number(p.manual_metrics?.views) || 0 })).sort((a, b) => b.views - a.views)[0],
    [withMetrics],
  );
  const dates = withMetrics.map((p) => p.posted_at || p.scheduled_date).filter(Boolean).sort();

  if (!withMetrics.length) {
    return (
      <div className="rounded-2xl border-[0.5px] border-border bg-card/60 p-6">
        <p className="text-sm text-muted-foreground">
          No performance numbers yet. Log views, likes, shares and saves on a post you’ve marked as posted, and the summary appears here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <Metric label="Views" value={totals.views} />
        <Metric label="Likes" value={totals.likes} />
        <Metric label="Comments" value={totals.comments} />
        <Metric label="Shares" value={totals.shares} />
        <Metric label="Saves" value={totals.saves} />
      </div>

      <div className={CELL}>
        <p className="text-xs text-muted-foreground">Best performing post</p>
        <p className="text-sm font-medium mt-0.5 truncate">
          {best?.p ? `${best.p.platform} · ${best.p.format} — ${best.views.toLocaleString()} views` : '—'}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Manually entered numbers · {dates.length ? `${formatDate(dates[0])} to ${formatDate(dates[dates.length - 1])}` : 'no date range'} ·
        platform metrics are not synced automatically.
      </p>

      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        {open ? 'Hide detailed performance' : 'View detailed performance'}
      </Button>

      {open && (
        <div className="pt-2">
          <MarketingPerformance />
        </div>
      )}
    </div>
  );
}