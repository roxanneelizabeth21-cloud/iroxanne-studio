import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download, Loader2 } from 'lucide-react';
import { resolvePostLink } from '@/lib/marketing';
import { getPostMedia } from '@/lib/postMedia';
import { downloadFile } from '@/lib/postShare';
import { displayTime, platformResult, platformError, platformUrl, schedulingTimezone } from '@/lib/postValidation';
import AttachMediaPanel from '@/components/marketing/AttachMediaPanel';
import PublishModeToggle from '@/components/marketing/PublishModeToggle';
import PostWorkflowActions from '@/components/marketing/PostWorkflowActions';
import MediaStatusBadge from '@/components/marketing/MediaStatusBadge';
import PlatformBadges from '@/components/marketing/PlatformBadges';
import FinalReviewDialog from '@/components/marketing/FinalReviewDialog';
import PostShareDialog from '@/components/marketing/PostShareDialog';
import ManualShareDialog from '@/components/marketing/ManualShareDialog';
import MarkPostedManuallyDialog from '@/components/marketing/MarkPostedManuallyDialog';

// Everything the old "Ready to Post" side panel offered — media, approval,
// scheduling, publishing, sharing — rendered inline wherever it's placed, with
// its own review/share dialogs so no parent plumbing is needed.
export default function PostPublishPanel({ post: postProp }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [mode, setMode] = useState('manual');
  const [downloading, setDownloading] = useState(false);
  const [fresh, setFresh] = useState(null);
  const [review, setReview] = useState(null);
  const [sharing, setSharing] = useState(null);
  const [manual, setManual] = useState(null);
  const [markPosted, setMarkPosted] = useState(null);

  useEffect(() => { setFresh(null); }, [postProp?.id]);
  const post = fresh && postProp && fresh.id === postProp.id ? fresh : postProp;
  useEffect(() => { setMode(post?.publish_mode || 'manual'); }, [post?.id, post?.publish_mode]);

  const { data: clips = [] } = useQuery({ queryKey: ['clip-assets'], queryFn: () => base44.entities.ClipAsset.list('-created_date') });
  const { data: releases = [] } = useQuery({ queryKey: ['releases-admin'], queryFn: () => base44.entities.MusicRelease.list() });
  const { data: portfolioItems = [] } = useQuery({ queryKey: ['portfolio-items'], queryFn: () => base44.entities.PortfolioItem.list() });
  const { data: brandProfiles = [] } = useQuery({ queryKey: ['brand-profile'], queryFn: () => base44.entities.BrandProfile.list() });
  const { data: galleryImages = [] } = useQuery({ queryKey: ['gallery-images'], queryFn: () => base44.entities.GalleryImage.list('-created_date', 200) });
  const { data: campaigns = [] } = useQuery({ queryKey: ['marketing-campaigns'], queryFn: () => base44.entities.Campaign.list() });

  if (!post) return null;

  const brandProfile = brandProfiles[0];
  const timezone = schedulingTimezone(brandProfile);
  const media = getPostMedia(post, clips, galleryImages);
  const link = resolvePostLink(post, portfolioItems);
  const portfolioItem = portfolioItems.find((p) => p.id === post.portfolio_item_id) || null;
  const shareUrl = link;
  const canAutoPublish = ['Facebook', 'Instagram'].includes(post.platform);
  const posted = post.status === 'Posted';

  const changeMode = async (m) => {
    const prev = mode;
    setMode(m);
    try {
      await base44.entities.MarketingPost.update(post.id, { publish_mode: m });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: m === 'auto' ? 'Auto-publish on' : 'Auto-publish off' });
    } catch (e) {
      setMode(prev);
      toast({ title: 'Failed to change publish mode', description: e.message, variant: 'destructive' });
    }
  };

  const download = async () => {
    if (!media?.url) return;
    setDownloading(true);
    const ext = media.type === 'video' ? 'mp4' : 'jpg';
    const ok = await downloadFile(media.url, `roxsan-${(post.platform || 'post').toLowerCase()}.${ext}`);
    setDownloading(false);
    if (!ok) toast({ title: 'Download failed', variant: 'destructive' });
  };

  return (
    <div className="space-y-4">
      <AttachMediaPanel
        post={post}
        clips={clips}
        galleryImages={galleryImages}
        campaigns={campaigns}
        releases={releases}
        onAttached={(updated) => setFresh(updated)}
      />
      {media.error && !media.hasMedia && <p className="text-xs text-destructive">{media.error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <MediaStatusBadge post={post} clips={clips} />
        <PlatformBadges post={post} size="lg" />
        <span className="text-xs text-muted-foreground">
          {post.scheduled_date ? `${post.scheduled_date} ${displayTime(post.scheduled_time)}` : 'Unscheduled'}
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

      {canAutoPublish && !posted && <PublishModeToggle value={mode} onChange={changeMode} />}

      <PostWorkflowActions
        post={post}
        clips={clips}
        brandProfile={brandProfile}
        onManual={(platformId) => setManual({ post, platformId })}
        onMarkPosted={() => setMarkPosted({ post })}
        onShare={(p) => setSharing(p)}
        onPublishReview={(p, platforms) => setReview({ post: p, platforms })}
      />

      <Button type="button" variant="outline" onClick={download} disabled={!media?.url || downloading} className="gap-2 w-full">
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download {media?.type === 'video' ? 'Video' : 'Image'}
      </Button>

      {review && (
        <FinalReviewDialog
          post={review.post}
          clips={clips}
          platforms={review.platforms}
          open={!!review}
          onOpenChange={(o) => !o && setReview(null)}
          campaignName={campaigns.find((c) => c.id === review.post.campaign_id)?.name || ''}
          releaseTitle={portfolioItem?.title || ''}
          timezone={timezone}
        />
      )}
      <PostShareDialog
        post={sharing}
        clips={clips}
        open={!!sharing}
        onOpenChange={(o) => !o && setSharing(null)}
        brandProfile={brandProfile}
        shareUrl={shareUrl}
        onManual={(p, platformId) => { setSharing(null); setManual({ post: p, platformId }); }}
      />
      <ManualShareDialog
        post={manual?.post}
        clips={clips}
        brandProfile={brandProfile}
        platformId={manual?.platformId}
        open={!!manual}
        onOpenChange={(o) => !o && setManual(null)}
        shareUrl={shareUrl}
        onMarkPosted={(platformId) => { const p = manual?.post; setManual(null); setMarkPosted({ post: p, platformId }); }}
      />
      <MarkPostedManuallyDialog
        post={markPosted?.post}
        defaultPlatformId={markPosted?.platformId}
        open={!!markPosted}
        onOpenChange={(o) => !o && setMarkPosted(null)}
      />
    </div>
  );
}