import { CANVAS_PRESETS, presetSizeLabel } from '@/lib/canvasPresets';

// One grouped dropdown for the delivery size — streaming specs first, social after.
export default function CanvasSizePicker({ presetId, onPick, note }) {
  const groups = [...new Set(CANVAS_PRESETS.map((p) => p.group))];
  return (
    <div className="space-y-1.5">
      <select value={presetId} onChange={(e) => onPick(e.target.value)} aria-label="Where is it going?">
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {CANVAS_PRESETS.filter((p) => p.group === g).map((p) => (
              <option key={p.id} value={p.id}>{`${p.label} — ${presetSizeLabel(p)}`}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}