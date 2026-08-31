import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Globe, Compass } from 'lucide-react';
import { summarizeVisits, formatPageLabel } from '@/lib/analytics';
import StatCards from '@/components/admin/analytics/StatCards';
import RankingChart from '@/components/admin/analytics/RankingChart';
import FilterBar from '@/components/admin/analytics/FilterBar';
import RecentVisitsTable from '@/components/admin/analytics/RecentVisitsTable';

export default function VisitorStats() {
  const [filters, setFilters] = useState({
    dateRange: 'all',
    source: 'all',
    landingPage: 'all',
    campaign: 'all',
    device: 'all',
  });

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['page-visits'],
    queryFn: () => base44.entities.PageVisit.list('-created_date', 500),
  });

  // Build filter option lists from the data.
  const { sources, landingPages, campaigns, devices } = useMemo(() => {
    const src = new Set(), lp = new Set(), camp = new Set(), dev = new Set();
    for (const v of visits) {
      if (v.source) src.add(v.source);
      const page = v.landing_page || v.current_page;
      if (page) lp.add(page);
      if (v.campaign) camp.add(v.campaign);
      if (v.device_type) dev.add(v.device_type);
    }
    return {
      sources: [...src].sort(),
      landingPages: [...lp].sort(),
      campaigns: [...camp].sort(),
      devices: [...dev].sort(),
    };
  }, [visits]);

  // Apply filters.
  const filtered = useMemo(() => {
    const now = Date.now();
    const days = filters.dateRange !== 'all' ? parseInt(filters.dateRange, 10) : null;
    return visits.filter((v) => {
      const ts = v.timestamp || v.created_date;
      if (days && ts) {
        if (now - new Date(ts).getTime() > days * 86400000) return false;
      }
      if (filters.source !== 'all' && (v.source || 'Direct / None') !== filters.source) return false;
      if (filters.landingPage !== 'all' && (v.landing_page || v.current_page) !== filters.landingPage) return false;
      if (filters.campaign !== 'all' && (v.campaign || '') !== filters.campaign) return false;
      if (filters.device !== 'all' && (v.device_type || '') !== filters.device) return false;
      return true;
    });
  }, [visits, filters]);

  const stats = useMemo(() => summarizeVisits(filtered), [filtered]);

  return (
    <div className="space-y-6">
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        sources={sources}
        landingPages={landingPages}
        campaigns={campaigns}
        devices={devices}
      />
      <StatCards stats={stats} />
      <div className="grid md:grid-cols-2 gap-4">
        <RankingChart
          title="Top Sources"
          icon={Globe}
          data={stats.topSources}
          total={stats.total}
          accentClass="bg-accent/70"
        />
        <RankingChart
          title="Top Landing Pages"
          icon={Compass}
          data={stats.topLandingPages}
          total={stats.total}
          accentClass="bg-primary/70"
          formatLabel={formatPageLabel}
        />
      </div>
      <RecentVisitsTable visits={filtered} isLoading={isLoading} />
    </div>
  );
}