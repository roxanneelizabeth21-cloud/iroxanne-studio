import { Eye, Users, Globe, Compass } from 'lucide-react';
import { formatPageLabel } from '@/lib/analytics';

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-display font-bold leading-none truncate">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function StatCards({ stats }) {
  const topSource = stats.topSources[0]?.[0] || '—';
  const topLandingPage = stats.topLandingPages[0]
    ? formatPageLabel(stats.topLandingPages[0][0])
    : '—';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard icon={Eye} label="Total Visits" value={stats.total} />
      <StatCard icon={Users} label="Unique Visitors" value={stats.uniqueVisitors} />
      <StatCard icon={Globe} label="Top Source" value={topSource} />
      <StatCard icon={Compass} label="Top Landing Page" value={topLandingPage} />
    </div>
  );
}