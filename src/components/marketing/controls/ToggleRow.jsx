import { Switch } from '@/components/ui/switch';

// One switchable line: label, small meta line, and the toggle on the right.
export default function ToggleRow({ label, meta, checked, onChange, disabled }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={label} />
    </div>
  );
}