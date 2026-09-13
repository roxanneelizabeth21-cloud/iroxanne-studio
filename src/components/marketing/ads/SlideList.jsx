import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SOURCE_LABEL = { library: 'From library', release: 'From project', ai: 'AI slide' };

// Ordered carousel cards. Meta shows them left to right in this order.
export default function SlideList({ slides, onChange }) {
  const update = (i, patch) => onChange(slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i) => onChange(slides.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const next = [...slides];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  if (!slides.length) {
    return <p className="text-sm text-muted-foreground">No slides yet — add 2 to 10 below.</p>;
  }

  return (
    <div className="space-y-2">
      {slides.map((s, i) => (
        <div key={`${s.image_url}-${i}`} className="flex gap-3 rounded-lg border border-border/60 bg-background/60 p-2">
          <img src={s.image_url} alt="" className="h-20 w-20 rounded object-cover bg-muted shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">Slide {i + 1} · {SOURCE_LABEL[s.source] || 'Slide'}</span>
              <div className="flex items-center gap-1">
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, -1)} aria-label={`Move slide ${i + 1} earlier`}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, 1)} aria-label={`Move slide ${i + 1} later`}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(i)} aria-label={`Remove slide ${i + 1}`}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <Input value={s.headline || ''} onChange={(e) => update(i, { headline: e.target.value })} placeholder="Headline (e.g. Out now)" className="h-8 text-xs" />
            <Input value={s.description || ''} onChange={(e) => update(i, { description: e.target.value })} placeholder="Description (optional)" className="h-8 text-xs" />
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">{slides.length} of 10 slides. A carousel needs at least 2.</p>
    </div>
  );
}