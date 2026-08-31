import { Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';
const HELP = 'text-xs text-muted-foreground/80';

const COUNTS = [
  { key: 'posts_per_campaign_week', label: 'Posts per week, per active campaign', fallback: 4 },
  { key: 'posts_per_evergreen_week', label: 'Posts per week, per evergreen song', fallback: 3 },
];

const MIX = [
  { key: 'mix_loop_pct', label: 'Loop clips %', fallback: 60 },
  { key: 'mix_authentic_pct', label: 'Personal %', fallback: 25 },
  { key: 'mix_cta_pct', label: 'Announcement / CTA %', fallback: 15 },
];

export default function GenerationSettingsCard({ form, set }) {
  const num = (key, fallback) => {
    const n = Number(form[key]);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const total = MIX.reduce((sum, m) => sum + num(m.key, m.fallback), 0);

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" /> Auto-generation settings
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Controls how much the daily generator creates and what kind of posts it aims for. Everything it makes still lands as Pending Review.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {COUNTS.map((c) => (
          <div key={c.key} className="space-y-1.5">
            <label className={FL}>{c.label}</label>
            <Input
              type="number"
              min="1"
              inputMode="numeric"
              value={form[c.key] ?? c.fallback}
              onChange={(e) => set(c.key, e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-border/40 space-y-2">
        <label className={FL}>Content mix</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {MIX.map((m) => (
            <div key={m.key} className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">{m.label}</label>
              <Input
                type="number"
                min="0"
                max="100"
                inputMode="numeric"
                value={form[m.key] ?? m.fallback}
                onChange={(e) => set(m.key, e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          ))}
        </div>
        <p className={total === 100 ? HELP : 'text-xs text-amber-600 dark:text-amber-500'}>
          {total === 100
            ? 'The generator aims for this balance across the calendar.'
            : `These add up to ${total}% — they work best at 100%.`}
        </p>
      </div>
    </div>
  );
}