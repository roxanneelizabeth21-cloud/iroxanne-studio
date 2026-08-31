import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CanvasPreview from './CanvasPreview';

// Step 3 — final look, then save it to your canvases.
export default function CanvasStepSave({ release, design, preset, cta, preview, rendering, saving, onSave }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">Ready to save?</h2>
        <p className="text-sm text-muted-foreground mt-1">Saved canvases are ready to attach to a post or download.</p>
      </div>

      <CanvasPreview preview={preview} rendering={rendering} />

      <dl className="grid gap-1 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground inline">Release: </dt><dd className="inline">{release?.title || '—'}</dd></div>
        <div><dt className="text-muted-foreground inline">Built for: </dt><dd className="inline">{preset?.label}</dd></div>
        <div><dt className="text-muted-foreground inline">Size: </dt><dd className="inline">{preset ? `${preset.ratio} · ${preset.w}×${preset.h}` : '—'}</dd></div>
        <div><dt className="text-muted-foreground inline">Call to action: </dt><dd className="inline">{cta || 'None'}</dd></div>
        <div><dt className="text-muted-foreground inline">Badges: </dt><dd className="inline">{design.services.join(', ') || 'None'}</dd></div>
      </dl>

      <Button type="button" onClick={onSave} disabled={!preview || saving} className="gap-1.5">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save canvas'}
      </Button>
    </div>
  );
}