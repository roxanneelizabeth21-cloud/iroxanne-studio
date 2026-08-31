import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CAMPAIGN_STATUSES } from '@/lib/marketing';

// Search + status filter for the Campaigns page. Everything else about a
// campaign lives on its own detail page.
export default function CampaignListControls({ query, onQuery, status, onStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search campaigns" aria-label="Search campaigns" className="pl-8" />
      </div>
      <select value={status} onChange={(e) => onStatus(e.target.value)} aria-label="Filter by status" className="w-auto min-w-[160px]">
        <option value="">All statuses</option>
        {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}