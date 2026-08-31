import { useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supportsFileShare, fetchVideoFile, downloadFile } from '@/lib/postShare';

// Small overlay button on a clip card: opens the device share sheet with the
// clip file, falling back to a download on desktop browsers without file share.
export default function ClipShareButton({ clip, isVideo }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const share = async (e) => {
    e.stopPropagation();
    if (!clip.file) return;
    setBusy(true);
    const ext = isVideo ? 'mp4' : 'jpg';
    const filename = `${(clip.title || 'clip').replace(/[^\w-]+/g, '-').toLowerCase()}.${ext}`;
    try {
      if (supportsFileShare()) {
        const file = await fetchVideoFile(clip.file, filename);
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: clip.title });
          return;
        }
      }
      const ok = await downloadFile(clip.file, filename);
      if (ok) toast({ title: 'Clip downloaded', description: 'Share it from your device.' });
      else toast({ title: 'Share failed', variant: 'destructive' });
    } catch (err) {
      if (err?.name !== 'AbortError') toast({ title: 'Share failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={share}
      disabled={busy}
      aria-label={`Share ${clip.title}`}
      className="absolute top-1 right-8 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
    </button>
  );
}