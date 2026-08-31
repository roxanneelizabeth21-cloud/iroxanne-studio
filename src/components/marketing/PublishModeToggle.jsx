import { Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// Controlled auto/manual publish-mode toggle for Facebook/Instagram posts.
// value: 'manual' | 'auto'; onChange receives the new mode string.
export default function PublishModeToggle({ value, onChange, disabled = false }) {
  const auto = value === 'auto';
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Zap className={`h-4 w-4 shrink-0 ${auto ? 'text-amber-500' : 'text-muted-foreground'}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">Auto-publish at scheduled time</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {auto ? 'Publishes itself when its scheduled time arrives (post must be Ready)' : 'Manual — you tap Publish yourself'}
          </p>
        </div>
      </div>
      <Switch checked={auto} onCheckedChange={(c) => onChange(c ? 'auto' : 'manual')} disabled={disabled} />
    </div>
  );
}