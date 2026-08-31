import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';

// Files a finished canvas into the media library: the still goes in as a promo
// image, and the MP4 (when the card has one) goes in as a clip.
export default function SendCanvasToLibraryButton({ canvas }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const title = canvas.title || canvas.project_title || 'Canvas';

  const send = async () => {
    setBusy(true);
    try {
      await base44.entities.GalleryImage.create({
        title,
        image_url: canvas.image_url,
        category: 'promo',
        media_category: 'Promo',
        source: 'upload',
        portfolio_item_id: canvas.portfolio_item_id || undefined,
        aspect_ratio: canvas.aspect_ratio,
      });
      if (canvas.video_url) {
        await base44.entities.ClipAsset.create({
          title,
          file: canvas.video_url,
          source_type: 'Canva Export',
          media_category: 'Promo',
          portfolio_item_id: canvas.portfolio_item_id || undefined,
          orientation: 'Vertical 9:16',
        });
      }
      qc.invalidateQueries({ queryKey: ['gallery-images'] });
      qc.invalidateQueries({ queryKey: ['clip-assets'] });
      toast({
        title: 'Sent to your media library',
        description: canvas.video_url ? 'Filed as a promo image and a clip.' : 'Filed as a promo image.',
      });
    } catch (e) {
      toast({ title: 'Could not send it over', description: e.message, variant: 'destructive' });
    }
    setBusy(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={send} disabled={busy} className="gap-1.5">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderPlus className="h-3.5 w-3.5" />}
      Media library
    </Button>
  );
}