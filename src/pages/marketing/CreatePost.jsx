import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CanvasStepBar from '@/components/marketing/canvas/CanvasStepBar';
import JadePostPanel from '@/components/agent/JadePostPanel';
import JadeAvatar from '@/components/agent/JadeAvatar';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import StepProject from '@/components/marketing/create/StepProject';
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
import { shareablePageUrl, defaultLinkTarget } from '@/lib/postLink';

// Text fields are debounced so typing doesn't write on every keystroke.
const TEXT_KEYS = ['customGoal', 'instruction', 'platformCaptions'];
const TEXT_DEBOUNCE = 800;

const STEPS = [
  { key: 'subject', label: 'Channels & idea' },
  { key: 'media', label: 'Graphic' },
  { key: 'copy', label: 'Captions' },
  { key: 'review', label: 'Approve & schedule' },
];

// Create Post — one guided flow (Subject → Media → Copy → Review) on top of the
// existing marketing entities, media pickers, Final Review and scheduling.
// A single in-progress MarketingPost is the source of truth and is saved
// continuously; only its ID is remembered locally.
export default function CreatePost() {
  const { id } = useParams();
  return <GuidedPost key={id || 'new'} />;
}

function GuidedPost() {
  const { id: routeId } = useParams();
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

  const { data: portfolioItems = [] } = useQuery({ queryKey: ['portfolio-items'], queryFn: () => base44.entities.PortfolioItem.list('-date_built') });
  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: () => base44.entities.Campaign.list() });
  const { data: clips = [] } = useQuery({ queryKey: ['clip-assets'], queryFn: () => base44.entities.ClipAsset.list('-created_date') });
  const { data: bpList = [] } = useQuery({ queryKey: ['brand-profile'], queryFn: () => base44.entities.BrandProfile.list() });
  const brandProfile = bpList[0] || null;

  // Real screenshots for whichever app this post is about. Jade needs the URLs
  // so she composes from the actual interface instead of inventing a scene.
  // Uploads land in GalleryImage; PortfolioItem.screenshots is the backfill.
  const jadePortfolioId = post?.portfolio_item_id && post.portfolio_item_id !== '__studio_service__'
    ? post.portfolio_item_id
    : null;
  const { data: jadeScreens = [] } = useQuery({
    queryKey: ['post-screenshots', jadePortfolioId],
    enabled: !!jadePortfolioId,
    staleTime: 300000,
    queryFn: async () => {
      const gallery = await base44.entities.GalleryImage
        .filter({ portfolio_item_id: jadePortfolioId }, '-created_date', 40).catch(() => []);
      const rows = (gallery || []).filter((g) => g.image_url)
        .map((g) => ({ title: g.title, image_url: g.image_url }));
      const seen = new Set(rows.map((r) => r.image_url));
      const item = portfolioItems.find((p) => p.id === jadePortfolioId);
      for (const url of item?.screenshots || []) {
        if (url && !seen.has(url)) { rows.push({ title: 'screen', image_url: url }); seen.add(url); }
      }
      return rows;
    },
  });

  // Look for an unfinished draft once, on open.
  useEffect(() => {
    let cancelled = false;
    const id = routeId || loadActiveDraftId();
    if (!id) { setPhase('wizard'); return; }
    base44.entities.MarketingPost.get(id)
      .then((p) => {
        if (cancelled) return;
        if (routeId) { startFrom(p); setStep(3); setMaxStep(3); return; }
        if (isResumableDraft(p)) { setResumable(p); setPhase('resume'); }
        else { clearActiveDraftId(); setPhase('wizard'); }
      })
      .catch(() => { if (!cancelled) { if (routeId) { setPhase('error'); return; } clearActiveDraftId(); setPhase('wizard'); } });
    return () => { cancelled = true; };
  }, [routeId]);

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
      approval_status: 'Draft', publish_mode: 'manual',
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
    const affectsCopy = ['portfolioItemId', 'goal', 'customGoal'].some((k) => k in fields);
    const extra = affectsCopy && String(postRef.current?.caption || '').trim() ? { reviewRecommended: true } : {};
    // Choosing the project attaches its preview-safe share link automatically.
    if ('portfolioItemId' in fields) {
      const item = portfolioItems.find((p) => p.id === fields.portfolioItemId) || null;
      extra.link = item ? shareablePageUrl(item, defaultLinkTarget(item)) : '';
    }
    const next = { ...draftRef.current, ...fields, ...extra };
    const review = { approval_status: 'Pending Review', publish_mode: 'manual' };
    setPostBoth(p => p ? { ...p, ...review } : p);
    draftRef.current = next;
    setDraft(next);
    const debounced = Object.keys(fields).every((k) => TEXT_KEYS.includes(k));
    const send = () => queue({ ...postPatchFromDraft(next, stepRef.current, maxStepRef.current), ...review }, debounced ? TEXT_DEBOUNCE : 0);
    if (!postRef.current?.id && next.portfolioItemId) {
      ensurePost().then(send).catch((e) => toast({ title: 'Could not start the draft', description: e.message, variant: 'destructive' }));
      return;
    }
    send();
  }, [ensurePost, queue, toast, portfolioItems]);

  // Canonical post-field change (media, copy, schedule, approval).
  const patchPost = useCallback(async (fields, deferred, ownerApproval = false) => {
    const contentKeys = ['caption', 'hashtags', 'hook', 'cta', 'media_file_url', 'media_clip_id', 'media_type', 'visual_direction'];
    if (!ownerApproval && contentKeys.some(k => k in fields)) fields = { ...fields, approval_status: 'Pending Review', publish_mode: 'manual' };
    setPostBoth((p) => (p ? { ...p, ...fields } : p));
    if (!Object.keys(fields || {}).length) { if (!await flush()) throw new Error('Your changes could not be saved. Please try again.'); return; }
    if (!postRef.current?.id) await ensurePost();
    queue(fields, deferred ? TEXT_DEBOUNCE : 0);
    if (!deferred && !await flush()) throw new Error('Your changes could not be saved. Please try again.');
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

  const portfolioItem = portfolioItems.find((p) => p.id === draft.portfolioItemId) || null;
  const campaign = campaigns.find((c) => c.id === draft.campaignId) || null;
  const projectTitle = portfolioItem?.title || '';

  const portfolioContext = useMemo(() => ({
    title: projectTitle,
    description: portfolioItem?.description || portfolioItem?.tagline || '',
    tagline: portfolioItem?.tagline || '',
    category: portfolioItem?.category,
    tech: Array.isArray(portfolioItem?.tech_used) ? portfolioItem.tech_used.join(', ') : '',
    project_url: portfolioItem?.project_url,
    cover_image_url: portfolioItem?.cover_image_url,
    campaignName: campaign?.name,
    campaignGoal: campaign?.goal,
    imageStyleNotes: brandProfile?.image_style_notes,
    artworkUrl: portfolioItem?.cover_image_url,
    // compat fields for VisualDirectionPanel
    releaseType: portfolioItem?.category,
    status: 'released',
    themes: Array.isArray(portfolioItem?.tech_used) ? portfolioItem.tech_used.join(', ') : '',
    story: portfolioItem?.description || portfolioItem?.tagline || '',
    genre: brandProfile?.service_description,
  }), [portfolioItem, projectTitle, campaign, brandProfile]);

  const linkOptions = useMemo(() => {
    const out = [];
    if (portfolioItem?.project_url) out.push({ label: 'Live project', url: portfolioItem.project_url });
    const pageLink = shareablePageUrl(portfolioItem, 'Portfolio page');
    if (pageLink) out.push({ label: `${projectTitle || 'Project'} page`, url: pageLink });
    out.push({ label: 'Consult booking', url: shareablePageUrl(portfolioItem, 'Consult booking') });
    String(brandProfile?.default_links || '').split('\n').map((s) => s.trim()).filter(Boolean)
      .forEach((url) => out.push({ label: url, url }));
    const seen = new Set();
    return out.filter((o) => o.url && !seen.has(o.url) && seen.add(o.url));
  }, [portfolioItem, projectTitle, brandProfile]);

  // Step gates.
  const step1Ok = !!draft.portfolioItemId && !!effectiveGoal(draft);
  const step2Ok = !!post && !!resolveMedia(post, clips);
  const step3Ok = !!post && !!String(post.caption || '').trim();
  const canContinue = step === 0 ? step1Ok : step === 1 ? step2Ok : step === 2 ? step3Ok : false;

  const goToStep = useCallback(async (next) => {
    if (['Posted','Partially Published','Publishing'].includes(postRef.current?.status) || postRef.current?.publishing_status === 'Publishing') return;
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

  if (phase === 'error') return <p role="alert">This post could not be loaded. <Link to="/marketing">Return to the planner</Link></p>;

  if (phase === 'loading') {
    return <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Looking for your draft…</p>;
  }

  if (phase === 'resume' && resumable) {
    const rItem = portfolioItems.find((p) => p.id === (resumable.create_post_state?.portfolioItemId || resumable.portfolio_item_id));
    return (
      <ResumeDraftCard
        post={resumable}
        clips={clips}
        projectTitle={rItem?.title || ''}
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
        projectTitle={projectTitle}
        platformIds={draft.platformIds}
        onCreateAnother={() => { setResult(null); startFresh(); }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3">
      <Link to="/marketing" className="inline-block py-2 text-sm underline">← Back to planner</Link>
      {!['Posted', 'Partially Published', 'Publishing'].includes(post?.status) && post?.publishing_status !== 'Publishing' && <CanvasStepBar steps={STEPS} step={step} maxStep={maxStep} onGoTo={goToStep} />}

      {/* Jade, inside the post she is looking at. Collapsed by default so the
          wizard stays the focus, but one click away at every step. */}
      {post?.id && (
        <details className="glass rounded-2xl px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
            <JadeAvatar src={brandProfile?.agent_avatar_url} size={28} />
            Ask Sam about this post
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {jadeScreens.length ? `${jadeScreens.length} real screens on file` : 'no screenshots on file'}
            </span>
          </summary>
          <div className="pt-3">
            <JadePostPanel
              post={post}
              portfolioTitle={projectTitle}
              screenshots={jadeScreens}
              clips={clips}
            />
          </div>
        </details>
      )}

      <div className="min-w-0">
      <div className="mb-2 flex items-center justify-end">
        <SaveStatus status={status} savedAt={savedAt} />
      </div>
      <HowThisWorks
        steps={[
          'Step 1 — Choose your channels and the idea or service you want to share.',
          'Step 2 — Media: attach a picture or clip from your Media Library, or generate one.',
          'Step 3 — Copy: write or generate the caption, hashtags and the link to include.',
          'Step 4 — Review each version, then personally approve and schedule.',
        ]}
        note="Your work saves as you go, so you can leave and pick the draft back up later."
      />

      {step === 0 && (
        <StepProject draft={draft} patch={patch} portfolioItems={portfolioItems} campaigns={campaigns} />
      )}
      {step === 1 && post && (
        <StepMedia
          draft={draft}
          patch={patch}
          post={post}
          patchPost={patchPost}
          clips={clips}
          campaigns={campaigns}
          releases={portfolioItems}
          projectContext={portfolioContext}
        />
      )}
      {step === 2 && post && (
        <StepCopy draft={draft} patch={patch} post={post} patchPost={patchPost} linkOptions={linkOptions} projectTitle={projectTitle} clips={clips} />
      )}
      {step === 3 && post && (
        <StepReview
          draft={draft}
          post={post}
          patchPost={patchPost}
          clips={clips}
          brandProfile={brandProfile}
          campaignName={campaign?.name || ''}
          projectTitle={projectTitle}
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