import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CAPTION_FONTS } from '@/lib/captionImage';

const LABEL = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';

// Caption wording and look controls.
export default function CaptionControls({ style, onChange }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className={LABEL} htmlFor="caption-text">Caption</label>
        <Textarea
          id="caption-text"
          rows={4}
          value={style.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Type the words you want on the picture"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL} htmlFor="caption-position">Placement</label>
        <select id="caption-position" value={style.position} onChange={(e) => onChange({ position: e.target.value })}>
          <option value="top">Top</option>
          <option value="center">Middle</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL} htmlFor="caption-font">Font</label>
        <select
          id="caption-font"
          value={style.font}
          onChange={(e) => onChange({ font: e.target.value })}
          style={{ fontFamily: CAPTION_FONTS[style.font]?.stack }}
        >
          {Object.entries(CAPTION_FONTS).map(([key, f]) => (
            <option key={key} value={key} style={{ fontFamily: f.stack }}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL} htmlFor="caption-size">Text size</label>
        <select id="caption-size" value={style.size} onChange={(e) => onChange({ size: e.target.value })}>
          <option value="tiny">Tiny</option>
          <option value="xsmall">Extra small</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL} htmlFor="caption-color">Text color</label>
        <select id="caption-color" value={style.color} onChange={(e) => onChange({ color: e.target.value })}>
          <option value="white">White</option>
          <option value="gold">Gold</option>
          <option value="black">Black</option>
        </select>
      </div>

      <div className="flex items-center justify-between rounded-xl border-[0.5px] border-border bg-card/60 px-3 py-2">
        <div>
          <p className="text-sm font-medium">Shade behind the text</p>
          <p className="text-xs text-muted-foreground">Keeps the words readable over a busy photo.</p>
        </div>
        <Switch checked={style.scrim} onCheckedChange={(v) => onChange({ scrim: v })} aria-label="Shade behind the text" />
      </div>
    </div>
  );
}