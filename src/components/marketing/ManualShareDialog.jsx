import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Share2, Copy, Download, ExternalLink, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { copyText } from '@/lib/marketing';
import { downloadFile, supportsFileShare, fetchVideoFile } from '@/lib/postShare';
import { resolveMedia } from '@/lib/postValidation';
import { getPlatform, profileUrl, openProfileUrl } from '@/lib/socialPlatforms';

// Manual share preparation for platforms with NO publishing integration
// (TikTok, YouTube). Nothing here publishes, marks the post Posted, or changes
// any publishing status — it prepares the media and text, then opens the saved
// profile/channel only when the owner chooses that action.
export default function ManualShareDialog({
  post, clips = [], brandProfile, platformId, open, onOpenChange, shareUrl, onMarkPosted,
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState('');

  const cfg = getPlatform(platformId);
  if (!post || !cfg) return null;

  const media = resolveMedia(post, clips);
  const url = profileUrl(brandProfile, cfg.id);
  const text = `${post.caption || ''}${post.hashtags ? `\n\n${post.hashtags}` : ''}`.trim();
  const imageOnlyOnYouTube = cfg.id === 'youtube' && media?.type === 'image';

  const copy = async (value, label) => {
    const ok = await copyText(value);
    toast({ title: ok ? `${label} copied` : `Could not copy ${label.toLowerCase()}`, variant: ok ? undefined : 'destructive' });
  };

  const download = async () => {
    if (!media) return;
    setBusy('download');
    const ok = await downloadFile(media.url, `iroxanne-post.${media.type === 'video' ? 'mp4' : 'jpg'}`);
    setBusy('');
    if (!ok) toast({ title: 'Download failed', variant: 'destructive' });
  };

  const deviceShare = async () => {
    setBusy('share');
    try {
      const payload = { title: post.hook || 'iRoxanne Studio', text, url: shareUrl };
      if (media && navigator.canShare) {
        try {
          const file = await fetchVideoFile(media.url, media.type === 'video' ? 'iroxanne-post.mp4' : 'iroxanne-post.jpg');
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ ...payload, files: [file] });
            toast({ title: 'Opened your device share sheet' });
            return;
          }
        } catch { /* fall through to text/link share */ }
      }
      await navigator.share(payload);
      toast({ title: 'Opened your device share sheet' });
    } catch (e) {
      if (e?.name === 'AbortError') return;
      toast({ title: 'Device sharing unavailable', description: 'Use the download and copy actions instead.', variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const openProfile = () => {
    if (!openProfileUrl(url)) {
      toast({ title: `No ${cfg.label} link saved`, description: 'Add it on the Brand page under Social accounts.', variant: 'destructive' });
      return;
    }
    toast({ title: `Opened ${cfg.label}`, description: 'This post was not published or marked as posted.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <cfg.Icon className="h-4 w-4" aria-hidden="true" /> Prepare for {cfg.label}
          </DialogTitle>
          <DialogDescription>
            {cfg.label} has no publishing connection, so you post it yourself. Download or share the media, copy the text, then open {cfg.id === 'youtube' ? 'your channel' : 'your profile'}. Nothing here publishes the post or marks it as posted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {media ? (
            media.type === 'video'
              ? <video src={media.url} controls playsInline preload="metadata" className="w-full rounded-lg bg-black" />
              : <img src={media.url} alt={post.hook || 'Post media'} className="w-full rounded-lg" />
          ) : (
            <p className="flex items-start gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" /> No graphic or video attached yet.
            </p>
          )}

          {imageOnlyOnYouTube && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This post has a graphic, not a video — it is not a YouTube video upload. You can still download or share the image.
            </p>
          )}

          <dl className="text-xs space-y-1">
            <div><dt className="text-muted-foreground inline">Destination: </dt><dd className="inline">{cfg.label} — manual posting</dd></div>
            <div><dt className="text-muted-foreground inline">Title / hook: </dt><dd className="inline">{post.hook || '—'}</dd></div>
            <div className="break-all"><dt className="text-muted-foreground inline">Campaign link: </dt><dd className="inline">{shareUrl || '—'}</dd></div>
          </dl>
          <div className="text-sm whitespace-pre-wrap">{post.caption || <span className="text-muted-foreground">No caption</span>}</div>
          {post.hashtags && <div className="text-xs text-muted-foreground whitespace-pre-wrap">{post.hashtags}</div>}

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={deviceShare} disabled={!!busy || !supportsFileShare()} className="gap-1.5">
              {busy === 'share' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />} Share Media
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={download} disabled={!media || !!busy} className="gap-1.5">
              {busy === 'download' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {media?.type === 'image' ? 'Download Image' : 'Download Video'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(post.hook || '', 'Title')} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy Title
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(post.caption || '', cfg.id === 'youtube' ? 'Description' : 'Caption')} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> {cfg.id === 'youtube' ? 'Copy Description' : 'Copy Caption'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(post.hashtags || '', 'Hashtags')} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy Hashtags
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(shareUrl || '', 'Campaign link')} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy Link
            </Button>
          </div>

          {!supportsFileShare() && (
            <p className="text-xs text-muted-foreground">
              This browser can't open a device share sheet. Download the media and copy the text instead.
            </p>
          )}

          <Button type="button" onClick={openProfile} disabled={!url} className="w-full gap-2">
            <cfg.Icon className="h-4 w-4" aria-hidden="true" /> {cfg.actionLabel} <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          {!url && (
            <p className="text-xs text-destructive">No {cfg.label} link saved yet. Add it on the Brand page under Social accounts.</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Whether {cfg.label} opens in its app and whether it accepts the media or text depends on your device, browser and installed apps — that part isn't controlled by this app.
          </p>

          <Button type="button" variant="secondary" size="sm" onClick={() => onMarkPosted && onMarkPosted(cfg.id)} className="w-full gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Posted Manually
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}