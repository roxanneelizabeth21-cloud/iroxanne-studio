import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Search, Trash2, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export default function ContactMessagesAdmin() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: () => base44.entities.ContactMessage.list('-created_date', 500),
  });

  const filtered = search.trim()
    ? messages.filter((m) =>
        (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.subject || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.message || '').toLowerCase().includes(search.toLowerCase()))
    : messages;

  const handleDelete = async (id) => {
    if (!confirm('Delete this message?')) return;
    await base44.entities.ContactMessage.delete(id);
    qc.invalidateQueries({ queryKey: ['contact-messages'] });
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> Messages
        </h2>
        <span className="text-xs text-muted-foreground">{messages.length} total</span>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, subject, message…"
          className="pl-9 bg-secondary/50 border-border/50"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No messages yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/30 cursor-pointer" onClick={() => setSelected(m)}>
                    <td className="px-4 py-3">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{m.subject || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(m.created_date)}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold">{selected.subject || '(No subject)'}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="text-foreground">{selected.name}</span> · {selected.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(selected.created_date)}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed border-t border-border/50 pt-4">{selected.message}</div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/50">
              <a href={`mailto:${selected.email}`} className="text-sm text-primary underline flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> Reply via email
              </a>
              <Button variant="outline" size="sm" onClick={() => handleDelete(selected.id)} className="gap-1.5 text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}