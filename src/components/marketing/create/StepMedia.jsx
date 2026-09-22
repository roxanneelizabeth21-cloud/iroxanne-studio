import StoryClipMaker from './StoryClipMaker';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon, Clapperboard, Upload, Wand2, Loader2, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import MediaLibraryPicker from '@/components/marketing/MediaLibraryPicker';
import VisualDirectionPanel from './VisualDirectionPanel';
import CanvaRoundTrip from './CanvaRoundTrip';
import { clipAttachPatch, urlAttachPatch, mediaType, REMOVE_MEDIA_PATCH } from '@/lib/postMedia';
import { resolveMedia } from '@/lib/postValidation';
import { ASPECT_OPTIONS, formatForAspect } from '@/lib/createPost';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

const OPTIONS = [
  { key: 'gallery', label: 'Choose from Media Library', Icon: ImageIcon },
  { key: 'clips', label: 'Choose from Clips', Icon: Clapperboard },
  { key: 'upload', label: 'Upload Media', Icon: Upload },
  { key: 'generate', label: 'Generate Image', Icon: Wand2 },
];

// Step 2 — one real, previewable image or video attached to the in-progress post.
export default function StepMedia({ draft, patch, post, patchPost, clips, campaigns, releases, projectContext }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [panel, setPanel] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const media = resolveMedia(post, clips);

  const attachUrl = async (url, alsoPatch = {}) => {
    setBusy(true);
    try {
      await patchPost({ ...urlAttachPatch(url), requested_aspect_ratio: draft.aspect, ...alsoPatch });
      setPanel('');
    } finally {
      setBusy(false);
    }
  };

  // A generated image is filed in the Clips library as well, then that clip is
  // what gets attached to the post — so it is saved and attached in one step.
  const attachGenerated = async (url) => {
    setBusy(true);
    try {
      await base44.entities.ClipAsset.create({
        title: `${projectContext?.title || 'Marketing image'}`.slice(0, 60),
        file: url,
        source_type: 'Stock',
        media_category: 'Promo',
        orientation: draft.aspect === '9:16' ? 'Vertical 9:16' : draft.aspect === '1:1' ? 'Square' : 'Horizontal',
        portfolio_item_id: draft.portfolioItemId || '',
        notes: 'Created in Create a Post',
      });
      await patchPost({ ...urlAttachPatch(url), requested_aspect_ratio: draft.aspect });
      qc.invalidateQueries({ queryKey: ['clip-assets'] });
      setPanel('');
      toast({ title: 'Saved to your Clips and attached to this post' });
    } catch (e) {
      toast({ title: 'Could not attach the generated image', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const attachFromPicker = async (raw, url) => {
    setBusy(true);
    try {
      if (panel === 'clips') await patchPost({ ...clipAttachPatch(raw), requested_aspect_ratio: draft.aspect });
      else await patchPost({ ...urlAttachPatch(url), requested_aspect_ratio: draft.aspect });
      setPanel('');
      toast({ title: 'Media selected' });
    } catch (e) {
      toast({ title: 'Could not attach that media', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      const url = res?.file_url || res?.data?.file_url;
      if (!url) throw new Error('No file URL was returned');
      const kind = mediaType(url);
      if (kind === 'video') {
        const clip = await base44.entities.ClipAsset.create({
          title: file.name.replace(/\.[^.]+$/, '').slice(0, 60),
          file: url,
          source_type: 'My Footage',
          orientation: draft.aspect === '9:16' ? 'Vertical 9:16' : draft.aspect === '1:1' ? 'Square' : 'Horizontal',
          portfolio_item_id: draft.portfolioItemId || '',
        });
        await patchPost({ ...clipAttachPatch(clip), requested_aspect_ratio: draft.aspect });
      } else {
        await base44.entities.GalleryImage.create({
          title: file.name.replace(/\.[^.]+$/, '').slice(0, 60),
          image_url: url,
          category: 'promo',
          source: 'upload',
          portfolio_item_id: draft.portfolioItemId || '',
          campaign_id: draft.campaignId || '',
          aspect_ratio: draft.aspect,
        });
        await patchPost({ ...urlAttachPatch(url), requested_aspect_ratio: draft.aspect });
      }
      setPanel('');
      toast({ title: 'Media uploaded and attached' });
    } catch (e) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async () => {
    setBusy(true);
    try { await patchPost({ ...REMOVE_MEDIA_PATCH }); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">Choose your media</h2>
        <p className="text-sm text-muted-foreground mt-1">Pick something you already have, upload a file, or generate a new image.</p>
      </div>

      <div className="space-y-2">
        <span className={FL} id="cp-ratio-label">Content format</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="cp-ratio-label">
          {ASPECT_OPTIONS.map((a) => (
            <button
              key={a.value}
              type="button"
              role="radio"
              aria-checked={draft.aspect === a.value}
              onClick={() => { patch({ aspect: a.value }); patchPost({ requested_aspect_ratio: a.value, format: formatForAspect(a.value) }); }}
              className={`rounded-lg border px-3 py-2 text-sm ${draft.aspect === a.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/60 hover:border-primary/40'}`}
            >
              {a.label} <span className="opacity-70">{a.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {media?.type === 'image' && <StoryClipMaker post={post} media={media} onAttach={async url => {
        await attachUrl(url, { format: 'Reel', requested_aspect_ratio: '9:16', media_type: 'video' });
        patch({ aspect: '9:16', savedFormat: 'Reel' });
      }} />}
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setPanel(panel === o.key ? '' : o.key)}
            aria-expanded={panel === o.key}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-sm font-medium ${panel === o.key ? 'border-primary bg-primary/5' : 'border-border bg-card/60 hover:border-primary/40'}`}
          >
            <o.Icon className="h-4 w-4 text-primary" aria-hidden="true" /> {o.label}
          </button>
        ))}
      </div>

      {(panel === 'gallery' || panel === 'clips') && (
        <MediaLibraryPicker
          source={panel === 'clips' ? 'clips' : 'gallery'}
          campaigns={campaigns}
          releases={releases}
          busy={busy}
          onAttach={attachFromPicker}
          onCancel={() => setPanel('')}
        />
      )}

      {panel === 'upload' && (
        <div className="rounded-xl border border-border/60 p-3 space-y-2">
          <label className={FL} htmlFor="cp-upload">Image or video file</label>
          <input
            id="cp-upload"
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => upload(e.target.files?.[0])}
            disabled={busy}
            className="block w-full text-sm"
          />
          {busy && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</p>}
        </div>
      )}

      {panel === 'generate' && (
        <VisualDirectionPanel
          draft={draft}
          post={post}
          projectContext={projectContext}
          aspect={draft.aspect}
          onAttached={(url) => attachGenerated(url)}
        />
      )}

      {media ? (
        <div className="space-y-2" aria-live="polite">
          <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Media selected
          </p>
          {media.type === 'video'
            ? <video src={media.url} controls playsInline preload="metadata" className="w-full max-w-sm rounded-xl bg-black" />
            : <img src={media.url} alt="Selected post media" className="w-full max-w-sm rounded-xl border border-border/60" />}
          <p className="text-xs text-muted-foreground">
            Composition prepared for {draft.aspect}. Final crop may still be needed.
          </p>
          <CanvaRoundTrip media={media} title={projectContext?.title} aspect={draft.aspect} patchPost={patchPost} />
          <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={busy} className="gap-1.5 text-destructive hover:text-destructive">
            <X className="h-3.5 w-3.5" /> Remove media
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nothing attached yet. An image idea on its own isn't media — pick, upload or generate a real file to continue.</p>
      )}
    </div>
  );
}