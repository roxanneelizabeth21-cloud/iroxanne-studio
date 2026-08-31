import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Palette, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// Lists Canva designs and imports the chosen one into the media library.
export default function CanvaImportDialog({ open, onOpenChange, onImported, allowVideo = false }) {
  const { toast } = useToast();
  const [asVideo, setAsVideo] = useState(false);
  const [designs, setDesigns] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importingId, setImportingId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('listCanvaDesigns', {});
      if (res?.data?.error) throw new Error(res.data.error);
      setDesigns(res?.data?.designs || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  // The dialog is opened from the parent's own button, so loading has to be
  // driven by the open prop — Radix's onOpenChange never fires for that.
  useEffect(() => {
    if (open && designs === null && !loading) load();
  }, [open]);

  const importDesign = async (design) => {
    setImportingId(design.id);
    try {
      const res = await base44.functions.invoke('importCanvaDesign', {
        design_id: design.id,
        title: design.title,
        ...(asVideo ? { format: 'mp4' } : {}),
      });
      if (res?.data?.error) throw new Error(res.data.error);
      toast({ title: `“${design.title}” added to your ${asVideo ? 'clips library' : 'media library'}` });
      onImported?.(res?.data?.assets?.[0] || null);
    } catch (e) {
      toast({ title: 'Import failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setImportingId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Import from Canva</DialogTitle>
          <DialogDescription>
            {asVideo
              ? 'Pick a design and it comes back as a video clip, with the audio you added in Canva.'
              : 'Pick a design and it comes in as a reusable graphic.'}
          </DialogDescription>
        </DialogHeader>

        {allowVideo && (
          <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-2 text-sm">
            <input type="checkbox" checked={asVideo} onChange={(e) => setAsVideo(e.target.checked)} className="h-4 w-4 accent-primary" />
            Bring it back as a video with my audio
          </label>
        )}

        {loading && (
          <p className="text-sm text-muted-foreground inline-flex items-center gap-2 py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your Canva designs…
          </p>
        )}

        {!loading && error && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>Try again</Button>
          </div>
        )}

        {!loading && !error && designs?.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No designs found in your Canva account yet.</p>
        )}

        {!loading && !error && !!designs?.length && (
          <ul className="max-h-[60vh] overflow-y-auto space-y-2 list-none p-0">
            {designs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl border-[0.5px] border-border bg-card/60 p-2">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-muted overflow-hidden">
                  {d.thumbnail && <img src={d.thumbnail} alt="" className="w-full h-full object-cover" />}
                </div>
                <p className="text-sm font-medium flex-1 min-w-0 truncate">{d.title}</p>
                <Button size="sm" variant="outline" className="gap-1.5 shrink-0" disabled={!!importingId} onClick={() => importDesign(d)}>
                  {importingId === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Import
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}