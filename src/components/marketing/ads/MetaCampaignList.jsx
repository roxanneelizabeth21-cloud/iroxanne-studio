import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MetaCampaignRow from './MetaCampaignRow';

// Every campaign in the selected ad account, sorted by how well it is doing.
export default function MetaCampaignList({ account, range, statusFilter, search }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['meta-campaigns', account, range],
    queryFn: async () =>
      (await base44.functions.invoke('metaAdsCampaigns', { ad_account_id: account, date_preset: range })).data,
  });

  const campaigns = useMemo(() => {
    const all = [...(data?.campaigns || [])].sort((a, b) => (b.ctr || 0) - (a.ctr || 0));
    const q = search.trim().toLowerCase();
    return all.filter((c) => {
      const running = c.effective_status === 'ACTIVE';
      if (statusFilter === 'active' && !running) return false;
      if (statusFilter === 'paused' && running) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, statusFilter, search]);

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your campaigns…
      </p>
    );
  }

  if (!data?.ok) {
    return (
      <div className="glass rounded-2xl p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <p className="text-sm">{data?.error || 'Could not load your campaigns.'}</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return <p className="text-sm text-muted-foreground">No campaigns match what you're looking at right now.</p>;
  }

  const bestId = campaigns.find((c) => c.clicks > 0)?.id;

  return (
    <div className="space-y-2">
      {campaigns.map((c) => (
        <MetaCampaignRow
          key={c.id}
          campaign={c}
          isBest={c.id === bestId}
          adAccountId={data.ad_account_id}
          onChanged={refetch}
        />
      ))}
    </div>
  );
}