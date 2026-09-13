import { Loader2 } from 'lucide-react';

// Shared preview pane for the canvas wizard.
export default function CanvasPreview({ preview, rendering, className = '' }) {
  return (
    <div className={`rounded-xl border border-border/60 bg-muted/30 p-3 flex items-center justify-center min-h-[220px] ${className}`}>
      {rendering && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      {!rendering && preview && <img src={preview} alt="Canvas preview" className="max-h-[420px] w-auto rounded-md" />}
      {!rendering && !preview && (
        <p className="text-xs text-muted-foreground text-center">Pick a project with cover art to see the color-matched card.</p>
      )}
    </div>
  );
}