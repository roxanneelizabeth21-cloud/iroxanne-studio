import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, Share2, Paperclip, Loader2, Trash2, Palette, ExternalLink, RefreshCw, Type } from 'lucide-react';
import CaptionEditor from '@/components/marketing/CaptionEditor';
import MediaFilingFields from '@/components/marketing/MediaFilingFields';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { urlAttachPatch, clipAttachPatch } from '@/lib/postMedia';

const ROW = 'flex items-start justify-between gap-3 py-2 border-b border-border/40 text-sm';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className={ROW}>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right break-words">{value}</span>
    </div>
  );
}

// Focused detail panel for one media asset: full preview, where it's used, and
// the actions that matter — attach, download, share.
export default function MediaAssetDetail({ asset, open, onOpenChange, posts = [], campaigns = [], releases = [] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [attachTo, setAttachTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sendingToCanva, setSendingToCanva] = useState(false);
  const [canvaUrl, setCanvaUrl] = useState('');
  const [designId, setDesignId] = useState('');
  const [pulling, setPulling] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);

  if (!asset) return null;

  const usedBy = posts.filter((p) => p.media_file_url === asset.url || (asset.kind === 'video' && p.media_clip_id === asset.recordId));
  const attachable = posts.filter((p) => !['Posted', 'Partially Published'].includes(p.status));

  const attach = async () => {
    if (!attachTo) return;
    setBusy(true);
    try {
      const patch = asset.kind === 'video' ? clipAttachPatch({ id: asset.recordId }) : urlAttachPatch(asset.url);
      await base44.entities.MarketingPost.update(attachTo, patch);
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: 'Media attached to the post' });
      setAttachTo('');
    } catch (e) {
      toast({ title: 'Could not attach media', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      const res = await fetch(asset.url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = asset.title || 'media';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(asset.url, '_blank', 'noopener');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: asset.title, url: asset.url });
      else {
        await navigator.clipboard.writeText(asset.url);
        toast({ title: 'Media link copied' });
      }
    } catch { /* user dismissed the share sheet */ }
  };

  // Canva can't edit the stored file in place, so this creates a fresh Canva
  // design made from this image — re-import it when the edits are done.
  // Sending the image takes a few seconds, so the Canva link is shown as a real
  // link the owner taps. Opening a tab automatically after the wait gets blocked
  // by phone browsers and the installed app.
  const editInCanva = async () => {
    setSendingToCanva(true);
    setCanvaUrl('');
    try {
      const res = await base44.functions.invoke('editInCanva', { image_url: asset.url, title: asset.title, gallery_image_id: asset.recordId });
      const url = res?.data?.edit_url;
      if (!url) throw new Error(res?.data?.error || 'Canva did not return a design');
      setCanvaUrl(url);
      setDesignId(res?.data?.design_id || '');
    } catch (e) {
      toast({ title: 'Could not open in Canva', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setSendingToCanva(false);
    }
  };

  // Pulls the edited Canva design back into this same image, so posts already
  // using it pick up the edits instead of a duplicate copy appearing.
  const pullFromCanva = async () => {
    setPulling(true);
    try {
      const res = await base44.functions.invoke('importCanvaDesign', {
        design_id: designId || asset.canva_design_id,
        title: asset.title,
        replace_image_id: asset.recordId,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      qc.invalidateQueries({ queryKey: ['gallery-images'] });
      toast({ title: 'Your Canva edits are in' });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Could not bring the edits back', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setPulling(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      if (asset.kind === 'video') await base44.entities.ClipAsset.delete(asset.recordId);
      else await base44.entities.GalleryImage.delete(asset.recordId);
      qc.invalidateQueries({ queryKey: ['gallery-images'] });
      qc.invalidateQueries({ queryKey: ['clip-assets'] });
      toast({ title: 'Media deleted' });
      setConfirmDelete(false);
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Could not delete media', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const campaignName = campaigns.find((c) => c.id === asset.campaign_id)?.name || '';
  const songTitle = releases.find((r) => r.id === asset.song_id)?.title || '';

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setCanvaUrl(''); setDesignId(''); } onOpenChange(o); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="truncate">{asset.title}</SheetTitle>
          <SheetDescription>{asset.source}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 rounded-xl overflow-hidden bg-muted">
          {asset.kind === 'video' ? (
            <video src={asset.url} controls preload="metadata" className="w-full max-h-[50vh] object-contain bg-black" />
          ) : (
            <img src={asset.url} alt={asset.title} className="w-full max-h-[50vh] object-contain" />
          )}
        </div>

        <div className="mt-4">
          <Row label="Type" value={asset.kind === 'video' ? 'Video' : 'Image'} />
          <Row label="Campaign" value={campaignName} />
          <Row label="Song or release" value={songTitle} />
          <Row label="Format" value={asset.format} />
          <Row label="Composed for" value={asset.aspect_ratio} />
          <Row label="Generated from" value={asset.generation_prompt} />
          <Row label="Used by" value={usedBy.length ? `${usedBy.length} post${usedBy.length === 1 ? '' : 's'}` : 'Not used yet'} />
        </div>

        <MediaFilingFields key={asset.id} asset={asset} releases={releases} />

        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide" htmlFor="attach-post">Attach to post</label>
          <div className="flex gap-2">
            <select id="attach-post" value={attachTo} onChange={(e) => setAttachTo(e.target.value)}>
              <option value="">Select a post…</option>
              {attachable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.scheduled_date || 'Unscheduled'} · {p.platform} · {p.format}
                </option>
              ))}
            </select>
            <Button onClick={attach} disabled={!attachTo || busy} className="gap-1.5 shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />} Attach
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={download} disabled={busy} className="gap-1.5">
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button variant="outline" size="sm" onClick={share} className="gap-1.5">
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCaptionOpen(true)} className="gap-1.5">
            <Type className="h-4 w-4" /> {asset.kind === 'video' ? 'Preview a caption' : 'Add caption'}
          </Button>
          {asset.kind === 'image' && (
            <Button variant="outline" size="sm" onClick={editInCanva} disabled={sendingToCanva} className="gap-1.5">
              {sendingToCanva ? <Loader2 className="h-4 w-4 animate-spin" /> : <Palette className="h-4 w-4" />} Edit in Canva
            </Button>
          )}
          {asset.kind === 'image' && (designId || asset.canva_design_id) && (
            <Button size="sm" onClick={pullFromCanva} disabled={pulling} className="gap-1.5">
              {pulling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Bring Canva edits back
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} disabled={busy} className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>

        {canvaUrl && (
          <div className="mt-3 rounded-xl border-[0.5px] border-border bg-card/60 p-3">
            <p className="text-sm font-medium">Your Canva design is ready</p>
            <p className="text-xs text-muted-foreground mt-1">Edit it in Canva, then import it back here when you are done.</p>
            <a
              href={canvaUrl}
              {...(window.matchMedia('(display-mode: standalone)').matches ? {} : { target: '_blank' })}
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" /> Open in Canva
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 ml-2"
              disabled={pulling}
              onClick={async () => {
                await navigator.clipboard.writeText(canvaUrl);
                toast({ title: 'Canva link copied' });
              }}
            >
              Copy link
            </Button>
          </div>
        )}

        <CaptionEditor asset={asset} open={captionOpen} onOpenChange={setCaptionOpen} />

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this media?</AlertDialogTitle>
              <AlertDialogDescription>
                “{asset.title}” will be removed from your library.
                {usedBy.length ? ` It is attached to ${usedBy.length} post${usedBy.length === 1 ? '' : 's'}, which will lose their media.` : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={remove} disabled={busy}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}