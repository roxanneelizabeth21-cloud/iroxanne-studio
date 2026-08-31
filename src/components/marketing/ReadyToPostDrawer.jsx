import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Check, Download, Pencil, CheckCircle2, Loader2 } from 'lucide-react';
import { copyText, platformColor, resolveStreamLink } from '@/lib/marketing';
import { getPostMedia } from '@/lib/postMedia';
import { downloadFile } from '@/lib/postShare';
import CopyEverythingButton from '@/components/marketing/CopyEverythingButton';
import PublishModeToggle from '@/components/marketing/PublishModeToggle';
import AttachMediaPanel from '@/components/marketing/AttachMediaPanel';
import PostWorkflowActions from '@/components/marketing/PostWorkflowActions';
import MediaStatusBadge from '@/components/marketing/MediaStatusBadge';
import PlatformBadges from '@/components/marketing/PlatformBadges';
import { hasValidMedia, isLocked, displayTime, platformResult, platformError, platformUrl } from '@/lib/postValidation';

function CopyBtn({ label, getText }) {
  const [done, setDone] = useState(false);
  const handle = async () => {
    const ok = await copyText(getText());
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={handle} className="gap-1.5">
      {done ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? 'Copied' : label}
    </Button>
  );
}

// ReadyToPostDrawer — the "Ready to Post" panel shown when the admin taps a
// calendar chip. Hands the admin everything they need to post manually:
// playable media, caption + hashtags with copy buttons, a combined Copy
// Everything, a per-platform Share button, a Download button, and Mark as Posted.
export default function ReadyToPostDrawer({ post: postProp, open, onOpenChange, onEdit, onShare, onMove, onPublishReview, onManual, onMarkPosted }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mode, setMode] = useState('manual');
  // Freshest copy of this post: media actions hand back the re-read record, so
  // the drawer never renders a stale MarketingPost.
  const [fresh, setFresh] = useState(null);
  useEffect(() => { setFresh(null); }, [postProp?.id]);
  const post = fresh && postProp && fresh.id === postProp.id ? fresh : postProp;
  useEffect(() => { setMode(post?.publish_mode || 'manual'); }, [post?.id, post?.publish_mode]);
  // Facebook and Instagram are the platforms with a connected publish connector.
  const canAutoPublish = ['Facebook', 'Instagram'].includes(post?.platform);

  const { data: clips = [] } = useQuery({ queryKey: ['clip-assets'], queryFn: () => base44.entities.ClipAsset.list('-created_date') });
  const { data: releases = [] } = useQuery({ queryKey: ['releases-admin'], queryFn: () => base44.entities.MusicRelease.list() });
  const { data: platformLinks = [] } = useQuery({ queryKey: ['music-platform-links'], queryFn: () => base44.entities.MusicPlatformLink.filter({ is_visible: true }) });
  const { data: allTracks = [] } = useQuery({ queryKey: ['all-tracks'], queryFn: () => base44.entities.Track.list() });
  const { data: songProfiles = [] } = useQuery({ queryKey: ['song-profiles'], queryFn: () => base44.entities.SongProfile.list() });
  const { data: brandProfile } = useQuery({ queryKey: ['brand-profile'], queryFn: () => base44.entities.BrandProfile.list() });
  const { data: galleryImages = [] } = useQuery({ queryKey: ['gallery-images'], queryFn: () => base44.entities.GalleryImage.list('-created_date', 200) });
  const { data: campaigns = [] } = useQuery({ queryKey: ['marketing-campaigns'], queryFn: () => base44.entities.Campaign.list() });

  if (!post) return null;

  const media = getPostMedia(post, clips, galleryImages);
  const pc = platformColor(post.platform);
  const link = resolveStreamLink(post, releases, platformLinks, allTracks, songProfiles, brandProfile && brandProfile[0]);
  const release = releases.find((r) => r.id === post.song_id);
  const shareUrl = release && release.slug
    ? `${window.location.origin}/release/${release.slug}`
    : `${window.location.origin}/music`;
  const posted = isLocked(post);
  const combinedCaption = `${post.caption || ''}${post.hashtags ? '\n\n' + post.hashtags : ''}${link ? '\n\n' + link : ''}`;

  const markPosted = async () => {
    setSaving(true);
    try {
      await base44.entities.MarketingPost.update(post.id, { status: 'Posted', posted_at: new Date().toISOString() });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: 'Marked as posted' });
      onOpenChange && onOpenChange(false);
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const changeMode = async (m) => {
    const prev = mode;
    setMode(m);
    try {
      await base44.entities.MarketingPost.update(post.id, { publish_mode: m });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: m === 'auto' ? 'Auto-publish on' : 'Auto-publish off', description: m === 'auto' ? 'This post will publish itself at its scheduled time.' : 'You’ll publish this one manually.' });
    } catch (e) {
      setMode(prev);
      toast({ title: 'Failed to change publish mode', description: e.message, variant: 'destructive' });
    }
  };

  const download = async () => {
    if (!media || !media.url) return;
    setDownloading(true);
    const ext = media.type === 'video' ? 'mp4' : 'jpg';
    const ok = await downloadFile(media.url, `roxsan-${(post.platform || 'post').toLowerCase()}.${ext}`);
    setDownloading(false);
    if (!ok) toast({ title: 'Download failed', variant: 'destructive' });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${pc.dot}`} />
            Ready to Post · {post.platform}
          </SheetTitle>
          <SheetDescription>
            {post.format} · {post.scheduled_date || 'No date'} {post.scheduled_time || ''}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Media preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Media</label>
            <AttachMediaPanel
              post={post}
              clips={clips}
              galleryImages={galleryImages}
              campaigns={campaigns}
              releases={releases}
              onAttached={(updated) => setFresh(updated)}
            />
            {media.error && !media.hasMedia && (
              <p className="text-xs text-destructive">{media.error}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <MediaStatusBadge post={post} clips={clips} />
              <PlatformBadges post={post} size="lg" />
              <span className="text-xs text-muted-foreground">
                {post.scheduled_date ? `${post.scheduled_date} ${displayTime(post.scheduled_time)} ${post.scheduled_timezone || ''}` : 'Unscheduled'}
              </span>
            </div>
            {['Instagram', 'Facebook'].filter((p) => platformResult(post, p) !== 'Not Selected').map((p) => (
              <p key={p} className="text-xs">
                <span className="text-muted-foreground">{p}: </span>
                {platformResult(post, p)}
                {platformUrl(post, p) ? ` · ${platformUrl(post, p)}` : ''}
                {platformError(post, p) ? <span className="text-destructive"> · {platformError(post, p)}</span> : null}
              </p>
            ))}
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Caption</label>
              <CopyBtn label="Caption" getText={() => post.caption || ''} />
            </div>
            <Textarea value={post.caption || ''} readOnly rows={5} />
          </div>

          {/* Hashtags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hashtags</label>
              <CopyBtn label="Hashtags" getText={() => post.hashtags || ''} />
            </div>
            <Textarea value={post.hashtags || ''} readOnly rows={2} />
          </div>

          {/* Publish mode */}
          {canAutoPublish && !posted && (
            <PublishModeToggle value={mode} onChange={changeMode} />
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <PostWorkflowActions
              post={post}
              clips={clips}
              brandProfile={brandProfile && brandProfile[0]}
              onManual={(platformId) => { onOpenChange && onOpenChange(false); onManual && onManual(post, platformId); }}
              onMarkPosted={() => { onOpenChange && onOpenChange(false); onMarkPosted && onMarkPosted(post); }}
              onEdit={(p) => onEdit && onEdit(p)}
              onShare={(p) => { onShare ? onShare(p) : onEdit && onEdit(p); }}
              onMove={(p) => onMove && onMove(p)}
              onPublishReview={(p, platforms) => { onOpenChange && onOpenChange(false); onPublishReview && onPublishReview(p, platforms); }}
            />
            <CopyEverythingButton post={post} link={link} className="w-full" />
            <Button type="button" variant="outline" onClick={download} disabled={!media || !media.url || downloading} className="gap-2">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download {media && media.type === 'video' ? 'Video' : 'Image'}
            </Button>
            {!posted && (
              <Button type="button" variant="secondary" onClick={markPosted} disabled={saving || !hasValidMedia(post, clips)} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Mark as Posted
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onEdit && onEdit(post)} className="gap-2">
              <Pencil className="h-4 w-4" /> Edit details
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}