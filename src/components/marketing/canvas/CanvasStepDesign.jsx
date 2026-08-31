import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CanvasPreview from './CanvasPreview';
import ColorSwatchPicker from './ColorSwatchPicker';
import { serviceColor } from '@/lib/canvasServiceIcons';

const CTA_PRESETS = ['Out now', 'Streaming everywhere', 'Pre-save now', 'Listen now', 'Link in bio', 'Custom'];
const SERVICES = ['Spotify', 'Apple Music', 'YouTube', 'Amazon Music', 'Deezer', 'Tidal', 'Pandora'];

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

// Step 2 — background colour, call to action and platform marks, with a live preview.
export default function CanvasStepDesign({ design, patch, preset, palette, color, preview, rendering }) {
  const toggleService = (s) =>
    patch({ services: design.services.includes(s) ? design.services.filter((x) => x !== s) : [...design.services, s] });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">How should the card look?</h2>
        <p className="text-sm text-muted-foreground mt-1">Portrait card at {preset.w}×{preset.h}. Pick the background colour — every swatch is pulled from your cover art.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className={FL}>Background colour</span>
            <ColorSwatchPicker colors={palette} value={color} onPick={(hex) => patch({ color: hex })} />
          </div>

          <div className="space-y-1.5">
            <label className={FL} htmlFor="cv-cta">Second line</label>
            <select id="cv-cta" value={design.ctaPreset} onChange={(e) => patch({ ctaPreset: e.target.value })}>
              <option value="">No second line</option>
              {CTA_PRESETS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {design.ctaPreset === 'Custom' && (
              <Input value={design.customCta} onChange={(e) => patch({ customCta: e.target.value })} placeholder="Your line" aria-label="Custom second line" />
            )}
          </div>

          <div className="space-y-1.5">
            <label className={FL} htmlFor="cv-subtext">Third line (optional)</label>
            <Input
              id="cv-subtext"
              value={design.subtext || ''}
              onChange={(e) => patch({ subtext: e.target.value })}
              placeholder="Leave blank for none"
            />
          </div>

          <div className="space-y-1.5">
            <span className={FL}>Platform marks</span>
            <div className="flex flex-wrap gap-1.5">
              {SERVICES.map((s) => (
                <Button key={s} type="button" size="sm" variant={design.services.includes(s) ? 'default' : 'outline'} onClick={() => toggleService(s)}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: serviceColor(s) }} aria-hidden="true" />
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <CanvasPreview preview={preview} rendering={rendering} />
      </div>
    </div>
  );
}