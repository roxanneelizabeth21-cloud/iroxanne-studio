import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wand2, Image as ImageIcon, Clapperboard, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getPostMedia, clipAttachPatch, urlAttachPatch, REMOVE_MEDIA_PATCH } from '@/lib/postMedia';
import MediaLibraryPicker from '@/components/marketing/MediaLibraryPicker';
import AttachedMediaPreview from '@/components/marketing/AttachedMediaPreview';

// Owns the whole media section of a post: the persistent preview of attached
// media, and the Generate / Gallery / Clips / Upload actions when there is none.
// Every attach writes the canonical MarketingPost fields, re-reads the saved
// record before reporting success, and pushes the fresh record back up so the
// drawer and the calendar card update without a refresh. Removing media never
// deletes the underlying GalleryImage or ClipAsset.
export default function AttachMediaPanel({ post, clips = [], galleryImages = [], campaigns = [], releases = [], onAttached }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState('');
  const [picker, setPicker] = useState('');

  const { data: clipList = clips } = useQuery({
    queryKey: ['clip-assets'],
    queryFn: () => base44.entities.ClipAsset.list('-created_date'),
    initialData: clips.length ? clips : undefined,
  });

  const media = getPostMedia(post, clipList, galleryImages);

  const refresh = async (title) => {
    const fresh = await base44.entities.MarketingPost.get(post.id);
    qc.invalidateQueries({ queryKey: ['marketing-posts'] });
    qc.invalidateQueries({ queryKey: ['gallery-images'] });
    qc.invalidateQueries({ queryKey: ['clip-assets'] });
    setPicker('');
    onAttached && onAttached(fresh);
    if (title) toast({ title });
    return fresh;
  };

  // Write a media patch, verify the saved record actually holds it, then report.
  const save = async (patch, expect, title, busyKey = 'attach') => {
    setBusy(busyKey);
    try {
      await base44.entities.MarketingPost.update(post.id, patch);
      const fresh = await refresh(null);
      const saved = expect(fresh);
      if (!saved) throw new Error('The post was updated but the media did not save.');
      toast({ title });
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      toast({ title: 'Could not attach media', description: msg, variant: 'destructive', duration: 6000 });
      await refresh(null); // restore the UI to the real stored state
    } finally {
      setBusy('');
    }
  };

  const attachClip = (clip) => save(
    clipAttachPatch(clip),
    (p) => p.media_clip_id === clip.id,
    'Video attached to post.',
  );

  const attachGalleryImage = (image) => save(
    urlAttachPatch(image.image_url),
    (p) => p.media_file_url === image.image_url,
    'Graphic attached to post.',
  );

  const upload = async (file) => {
    if (!file) return;
    setBusy('upload');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error('The upload did not return a file URL.');
      await base44.entities.MarketingPost.update(post.id, urlAttachPatch(file_url));
      const fresh = await refresh(null);
      if (fresh.media_file_url !== file_url) throw new Error('The upload finished but the post did not save the file.');
      toast({ title: String(file.type || '').startsWith('video') ? 'Video attached to post.' : 'Graphic attached to post.' });
    } catch (e) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive', duration: 6000 });
      await refresh(null);
    } finally {
      setBusy('');
    }
  };

  const generate = async () => {
    const prompt = String(post.image_prompt || post.hook || post.caption || '').trim();
    if (!prompt) {
      toast({ title: 'Add an image prompt first', description: 'The Media tab of the post editor has the image prompt field.', variant: 'destructive' });
      return;
    }
    setBusy('generate');
    try {
      const ratio = post.requested_aspect_ratio || (['Reel', 'Story', 'Short'].includes(post.format) ? '9:16' : '4:5');
      const res = await base44.functions.invoke('generateMarketingImage', {
        post_id: post.id, prompt, aspect_ratio: ratio, original_request: 'Attached from the Content Calendar',
      });
      const url = res?.data?.image_url;
      if (!url) throw new Error(res?.data?.error || 'No image returned');
      await base44.entities.MarketingPost.update(post.id, { ...urlAttachPatch(url), requested_aspect_ratio: ratio, needs_crop: true, crop_status: 'needs_crop' });
      const fresh = await refresh(null);
      if (!fresh.media_file_url) throw new Error('The image generated but the post did not save it.');
      toast({ title: 'Graphic attached to post.' });
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      toast({ title: 'Generation failed', description: msg, variant: 'destructive', duration: 6000 });
      await refresh(null);
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    setBusy('remove');
    try {
      await base44.entities.MarketingPost.update(post.id, REMOVE_MEDIA_PATCH);
      await refresh('Media removed. The Gallery image or clip is untouched.');
    } catch (e) {
      toast({ title: 'Could not remove media', description: e.message, variant: 'destructive' });
      await refresh(null);
    } finally {
      setBusy('');
    }
  };

  // Attached media: persistent preview, with Change / Remove.
  if (media.hasMedia && !picker) {
    return (
      <AttachedMediaPreview
        media={media}
        post={post}
        onChange={() => setPicker(media.mediaType === 'video' ? 'clips' : 'gallery')}
        onRemove={remove}
        removing={busy === 'remove'}
      />
    );
  }

  return (
    <div className={`rounded-xl border border-dashed p-3 space-y-3 ${media.hasMedia ? 'border-border bg-muted/20' : 'border-destructive/40 bg-destructive/5'}`}>
      {media.error && (
        <p className="text-sm text-destructive">Media failed to load: {media.error}</p>
      )}
      {!media.hasMedia && !media.error && (
        <p className="text-sm text-foreground">
          This post needs a graphic or video before it can be approved, scheduled, shared, or published.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={generate} disabled={!!busy} className="gap-1.5">
          {busy === 'generate' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Generate Image
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setPicker(picker === 'gallery' ? '' : 'gallery')} disabled={!!busy} className="gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" /> Choose from Gallery
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setPicker(picker === 'clips' ? '' : 'clips')} disabled={!!busy} className="gap-1.5">
          <Clapperboard className="h-3.5 w-3.5" /> Choose from Clips
        </Button>
        <label className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-input bg-background text-xs font-medium cursor-pointer hover:bg-accent">
          {busy === 'upload' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload Media
          <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => upload(e.target.files && e.target.files[0])} />
        </label>
      </div>

      {!!picker && (
        <MediaLibraryPicker
          source={picker}
          campaigns={campaigns}
          releases={releases}
          busy={busy === 'attach'}
          onAttach={(raw) => (picker === 'clips' ? attachClip(raw) : attachGalleryImage(raw))}
          onCancel={() => setPicker('')}
        />
      )}
    </div>
  );
}