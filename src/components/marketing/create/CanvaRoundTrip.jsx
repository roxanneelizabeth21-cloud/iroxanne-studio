import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SendToCanvaButton from '@/components/marketing/canvas/SendToCanvaButton';
import CanvaImportDialog from '@/components/marketing/CanvaImportDialog';
import { clipAttachPatch, urlAttachPatch } from '@/lib/postMedia';

// Round-trip for the media already attached to a post: edit it in Canva, then
// bring the finished design back and swap it straight into this same post.
// The post itself (caption, hashtags, schedule) is untouched.
export default function CanvaRoundTrip({ media, title, aspect, patchPost }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const attach = async (asset) => {
    if (!asset?.url) return;
    qc.invalidateQueries({ queryKey: ['clip-assets'] });
    qc.invalidateQueries({ queryKey: ['gallery-images'] });
    const patch = asset.type === 'video' ? clipAttachPatch({ id: asset.id }) : urlAttachPatch(asset.url);
    await patchPost({ ...patch, ...(aspect ? { requested_aspect_ratio: aspect } : {}) });
    setOpen(false);
    toast({ title: 'Your Canva version is now on this post' });
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-3 space-y-2">
      <p className="text-xs text-muted-foreground">
        Want to polish this in Canva? Open it there, save your changes, then bring it back — your caption and everything
        else on this post stays exactly as it is.
      </p>
      <div className="flex flex-wrap gap-2">
        {media?.type === 'image' && <SendToCanvaButton imageUrl={media.url} title={title || 'Post media'} />}
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Bring back from Canva
        </Button>
      </div>
      <CanvaImportDialog open={open} onOpenChange={setOpen} allowVideo onImported={attach} />
    </div>
  );
}