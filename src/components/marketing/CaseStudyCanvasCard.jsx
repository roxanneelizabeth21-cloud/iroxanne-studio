import { Copy, Download, Film, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SendToCanvaButton from '@/components/marketing/canvas/SendToCanvaButton';
import DownloadFileButton from '@/components/marketing/DownloadFileButton';
import SendCanvasToLibraryButton from '@/components/marketing/canvas/SendCanvasToLibraryButton';

export default function CaseStudyCanvasCard({ canvas, onDelete, onDuplicate }) {
  const slug = (canvas.title || canvas.project_title || 'canvas')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (
    <div className="rounded-lg border border-border/60 overflow-hidden bg-card">
      <img src={canvas.image_url} alt={canvas.title || 'Case study card'} className="w-full object-cover" />
      <div className="p-3 space-y-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{canvas.title || canvas.project_title}</p>
          <p className="text-[11px] text-muted-foreground">
            {canvas.aspect_ratio}
            {canvas.cta ? ` · ${canvas.cta}` : ''}
            {canvas.services?.length ? ` · ${canvas.services.join(', ')}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => onDuplicate(canvas)} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Duplicate &amp; edit
          </Button>
          <SendToCanvaButton imageUrl={canvas.image_url} title={canvas.title || canvas.project_title} />
          <SendCanvasToLibraryButton canvas={canvas} />
          <DownloadFileButton
            url={canvas.image_url}
            filename={`${slug}.png`}
            icon={Download}
            label="PNG"
          />
          {!canvas.video_url && (
            <span className="text-[11px] text-muted-foreground">
              PNG only — hit Duplicate &amp; edit, then save, to add the MP4
            </span>
          )}
          {canvas.video_url && (
            <DownloadFileButton
              url={canvas.video_url}
              filename={`${slug}.${canvas.video_format || 'mp4'}`}
              icon={Film}
              label={(canvas.video_format || 'mp4').toUpperCase()}
            />
          )}
          <Button variant="ghost" size="sm" onClick={() => onDelete(canvas)} className="text-destructive gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}