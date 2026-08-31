import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, Mail, Users, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Admin: Subscriber table with CSV export.
function escapeCsv(value) {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function SubscribersAdmin() {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ['subscribers'],
    queryFn: () => base44.entities.Subscriber.list('-signup_date', 500),
  });

  const handleDelete = async (subscriber) => {
    if (!window.confirm(`Remove ${subscriber.email} from your subscriber list?`)) return;
    try {
      await base44.entities.Subscriber.delete(subscriber.id);
      await queryClient.invalidateQueries({ queryKey: ['subscribers'] });
    } catch (err) {
      window.alert('Could not delete subscriber. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = search.trim()
    ? subscribers.filter((s) =>
        (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.source_slug || '').toLowerCase().includes(search.toLowerCase()))
    : subscribers;

  const activeCount = subscribers.filter((s) => s.status !== 'unsubscribed').length;

  const exportCsv = () => {
    const headers = ['Email', 'Name', 'Source', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Status', 'Signup Date'];
    const rows = filtered.map((s) => [
      escapeCsv(s.email),
      escapeCsv(s.name),
      escapeCsv(s.source_slug),
      escapeCsv(s.utm_source),
      escapeCsv(s.utm_medium),
      escapeCsv(s.utm_campaign),
      escapeCsv(s.status),
      escapeCsv(formatDate(s.signup_date)),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" /> Subscribers
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {activeCount} active
          </span>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0} className="gap-1.5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email, name, source…"
          className="pl-9 bg-secondary/50 border-border/50"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No subscribers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">UTM</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Signed Up</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border/30 hover:bg-secondary/30">
                    <td className="px-4 py-3">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{s.source_slug || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {[s.utm_source, s.utm_medium, s.utm_campaign].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={s.status === 'unsubscribed' ? 'text-muted-foreground' : 'text-primary'}>
                        {s.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(s.signup_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={deletingId === s.id}
                        onClick={() => { setDeletingId(s.id); handleDelete(s); }}
                        title="Delete subscriber"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}