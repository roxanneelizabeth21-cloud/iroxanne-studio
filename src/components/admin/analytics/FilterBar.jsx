import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

const DATE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export default function FilterBar({ filters, setFilters, sources, landingPages, campaigns, devices }) {
  const update = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 mr-1">
        <Filter className="h-3.5 w-3.5" /> Filters
      </div>
      <Select value={filters.dateRange} onValueChange={(v) => update('dateRange', v)}>
        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {DATE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.source} onValueChange={(v) => update('source', v)}>
        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All sources</SelectItem>
          {sources.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.landingPage} onValueChange={(v) => update('landingPage', v)}>
        <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All landing pages</SelectItem>
          {landingPages.map((p) => <SelectItem key={p} value={p} className="text-xs">{p === '/' ? 'Home' : p}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.campaign} onValueChange={(v) => update('campaign', v)}>
        <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All campaigns</SelectItem>
          {campaigns.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.device} onValueChange={(v) => update('device', v)}>
        <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All devices</SelectItem>
          {devices.map((d) => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}