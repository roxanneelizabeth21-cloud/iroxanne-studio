import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone } from 'lucide-react';
import ToggleRow from './ToggleRow';

// Flip campaigns between Active and Planning without opening each one.
export default function CampaignActivePanel() {
  const qc = useQueryClient();
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 200),
  });

  const toggle = async (campaign, next) => {
    await base44.entities.Campaign.update(campaign.id, { status: next ? 'Active' : 'Planning' });
    qc.invalidateQueries({ queryKey: ['campaigns'] });
  };

  const activeCount = campaigns.filter((c) => c.status === 'Active').length;
  const rows = campaigns.filter((c) => c.status !== 'Archived');

  return (
    <section className="rounded-xl border border-border/60 bg-card/50">
      <div className="border-b border-border/60 px-3 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Megaphone className="h-4 w-4 text-primary" /> Active campaigns
          <span className="font-normal text-muted-foreground">({activeCount} active)</span>
        </h2>
      </div>
      {isLoading ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">Loading campaigns…</p>
      ) : !rows.length ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">No campaigns yet.</p>
      ) : (
        rows.map((c) => (
          <ToggleRow
            key={c.id}
            label={c.name}
            meta={c.status === 'Completed' ? 'Completed' : c.status}
            checked={c.status === 'Active'}
            onChange={(v) => toggle(c, v)}
          />
        ))
      )}
      <p className="px-3 pb-3 pt-2 text-xs text-muted-foreground">
        Switching a campaign on sets it to Active, so the weekly generator fills its week. Off puts it back to Planning.
      </p>
    </section>
  );
}