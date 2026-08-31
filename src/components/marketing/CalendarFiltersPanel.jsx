import { Button } from '@/components/ui/button';
import { PLATFORMS, POST_STATUSES } from '@/lib/marketing';
import DateField from '@/components/marketing/DateField';

// The calendar's advanced filters, hidden until the owner opens them. Selections
// are held by the calendar page, so closing the panel never clears them.
export default function CalendarFiltersPanel({ filters, setFilters, campaigns, projects, onClear, activeCount }) {
  const set = (patch) => setFilters({ ...filters, ...patch });

  return (
    <div className="rounded-2xl border-[0.5px] border-border bg-card/60 p-3 sm:p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <select value={filters.campaign} onChange={(e) => set({ campaign: e.target.value })} aria-label="Filter by campaign">
          <option value="">All campaigns</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.project} onChange={(e) => set({ project: e.target.value })} aria-label="Filter by project">
          <option value="">All projects</option>
          {projects.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <select value={filters.platform} onChange={(e) => set({ platform: e.target.value })} aria-label="Filter by platform">
          <option value="">All platforms</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => set({ status: e.target.value })} aria-label="Filter by status">
          <option value="">All statuses</option>
          {POST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.media} onChange={(e) => set({ media: e.target.value })} aria-label="Filter by media">
          <option value="">All media</option>
          <option value="has">Has media</option>
          <option value="none">No media</option>
        </select>
        <select value={filters.approval} onChange={(e) => set({ approval: e.target.value })} aria-label="Filter by approval state">
          <option value="">All approval states</option>
          <option value="Not Reviewed">Not reviewed</option>
          <option value="Changes Requested">Changes requested</option>
          <option value="Approved">Approved</option>
        </select>
        <select value={filters.flag} onChange={(e) => set({ flag: e.target.value })} aria-label="Filter by flag">
          <option value="">No flag filter</option>
          <option value="media_missing">Media missing</option>
          <option value="needs_crop">Needs crop</option>
          <option value="published">Published</option>
          <option value="failed">Failed or partial</option>
        </select>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="cal-from">From date</label>
          <DateField id="cal-from" value={filters.from} onChange={(v) => set({ from: v })} placeholder="Any start date" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="cal-to">To date</label>
          <DateField id="cal-to" value={filters.to} onChange={(v) => set({ to: v })} placeholder="Any end date" />
        </div>
      </div>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear}>Clear Filters</Button>
      )}
    </div>
  );
}