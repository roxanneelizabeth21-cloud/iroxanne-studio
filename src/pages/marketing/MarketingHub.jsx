import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import HubTaskGrid from '@/components/marketing/hub/HubTaskGrid';
import HubStatusStrip from '@/components/marketing/hub/HubStatusStrip';
import HubToolLinks from '@/components/marketing/hub/HubToolLinks';
import { dateKey } from '@/lib/marketing';

const DONE = ['Posted', 'Skipped', 'Cancelled'];

// Marketing home. Its only job is answering "what do you want to do?" and
// routing there fast — no feature dumping on this screen.
export default function MarketingHub() {
  const { data: posts = [] } = useQuery({ queryKey: ['marketing-posts'], queryFn: () => base44.entities.MarketingPost.list('-created_date') });
  const { data: projects = [] } = useQuery({ queryKey: ['portfolio-items'], queryFn: () => base44.entities.PortfolioItem.list() });

  const { dueToday, nextPost } = useMemo(() => {
    const today = dateKey(new Date());
    const open = posts.filter((p) => p.scheduled_date && !DONE.includes(p.status));
    const upcoming = open
      .filter((p) => p.scheduled_date >= today)
      .sort((a, b) => (a.scheduled_date === b.scheduled_date
        ? String(a.scheduled_time || '99:99').localeCompare(String(b.scheduled_time || '99:99'))
        : a.scheduled_date.localeCompare(b.scheduled_date)));
    return { dueToday: open.filter((p) => p.scheduled_date === today).length, nextPost: upcoming[0] || null };
  }, [posts]);

  const nextTitle = projects.find((r) => r.id === nextPost?.portfolio_item_id)?.title || '';

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">What do you want to do?</h1>
        <span aria-hidden="true" className="mt-2 block h-px bg-primary/60" />
      </div>

      <HubStatusStrip dueToday={dueToday} nextPost={nextPost} nextTitle={nextTitle} />

      <HubTaskGrid />

      <HubToolLinks />
    </div>
  );
}