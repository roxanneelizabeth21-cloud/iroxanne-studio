import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';
import ToggleRow from './ToggleRow';

// Every portfolio project's evergreen rotation switch in one list — search, toggle, bulk on/off.
export default function ProjectRotationPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['portfolio-items'],
    queryFn: () => base44.entities.PortfolioItem.list('-created_date', 500),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['portfolio-items'] });

  const toggle = async (project, next) => {
    await base44.entities.PortfolioItem.update(project.id, { featured: next });
    refresh();
  };

  const visible = projects.filter((p) => {
    if (!search.trim()) return true;
    return String(p.title || '').toLowerCase().includes(search.trim().toLowerCase());
  });

  const setAllVisible = async (next) => {
    setBusy(true);
    try {
      const targets = visible.filter((p) => !!p.featured !== next);
      if (targets.length) {
        await base44.entities.PortfolioItem.bulkUpdate(targets.map((p) => ({ id: p.id, featured: next })));
      }
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const onCount = projects.filter((p) => p.featured).length;

  return (
    <section className="rounded-xl border border-border/60 bg-card/50">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-3">
        <h2 className="mr-auto flex items-center gap-2 text-sm font-semibold">
          <Briefcase className="h-4 w-4 text-primary" /> Project rotation
          <span className="font-normal text-muted-foreground">({onCount} featured)</span>
        </h2>
        <Button variant="outline" size="sm" disabled={busy || !visible.length} onClick={() => setAllVisible(true)}>All on</Button>
        <Button variant="outline" size="sm" disabled={busy || !visible.length} onClick={() => setAllVisible(false)}>All off</Button>
      </div>
      <div className="flex px-3 py-3">
        <Input placeholder="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
      </div>
      {isLoading ? (
        <p className="px-3 pb-4 text-sm text-muted-foreground">Loading projects…</p>
      ) : !visible.length ? (
        <p className="px-3 pb-4 text-sm text-muted-foreground">No projects match.</p>
      ) : (
        <div className="border-t border-border/40">
          {visible.map((p) => (
            <ToggleRow
              key={p.id}
              label={p.title || 'Untitled'}
              meta={p.category || 'Project'}
              checked={!!p.featured}
              onChange={(v) => toggle(p, v)}
            />
          ))}
        </div>
      )}
      <p className="px-3 pb-3 pt-1 text-xs text-muted-foreground">
        Featured projects are kept in the background rotation by the weekly generator.
      </p>
    </section>
  );
}