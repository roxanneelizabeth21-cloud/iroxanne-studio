import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FIELD_LABEL } from '@/components/marketing/postEditorFields';
import { effectiveSchedule, PLATFORM_FIELDS } from '@/lib/platformSchedule';
import { displayTime } from '@/lib/postValidation';

// Optional per-platform send times, so Instagram and Facebook can be staggered.
// Blank fields inherit the post's own date/time.
function PlatformRow({ platform, form, set }) {
  const f = PLATFORM_FIELDS[platform];
  const eff = effectiveSchedule(form, platform);
  const clear = () => { set(f.date, ''); set(f.time, ''); };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className={FIELD_LABEL}>{platform}</label>
        {eff.overridden && (
          <Button type="button" size="sm" variant="ghost" onClick={clear} className="h-6 px-2 text-[11px]">Use post time</Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={form[f.date] || ''} onChange={(e) => set(f.date, e.target.value)} aria-label={`${platform} date`} />
        <Input type="time" value={form[f.time] || ''} onChange={(e) => set(f.time, e.target.value)} aria-label={`${platform} time`} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Sends {eff.date || 'no date yet'}{eff.time ? ` at ${displayTime(eff.time)}` : ''}
        {eff.overridden ? '' : ' — inherited from the post date/time'}
      </p>
    </div>
  );
}

export default function PlatformScheduleFields({ form, set }) {
  return (
    <div className="glass rounded-xl p-3 space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stagger send times</p>
      <PlatformRow platform="Instagram" form={form} set={set} />
      <PlatformRow platform="Facebook" form={form} set={set} />
      <p className="text-[11px] text-muted-foreground">Leave a platform blank to send it with the post date and time above.</p>
    </div>
  );
}