import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';
import ToggleRow from './ToggleRow';

// Every song's evergreen rotation switch in one list — search, toggle, bulk on/off.
export default function SongRotationPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busy, setBusy] = useState(false);

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['songProfiles'],
    queryFn: () => base44.entities.SongProfile.list('title', 500),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['songProfiles'] });

  const toggle = async (song, next) => {
    await base44.entities.SongProfile.update(song.id, { evergreen_on: next });
    refresh();
  };

  const visible = songs.filter((s) => {
    if (statusFilter !== 'all' && (s.release_status || 'Unreleased') !== statusFilter) return false;
    if (!search.trim()) return true;
    return String(s.title || '').toLowerCase().includes(search.trim().toLowerCase());
  });

  const setAllVisible = async (next) => {
    setBusy(true);
    try {
      const targets = visible.filter((s) => (s.evergreen_on !== false) !== next);
      if (targets.length) {
        await base44.entities.SongProfile.bulkUpdate(targets.map((s) => ({ id: s.id, evergreen_on: next })));
      }
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const onCount = songs.filter((s) => s.evergreen_on !== false).length;

  return (
    <section className="rounded-xl border border-border/60 bg-card/50">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-3">
        <h2 className="mr-auto flex items-center gap-2 text-sm font-semibold">
          <Music className="h-4 w-4 text-primary" /> Song rotation
          <span className="font-normal text-muted-foreground">({onCount} on)</span>
        </h2>
        <Button variant="outline" size="sm" disabled={busy || !visible.length} onClick={() => setAllVisible(true)}>All on</Button>
        <Button variant="outline" size="sm" disabled={busy || !visible.length} onClick={() => setAllVisible(false)}>All off</Button>
      </div>
      <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row">
        <Input placeholder="Search songs" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-[12rem]">
          <option value="all">All statuses</option>
          <option value="Released">Released</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Unreleased">Unreleased</option>
        </select>
      </div>
      {isLoading ? (
        <p className="px-3 pb-4 text-sm text-muted-foreground">Loading songs…</p>
      ) : !visible.length ? (
        <p className="px-3 pb-4 text-sm text-muted-foreground">No songs match.</p>
      ) : (
        <div className="border-t border-border/40">
          {visible.map((s) => (
            <ToggleRow
              key={s.id}
              label={s.title || 'Untitled'}
              meta={s.release_status || 'Unreleased'}
              checked={s.evergreen_on !== false}
              onChange={(v) => toggle(s, v)}
            />
          ))}
        </div>
      )}
      <p className="px-3 pb-3 pt-1 text-xs text-muted-foreground">
        Only songs marked Released and switched on here get picked up by the weekly rotation.
      </p>
    </section>
  );
}