import { ChevronLeft, ChevronRight, Filter, Search, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BulkPublishModeButton from '@/components/marketing/BulkPublishModeButton';
import DateField from '@/components/marketing/DateField';

// One tidy header card for the calendar: period nav, view switch, search and
// the collapsed filter/queue controls — instead of four stacked loose rows.
export default function CalendarToolbar({
  views, view, setView, label, onMove, onToday,
  filters, setFilters, showFilters, setShowFilters, activeFilterCount,
  unscheduledCount, showQueue, setShowQueue, posts, timezone, timezoneShort,
  cursorDate, onJumpToDate,
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => onMove(-1)} aria-label="Previous period"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-display text-base sm:text-lg font-semibold min-w-[150px] text-center">{label}</span>
          <Button variant="outline" size="icon" onClick={() => onMove(1)} aria-label="Next period"><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onToday}>Today</Button>
          <DateField
            value={cursorDate}
            onChange={onJumpToDate}
            clearable={false}
            placeholder="Jump to date"
            className="w-[190px]"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-secondary/40 p-1" role="tablist" aria-label="Calendar views">
          {views.map((v) => (
            <button
              key={v.key}
              role="tab"
              aria-selected={view === v.key}
              onClick={() => setView(v.key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${view === v.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <v.Icon className="h-3.5 w-3.5" aria-hidden="true" /> <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="Search captions, campaigns, projects"
            aria-label="Search posts"
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
          <Filter className="h-3.5 w-3.5" aria-hidden="true" /> Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-primary text-primary-foreground text-[11px] px-1.5 tabular-nums">{activeFilterCount}</span>
          )}
        </Button>
        <Button variant="outline" size="sm" className="lg:hidden gap-1.5" onClick={() => setShowQueue(!showQueue)}>
          <Inbox className="h-3.5 w-3.5" aria-hidden="true" /> Unscheduled ({unscheduledCount})
        </Button>
        <BulkPublishModeButton posts={posts} />
      </div>

      <p className="text-xs text-muted-foreground">
        Times shown in <span className="font-medium text-foreground">{timezone} ({timezoneShort})</span> · change it on the Brand page
      </p>
    </div>
  );
}