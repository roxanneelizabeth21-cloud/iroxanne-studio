import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { renderCaptionedImage } from '@/lib/captionImage';
import CaptionPreview from '@/components/marketing/CaptionPreview';
import CaptionControls from '@/components/marketing/CaptionControls';

// Adds a caption onto a library image and saves it as a real flattened file.
// On videos the preview is planning-only — nothing can be baked into a video here.
export default function CaptionEditor({ asset, open, onOpenChange, onDone }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [style, setStyle] = useState({ text: '', size: 'medium', font: 'inter', color: 'white', position: 'bottom', scrim: true });
  const [saving, setSaving] = useState(false);

  if (!asset) return null;
  const isVideo = asset.kind === 'video';

  const save = async (replace) => {
    setSaving(true);
    try {
      const file = await renderCaptionedImage({
        url: asset.url,
        text: style.text,
        size: style.size,
        font: style.font,
        color: style.color,
        position: style.position,
        scrim: style.scrim,
        fileName: asset.title,
      });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (replace === 'post') {
        onDone(file_url);
        toast({ title: 'Caption added to this post’s image' });
        onOpenChange(false);
        return;
      }
      if (replace) {
        await base44.entities.GalleryImage.update(asset.recordId, { image_url: file_url });
      } else {
        await base44.entities.GalleryImage.create({
          title: `${asset.title} (captioned)`,
          image_url: file_url,
          category: 'promo',
          source: 'upload',
        });
      }
      qc.invalidateQueries({ queryKey: ['gallery-images'] });
      toast({ title: replace ? 'Caption saved onto this image' : 'Captioned copy added to your library' });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Could not save the caption', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Type className="h-4 w-4" /> Add a caption</DialogTitle>
          <DialogDescription>
            {isVideo
              ? 'Videos can only be previewed here. Use this to decide the wording and placement, then build it in Canva.'
              : 'The caption is saved into the image itself, so it stays on the picture when you post it.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 items-start">
          <CaptionPreview asset={asset} style={style} />
          <CaptionControls style={style} onChange={(patch) => setStyle({ ...style, ...patch })} />
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {!isVideo && onDone && (
            <Button onClick={() => save('post')} disabled={!style.text.trim() || saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Use on this post
            </Button>
          )}
          {!isVideo && !onDone && (
            <>
              <Button variant="outline" onClick={() => save(false)} disabled={!style.text.trim() || saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save as new image
              </Button>
              <Button onClick={() => save(true)} disabled={!style.text.trim() || saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Replace this image
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}