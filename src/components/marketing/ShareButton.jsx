import { useState } from 'react';
import { Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { copyText } from '@/lib/marketing';
import { canShareVideoFile, facebookShareUrl, downloadFile, nativeShareVideo } from '@/lib/postShare';

// Device-aware Share button. No social APIs — uses the native Web Share sheet
// with the video file on mobile when supported, and falls back to
// download-video + copy-caption + (Facebook only) open sharer.php on desktop.
export default function ShareButton({ platform, media, caption, postUrl, hook }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const mediaUrl = media && media.url;
  const isVideo = media && media.type === 'video';

  const handle = async () => {
    setBusy(true);
    try {
      // Mobile + video + native file share → native share sheet.
      if (isVideo && mediaUrl && canShareVideoFile()) {
        try {
          await nativeShareVideo(mediaUrl, 'iroxanne-post.mp4', caption, hook || caption);
          toast({ title: 'Opened share sheet' });
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') return; // user cancelled
          // otherwise fall through to the download + copy fallback
        }
      }

      const copied = await copyText(caption);
      const downloaded = isVideo && mediaUrl ? await downloadFile(mediaUrl, 'iroxanne-post.mp4') : false;

      if (platform === 'Facebook') {
        window.open(facebookShareUrl(postUrl, caption), '_blank', 'noopener,noreferrer');
        toast({
          title: downloaded ? 'Video downloaded, caption copied' : (copied ? 'Caption copied' : 'Ready'),
          description: 'Paste into the Facebook post that just opened.',
        });
      } else {
        // Instagram / YouTube have no working web share → download + copy + helper.
        toast({
          title: downloaded ? 'Video downloaded, caption copied' : (copied ? 'Caption copied' : 'Ready'),
          description: `Open ${platform} and paste.`,
        });
      }
    } catch (e) {
      toast({ title: 'Share failed', description: (e && e.message) || 'Try the Download button instead.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" onClick={handle} disabled={busy} className="gap-2">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
      Share to {platform}
    </Button>
  );
}