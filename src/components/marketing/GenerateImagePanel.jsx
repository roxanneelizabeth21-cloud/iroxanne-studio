import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Wand2, RefreshCw, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Generates an image from the post's image prompt and attaches it to the post
// immediately, so pressing Save on the post keeps it. `attachedUrl` is the
// post's currently attached image so a reopened post still shows it here.
export default function GenerateImagePanel({ prompt, attachedUrl, onUseForPost }) {
  const { toast } = useToast();
  const [preview, setPreview] = useState(attachedUrl || '');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  // Keep in sync when a different post is opened or the attachment changes elsewhere.
  useEffect(() => { setPreview(attachedUrl || ''); }, [attachedUrl]);

  const generate = async () => {
    if (!prompt?.trim()) {
      toast({ title: 'Add an image prompt first', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      const url = res?.url || res?.data?.url;
      if (!url) throw new Error('No image returned');
      setPreview(url);
      onUseForPost(url);
      toast({ title: 'Image attached to this post', description: 'Press Save to keep it.' });
    } catch (e) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const saveToClips = async () => {
    setSaving(true);
    try {
      await base44.entities.ClipAsset.create({
        title: prompt.trim().slice(0, 60),
        file: preview,
        source_type: 'Stock',
        orientation: 'Square',
        notes: `AI generated from prompt: ${prompt.trim()}`,
      });
      toast({ title: 'Saved to your Clips library' });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setPreview('');
    onUseForPost('');
    toast({ title: 'Image removed — press Save to confirm' });
  };

  const isImage = preview && !/\.(mp4|mov|m4v|webm|ogg)(\?|#|$)/i.test(preview);

  return (
    <div className="rounded-xl border border-border/60 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI image</span>
        <Button type="button" size="sm" variant="secondary" onClick={generate} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          {busy ? 'Generating…' : preview ? 'Regenerate' : 'Generate image'}
        </Button>
      </div>

      {!preview && !busy && (
        <p className="text-[11px] text-muted-foreground">Generates an image from the prompt above and attaches it to this post. Press Save on the post to keep it.</p>
      )}

      {isImage && (
        <div className="space-y-2">
          <img src={preview} alt="Attached post image" className="w-full rounded-lg border border-border/60" />
          <p className="text-[11px] text-muted-foreground">Attached to this post — press Save to keep it.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={saveToClips} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save to Clips
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={generate} disabled={busy} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={discard} className="gap-1.5 text-destructive hover:text-destructive">
              <X className="h-3.5 w-3.5" /> Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}