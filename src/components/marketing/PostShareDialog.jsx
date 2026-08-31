import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Share2, Copy, Download, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { copyText } from '@/lib/marketing';
import { downloadFile, supportsFileShare, fetchVideoFile } from '@/lib/postShare';
import { resolveMedia, canShare, DRAFT_SHARE_WARNING } from '@/lib/postValidation';
import { SOCIAL_PLATFORMS, profileUrl, openProfileUrl } from '@/lib/socialPlatforms';

// Regular Share — device/browser sharing only. It never publishes, never touches
// Instagram/Facebook publish status, and never calls publishPostToSocial.
export default function PostShareDialog({ post, clips = [], brandProfile, open, onOpenChange, shareUrl, shareText, onManual }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState('');

  if (!post) return null;
  const media = resolveMedia(post, clips);
  const gate = canShare(post, clips);
  const isDraft = ['Draft', 'Pending Review'].includes(post.status);
  const text = shareText || `${post.caption || ''}${post.hashtags ? `\n\n${post.hashtags}` : ''}`.trim();

  const nativeShare = async () => {
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
        } catch { /* fall through to text/url share */ }
      }
      await navigator.share(payload);
      toast({ title: 'Opened your device share sheet' });
    } catch (e) {
      if (e?.name === 'AbortError') return;
      toast({ title: 'Native sharing unavailable', description: 'Use the copy and download actions below.', variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this post</DialogTitle>
          <DialogDescription>
            Sharing sends the media, caption and link through your device. It does not publish the post or mark it as published.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!gate.ok && (
            <p className="flex items-start gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" /> {gate.reason}
            </p>
          )}
          {gate.ok && isDraft && (
            <p className="flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" /> {DRAFT_SHARE_WARNING}
            </p>
          )}

          <Button type="button" onClick={nativeShare} disabled={!gate.ok || !!busy || !supportsFileShare()} className="w-full gap-2">
            {busy === 'share' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            {supportsFileShare() ? 'Open device share sheet' : 'Device sharing unavailable here'}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => copy(post.caption || '', 'Caption')} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy Caption
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(shareUrl || '', 'Link')} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy Campaign Link
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(`${text}\n\n${shareUrl || ''}`.trim(), 'Share text')} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy Share Text
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={download} disabled={!media || !!busy} className="gap-1.5">
              {busy === 'download' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download Media
            </Button>
            {media && (
              <Button type="button" variant="ghost" size="sm" asChild className="col-span-2 gap-1.5">
                <a href={media.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Open Media</a>
              </Button>
            )}
          </div>

          <div className="space-y-1.5 pt-1 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open your profiles</p>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_PLATFORMS.map((p) => {
                const url = profileUrl(brandProfile, p.id);
                if (!url) return null;
                const manual = !p.canPublish;
                return (
                  <Button
                    key={p.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 justify-start"
                    title={manual ? p.tooltip : `Open your ${p.label} page`}
                    onClick={() => (manual && onManual ? onManual(post, p.id) : openProfileUrl(url))}
                  >
                    <p.Icon className="h-3.5 w-3.5" aria-hidden="true" /> {p.profileLabel}
                  </Button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Which apps your device offers in the share sheet is decided by your device, not by this app. Sharing never marks this post as published.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}