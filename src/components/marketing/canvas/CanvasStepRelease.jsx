import { useState } from 'react';
import { Search, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/marketing';

// Step 1 — which portfolio project's screenshot the card is built from.
export default function CanvasStepRelease({ releases, releaseId, onPick }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const rows = releases.filter((r) => !term || String(r.title || '').toLowerCase().includes(term));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">Which project is this card for?</h2>
        <p className="text-sm text-muted-foreground mt-1">The card's colours come straight from the screenshot you pick.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your projects" aria-label="Search your projects" className="pl-8" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={releaseId === r.id}
            onClick={() => onPick(r.id)}
            className={`flex min-w-0 items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
              releaseId === r.id ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border bg-card/60 hover:border-primary/40'
            }`}
          >
            {r.cover_image_url ? (
              <img src={r.cover_image_url} alt="" className="h-14 w-14 rounded-lg object-cover bg-muted shrink-0" loading="lazy" />
            ) : (
              <span className="h-14 w-14 rounded-lg bg-muted grid place-items-center shrink-0">
                <LayoutGrid className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-sm font-medium truncate">{r.title}</span>
              {r.category && <span className="block text-[11px] text-muted-foreground truncate">{r.category}</span>}
              {r.date_built && <span className="block text-[11px] text-muted-foreground truncate">{formatDate(r.date_built)}</span>}
            </span>
          </button>
        ))}
        {!rows.length && <p className="text-sm text-muted-foreground sm:col-span-2">Nothing matches that search.</p>}
      </div>
    </div>
  );
}