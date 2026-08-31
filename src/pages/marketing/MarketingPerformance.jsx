import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart3, Eye, Heart, MessageCircle, Share2, Bookmark, Trophy } from 'lucide-react';
import StatCard from '@/components/marketing/StatCard';
import { totalMetrics, platformColor, formatDate } from '@/lib/marketing';

function BarCard({ title, data, dataKey = 'views', color = 'hsl(var(--primary))' }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-display text-lg font-semibold mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function MarketingPerformance() {
  const { data: posts = [] } = useQuery({ queryKey: ['marketing-posts'], queryFn: () => base44.entities.MarketingPost.list('-created_date') });
  const { data: projects = [] } = useQuery({ queryKey: ['portfolio-items'], queryFn: () => base44.entities.PortfolioItem.list() });

  const withMetrics = useMemo(() => posts.filter((p) => p.manual_metrics && Object.keys(p.manual_metrics).length > 0), [posts]);
  const totals = useMemo(() => totalMetrics(withMetrics), [withMetrics]);
  const projectTitle = (pid) => projects.find((r) => r.id === pid)?.title || 'Standalone';

  const byPlatform = useMemo(() => {
    const map = {};
    for (const p of withMetrics) {
      const m = p.manual_metrics || {};
      const e = map[p.platform] = map[p.platform] || { label: p.platform, views: 0, likes: 0 };
      e.views += Number(m.views) || 0;
      e.likes += Number(m.likes) || 0;
    }
    return Object.values(map);
  }, [withMetrics]);

  const byProject = useMemo(() => {
    const map = {};
    for (const p of withMetrics) {
      const m = p.manual_metrics || {};
      const key = p.portfolio_item_id || 'none';
      const e = map[key] = map[key] || { label: projectTitle(p.portfolio_item_id), views: 0, likes: 0 };
      e.views += Number(m.views) || 0;
      e.likes += Number(m.likes) || 0;
    }
    return Object.values(map).sort((a, b) => b.views - a.views);
  }, [withMetrics, projects]);

  const topPosts = useMemo(() => withMetrics
    .map((p) => ({ p, views: Number(p.manual_metrics?.views) || 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10), [withMetrics]);

  if (withMetrics.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <h2 className="font-display text-lg font-semibold mb-1">No performance data yet</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Log manual metrics (views, likes, etc.) on posts you've marked as Posted, and your totals and charts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Eye} label="Views" value={totals.views} accent="bg-blue-500/15 text-blue-500" />
        <StatCard icon={Heart} label="Likes" value={totals.likes} accent="bg-pink-500/15 text-pink-500" />
        <StatCard icon={MessageCircle} label="Comments" value={totals.comments} accent="bg-amber-500/15 text-amber-500" />
        <StatCard icon={Share2} label="Shares" value={totals.shares} accent="bg-emerald-500/15 text-emerald-500" />
        <StatCard icon={Bookmark} label="Saves" value={totals.saves} accent="bg-purple-500/15 text-purple-500" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BarCard title="Views by platform" data={byPlatform} dataKey="views" color="hsl(var(--primary))" />
        <BarCard title="Views by project" data={byProject} dataKey="views" color="hsl(var(--accent))" />
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold flex items-center gap-2 mb-3"><Trophy className="h-5 w-5 text-primary" /> Top posts by views</h2>
        <div className="space-y-2">
          {topPosts.map(({ p, views }, i) => {
            const pc = platformColor(p.platform);
            return (
              <div key={p.id} className="flex items-center gap-3 glass rounded-xl p-3">
                <span className="font-display text-lg font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${pc.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.platform} · {p.format}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.hook || p.caption?.slice(0, 80) || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{views.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">views · {formatDate(p.scheduled_date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}