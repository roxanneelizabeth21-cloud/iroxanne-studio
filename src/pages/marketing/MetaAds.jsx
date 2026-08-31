import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import MetaAdRow from '@/components/marketing/ads/MetaAdRow';
import MetaCampaignList from '@/components/marketing/ads/MetaCampaignList';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

const RANGES = [
  { value: 'maximum', label: 'All time' },
  { value: 'last_7d', label: 'Last 7 days' },
  { value: 'last_30d', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
];

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Running' },
  { value: 'paused', label: 'Paused' },
];

const VIEWS = [
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'ads', label: 'Individual ads' },
];

// Every campaign and ad in the connected Meta ad accounts, live from Meta,
// with pause/resume so campaigns can be managed here instead of in Meta.
export default function MetaAds() {
  const [view, setView] = useState('campaigns');
  const [account, setAccount] = useState('');
  const [range, setRange] = useState('maximum');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['meta-ads-list', account, range],
    queryFn: async () =>
      (await base44.functions.invoke('metaAdsList', { ad_account_id: account, date_preset: range })).data,
  });

  const ads = useMemo(() => {
    const all = data?.ads || [];
    const q = search.trim().toLowerCase();
    return all.filter((ad) => {
      const running = ad.status === 'ACTIVE';
      if (status === 'active' && !running) return false;
      if (status === 'paused' && running) return false;
      if (q && !`${ad.name} ${ad.campaign_name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, status]);

  const totals = useMemo(
    () =>
      ads.reduce(
        (t, a) => ({
          spend: t.spend + Number(a.spend || 0),
          clicks: t.clicks + Number(a.clicks || 0),
          impressions: t.impressions + Number(a.impressions || 0),
        }),
        { spend: 0, clicks: 0, impressions: 0 },
      ),
    [ads],
  );

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your ads from Meta…
      </p>
    );
  }

  if (!data?.ok) {
    return (
      <div className="glass rounded-2xl p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <p className="text-sm">{data?.error || 'Meta Ads is not available right now.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-4">
      <HowThisWorks
        steps={[
          'Pick the ad account, the date range, and whether you want campaigns or single ads.',
          'Read the row: what it spent, how many people saw it, and how many clicked.',
          'Use the switch on a row to pause or resume it — the change goes straight to Meta.',
        ]}
        note="Numbers come live from Meta, so they can lag a few hours behind."
      />
      <div className="glass rounded-2xl p-4 space-y-4 sm:p-5">
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => setView(v.value)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${view === v.value ? 'bg-background font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className={FL}>Ad account</label>
            <select
              aria-label="Ad account"
              value={account || data.ad_account_id || ''}
              onChange={(e) => setAccount(e.target.value)}
            >
              {(data.accounts || []).map((a) => (
                <option key={a.account_id} value={a.account_id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={FL}>Results for</label>
            <select aria-label="Results for" value={range} onChange={(e) => setRange(e.target.value)}>
              {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={FL}>Show</label>
            <select aria-label="Show" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input value={search} className="min-w-[12rem] flex-1" onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" />
          <Button type="button" variant="outline" onClick={() => refetch()} className="shrink-0 gap-1.5">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
        {view === 'ads' && (
          <p className="text-xs text-muted-foreground">
            {ads.length} ads · ${totals.spend.toFixed(2)} spent · {totals.clicks.toLocaleString()} clicks ·{' '}
            {totals.impressions.toLocaleString()} views
          </p>
        )}
      </div>

      {view === 'campaigns' ? (
        <MetaCampaignList
          account={account || data.ad_account_id || ''}
          range={range}
          statusFilter={status}
          search={search}
        />
      ) : ads.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ads match what you're looking at right now.</p>
      ) : (
        <div className="space-y-2">
          {ads.map((ad) => <MetaAdRow key={ad.id} ad={ad} onChanged={refetch} />)}
        </div>
      )}
    </div>
  );
}