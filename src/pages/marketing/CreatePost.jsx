import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CanvasStepBar from '@/components/marketing/canvas/CanvasStepBar';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import StepMusic from '@/components/marketing/create/StepMusic';
import StepMedia from '@/components/marketing/create/StepMedia';
import StepCopy from '@/components/marketing/create/StepCopy';
import StepReview from '@/components/marketing/create/StepReview';
import CreatePostSummary from '@/components/marketing/create/CreatePostSummary';
import ResumeDraftCard from '@/components/marketing/create/ResumeDraftCard';
import SaveStatus from '@/components/marketing/create/SaveStatus';
import useDraftAutosave from '@/lib/useDraftAutosave';
import { registerMarketingBackGuard } from '@/lib/marketingBackNav';
import {
  EMPTY_DRAFT, effectiveGoal, loadActiveDraftId, setActiveDraftId,
  clearActiveDraftId, draftFromPost, postPatchFromDraft, isResumableDraft,
} from '@/lib/createPost';
import { resolveMedia } from '@/lib/postValidation';
import { getPlatform } from '@/lib/socialPlatforms';
import { SITE_URL, shareablePageUrl, defaultLinkTarget } from '@/lib/postLink';

// Text fields are debounced so typing doesn't write on every keystroke.
const TEXT_KEYS = ['customGoal', 'instruction'];
const TEXT_DEBOUNCE = 800;

const STEPS = [
  { key: 'music', label: 'Music' },
  { key: 'media', label: 'Media' },
  { key: 'copy', label: 'Copy' },
  { key: 'review', label: 'Review' },
];

// Create Post — one guided flow (Music → Media → Copy → Review) on top of the
// existing marketing entities, media pickers, Final Review and scheduling.
// A single in-progress MarketingPost is the source of truth and is saved
// continuously; only its ID is remembered locally.
export default function CreatePost() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [phase, setPhase] = useState('loading'); // loading | resume | wizard
  const [resumable, setResumable] = useState(null);
  const [post, setPost] = useState(null);
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT });
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const [result, setResult] = useState(null);

  const postRef = useRef(null);
  const draftRef = useRef(draft);
  const stepRef = useRef(0);
  const maxStepRef = useRef(0);
  const creating = useRef(null);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { maxStepRef.current = maxStep; }, [maxStep]);
  const setPostBoth = (p) => { postRef.current = typeof p === 'function' ? p(postRef.current) : p; setPost(postRef.current); };

  const { status, savedAt, queue, flush, hasUnsaved } = useDraftAutosave(useCallback(() => postRef.current?.id || '', []));

  const { data: releases = [] } = useQuery({ queryKey: ['releases-admin'], queryFn: () => base44.entities.MusicRelease.list() });
  const { data: tracks = [] } = useQuery({ queryKey: ['all-tracks'], queryFn: () => base44.entities.Track.list() });
  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: () => base44.entities.Campaign.list() });
  const { data: songProfiles = [] } = useQuery({ queryKey: ['song-profiles'], queryFn: () => base44.entities.SongProfile.list() });
  const { data: clips = [] } = useQuery({ queryKey: ['clip-assets'], queryFn: () => base44.entities.ClipAsset.list('-created_date') });
  const { data: platformLinks = [] } = useQuery({ queryKey: ['music-platform-links'], queryFn: () => base44.entities.MusicPlatformLink.filter({ is_visible: true }) });
  const { data: bpList = [] } = useQuery({ queryKey: ['brand-profile'], queryFn: () => base44.entities.BrandProfile.list() });
  const brandProfile = bpList[0] || null;

  // Look for an unfinished draft once, on open.
  useEffect(() => {
    let cancelled = false;
    const id = loadActiveDraftId();
    if (!id) { setPhase('wizard'); return; }
    base44.entities.MarketingPost.get(id)
      .then((p) => {
        if (cancelled) return;
        if (isResumableDraft(p)) { setResumable(p); setPhase('resume'); }
        else { clearActiveDraftId(); setPhase('wizard'); }
      })
      .catch(() => { if (!cancelled) { clearActiveDraftId(); setPhase('wizard'); } });
    return () => { cancelled = true; };
  }, []);

  // Save anything still queued before the tab closes; warn only when it matters.
  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsaved() && status !== 'error') return;
      flush();
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [flush, hasUnsaved, status]);

  // The page-level Marketing back arrow saves the draft before leaving.
  useEffect(() => registerMarketingBackGuard(async () => {
    if (!postRef.current?.id || result) return { ok: true };
    const ok = await flush();
    return ok ? { ok: true, message: 'Draft saved' } : { ok: false };
  }), [flush, result]);

  const ensurePost = useCallback(async () => {
    if (postRef.current?.id) return postRef.current;
    if (creating.current) return creating.current;
    creating.current = base44.entities.MarketingPost.create({
      ...postPatchFromDraft(draftRef.current, stepRef.current, maxStepRef.current),
      status: 'Draft',
      approval_status: 'Not Reviewed',
    }).then((created) => {
      postRef.current = created;
      setPost(created);
      setActiveDraftId(created.id);
      creating.current = null;
      flush(); // anything queued before the record existed
      return created;
    }).catch((e) => { creating.current = null; throw e; });
    return creating.current;
  }, [flush]);

  // Wizard-state change: saved immediately, or debounced while typing.
  const patch = useCallback((fields) => {
    // Editing an earlier answer never deletes later work — it only flags it.
    const affectsCopy = ['releaseId', 'trackId', 'goal', 'customGoal'].some((k) => k in fields);
    const extra = affectsCopy && String(postRef.current?.caption || '').trim() ? { reviewRecommended: true } : {};
    // Choosing the music attaches that release's own preview-safe share link
    // automatically — never a hardcoded URL, and never a manual step.
    if ('releaseId' in fields) {
      const rel = releases.find((r) => r.id === fields.releaseId) || null;
      extra.link = rel ? shareablePageUrl(rel, defaultLinkTarget(rel)) : '';
    }
    const next = { ...draftRef.current, ...fields, ...extra };
    draftRef.current = next;
    setDraft(next);
    const debounced = Object.keys(fields).every((k) => TEXT_KEYS.includes(k));
    const send = () => queue(postPatchFromDraft(next, stepRef.current, maxStepRef.current), debounced ? TEXT_DEBOUNCE : 0);
    if (!postRef.current?.id && (next.releaseId || next.trackId)) {
      ensurePost().then(send).catch((e) => toast({ title: 'Could not start the draft', description: e.message, variant: 'destructive' }));
      return;
    }
    send();
  }, [ensurePost, queue, toast, releases]);

  // Canonical post-field change (media, copy, schedule, approval).
  const patchPost = useCallback(async (fields, deferred) => {
    setPostBoth((p) => (p ? { ...p, ...fields } : p));
    if (!Object.keys(fields || {}).length) { await flush(); return; }
    if (!postRef.current?.id) await ensurePost();
    queue(fields, deferred ? TEXT_DEBOUNCE : 0);
    if (!deferred) await flush();
    qc.invalidateQueries({ queryKey: ['marketing-posts'] });
  }, [ensurePost, flush, queue, qc]);

  const startFrom = (p) => {
    postRef.current = p;
    setPost(p);
    const d = draftFromPost(p);
    draftRef.current = d;
    setDraft(d);
    const s = Math.min(Number(p.create_post_step) || 0, 3);
    setStep(s);
    setMaxStep(Math.max(Number(p.create_post_state?.maxStep) || 0, s));
    setActiveDraftId(p.id);
    setPhase('wizard');
  };

  const startFresh = () => {
    clearActiveDraftId();
    postRef.current = null;
    setPost(null);
    draftRef.current = { ...EMPTY_DRAFT };
    setDraft({ ...EMPTY_DRAFT });
    setStep(0);
    setMaxStep(0);
    setResumable(null);
    setPhase('wizard');
  };

  const discardResumable = async () => {
    try {
      await base44.entities.MarketingPost.delete(resumable.id);
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: 'Draft discarded' });
    } catch (e) {
      toast({ title: 'Could not discard the draft', description: e.message, variant: 'destructive' });
    }
    startFresh();
  };

  const release = releases.find((r) => r.id === draft.releaseId) || null;
  const track = tracks.find((t) => t.id === draft.trackId) || null;
  const campaign = campaigns.find((c) => c.id === draft.campaignId) || null;
  const songTitle = track?.title || release?.title || '';
  const profile = songProfiles.find((s) => s.title === (track?.title || release?.title)) || null;

  const songContext = {
    title: songTitle,
    releaseType: release?.release_type,
    status: release?.status,
    themes: (profile?.themes || []).join(', '),
    story: profile?.song_story || release?.behind_the_scenes,
    keyLines: profile?.key_lines || (track?.lyrics || '').slice(0, 400),
    genre: brandProfile?.genre_blend,
    campaignName: campaign?.name,
    campaignGoal: campaign?.goal,
    imageStyleNotes: brandProfile?.image_style_notes,
    artworkUrl: release?.cover_image_url,
  };

  const linkOptions = useMemo(() => {
    const out = [];
    for (const l of platformLinks) {
      if (release && l.release_id === release.id && l.url) {
        out.push({ label: `${String(l.platform_type || 'Streaming').replace(/_/g, ' ')} link`, url: l.url });
      }
    }
    for (const src of [profile?.streaming_links, brandProfile?.default_streaming_links]) {
      String(src || '').split('\n').map((s) => s.trim()).filter(Boolean).forEach((url) => out.push({ label: url, url }));
    }
    if (release?.slug) {
      out.unshift({
        label: `${release.title} page (previews with cover art)`,
        url: shareablePageUrl(release, defaultLinkTarget(release)),
      });
    }
    out.push({ label: 'Music page', url: `${SITE_URL}/music` });
    out.push({ label: 'Store page', url: `${SITE_URL}/shop` });
    const seen = new Set();
    return out.filter((o) => o.url && !seen.has(o.url) && seen.add(o.url));
  }, [platformLinks, release, profile, brandProfile]);

  // Step gates.
  const step1Ok = !!(draft.releaseId || draft.trackId) && !!effectiveGoal(draft);
  const step2Ok = !!post && !!resolveMedia(post, clips);
  const step3Ok = !!post && !!String(post.caption || '').trim();
  const canContinue = step === 0 ? step1Ok : step === 1 ? step2Ok : step === 2 ? step3Ok : false;

  const goToStep = useCallback(async (next) => {
    setStep(next);
    stepRef.current = next;
    const highest = Math.max(maxStepRef.current, next);
    setMaxStep(highest);
    maxStepRef.current = highest;
    queue(postPatchFromDraft(draftRef.current, next, highest), 0);
    await flush();
  }, [flush, queue]);

  const goNext = async () => {
    if (!canContinue) return;
    setAdvancing(true);
    try {
      await ensurePost();
      await goToStep(step + 1);
    } catch (e) {
      toast({ title: 'Could not continue', description: e.message, variant: 'destructive' });
    } finally {
      setAdvancing(false);
    }
  };

  const goBack = () => goToStep(Math.max(0, step - 1));

  const finish = (res) => {
    setResult(res);
    clearActiveDraftId();
  };

  const platformLabels = (p) => (p?.create_post_state?.platformIds || [])
    .map((id) => getPlatform(id)?.label).filter(Boolean).join(' + ');

  if (phase === 'loading') {
    return <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Looking for your draft…</p>;
  }

  if (phase === 'resume' && resumable) {
    const rTrack = tracks.find((t) => t.id === resumable.create_post_state?.trackId);
    const rRelease = releases.find((r) => r.id === (resumable.create_post_state?.releaseId || resumable.song_id));
    return (
      <ResumeDraftCard
        post={resumable}
        clips={clips}
        songTitle={rTrack?.title || rRelease?.title || ''}
        platformLabels={platformLabels(resumable) || resumable.platform}
        onContinue={() => startFrom(resumable)}
        onStartNew={startFresh}
        onDiscard={discardResumable}
      />
    );
  }

  if (result && post) {
    return (
      <CreatePostSummary
        result={result}
        post={post}
        clips={clips}
        songTitle={songTitle}
        platformIds={draft.platformIds}
        onCreateAnother={() => { setResult(null); startFresh(); }}
      />
    );
  }

  return (
    <div className="max-w-5xl space-y-3">
      <CanvasStepBar steps={STEPS} step={step} maxStep={maxStep} onGoTo={goToStep} />

      <div className="min-w-0">
      <div className="mb-2 flex items-center justify-end">
        <SaveStatus status={status} savedAt={savedAt} />
      </div>
      <HowThisWorks
        steps={[
          'Step 1 — Music: pick the album or song this post is about and what the post should accomplish.',
          'Step 2 — Media: attach a picture or clip from your Media Library, or generate one.',
          'Step 3 — Copy: write or generate the caption, hashtags and the link to include.',
          'Step 4 — Review: check everything, then schedule it or publish it now.',
        ]}
        note="Your work saves as you go, so you can leave and pick the draft back up later."
      />

      {step === 0 && (
        <StepMusic draft={draft} patch={patch} releases={releases} tracks={tracks} campaigns={campaigns} songProfiles={songProfiles} />
      )}
      {step === 1 && post && (
        <StepMedia
          draft={draft}
          patch={patch}
          post={post}
          patchPost={patchPost}
          clips={clips}
          campaigns={campaigns}
          releases={releases}
          songContext={songContext}
        />
      )}
      {step === 2 && post && (
        <StepCopy draft={draft} patch={patch} post={post} patchPost={patchPost} linkOptions={linkOptions} songTitle={songTitle} clips={clips} />
      )}
      {step === 3 && post && (
        <StepReview
          draft={draft}
          post={post}
          patchPost={patchPost}
          clips={clips}
          brandProfile={brandProfile}
          campaignName={campaign?.name || ''}
          songTitle={songTitle}
          onDone={finish}
          onEdit={() => goToStep(2)}
        />
      )}

      {step < 3 && (
        <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-2 border-t border-border/40 bg-background/90 backdrop-blur py-3">
          <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button type="button" onClick={goNext} disabled={!canContinue || advancing} className="gap-1.5">
            {advancing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continue <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}