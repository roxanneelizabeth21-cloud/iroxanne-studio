import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Film, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import PageHeading from '@/components/marketing/PageHeading';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import CanvasStepBar from '@/components/marketing/canvas/CanvasStepBar';
import ReelClipPicker from '@/components/marketing/reel/ReelClipPicker';
import ReelDetailsStep from '@/components/marketing/reel/ReelDetailsStep';
import ReelBriefCard from '@/components/marketing/reel/ReelBriefCard';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

const STEPS = [
  { key: 'project', label: 'Project' },
  { key: 'clips', label: 'Clips' },
  { key: 'words', label: 'Words' },
  { key: 'brief', label: 'Brief' },
];

const EMPTY = { hook: '', caption: '', hashtags: '' };

// Create a Reel — plan a vertical short from saved clips. The reel is saved as
// a Reel-format MarketingPost with a shot-list brief, so it lands on the
// calendar and publishes through the same flow as every other post.
export default function CreateReel() {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [projectId, setProjectId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [clipIds, setClipIds] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const goTo = (i) => { setStep(i); setMaxStep((m) => Math.max(m, i)); };

  const { data: projects = [] } = useQuery({ queryKey: ['portfolio-items'], queryFn: () => base44.entities.PortfolioItem.list('-created_date') });
  const { data: allClips = [] } = useQuery({ queryKey: ['clip-assets'], queryFn: () => base44.entities.ClipAsset.list('-created_date') });

  const project = projects.find((r) => r.id === projectId) || null;

  // Clips filed under this project first, then everything else.
  const clips = useMemo(() => {
    const mine = allClips.filter((c) => c.portfolio_item_id === projectId);
    const rest = allClips.filter((c) => c.portfolio_item_id !== projectId);
    return [...mine, ...rest];
  }, [allClips, projectId]);

  const chosenClips = clipIds.map((id) => allClips.find((c) => c.id === id)).filter(Boolean);

  const toggleClip = (id) =>
    setClipIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const brief = useMemo(() => {
    const lines = [`Reel — ${project?.title || 'Untitled'} (vertical 9:16)`];
    if (form.hook) lines.push(`Opening text on screen: ${form.hook}`);
    lines.push('');
    lines.push('Shot list:');
    chosenClips.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.title}${c.duration_seconds ? ` (${c.duration_seconds}s)` : ''}${c.moods?.length ? ` — ${c.moods.join(', ')}` : ''}`);
    });
    lines.push('');
    lines.push('Assemble in CapCut or Canva at 1080x1920, then bring the finished file back into the post.');
    return lines.join('\n');
  }, [project, form, chosenClips]);

  const save = async () => {
    setSaving(true);
    try {
      const created = await base44.entities.MarketingPost.create({
        platform: 'Instagram',
        publish_targets: ['Instagram', 'Facebook'],
        format: 'Reel',
        content_bucket: 'Loop Clip',
        requested_aspect_ratio: '9:16',
        portfolio_item_id: projectId || undefined,
        scheduled_date: scheduledDate || undefined,
        hook: form.hook,
        caption: form.caption,
        hashtags: form.hashtags,
        video_brief: brief,
        media_clip_id: clipIds[0] || undefined,
        status: 'Draft',
        approval_status: 'Not Reviewed',
        publish_mode: 'manual',
      });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      setSaved(created);
      toast({ title: 'Reel saved as a draft' });
    } catch (e) {
      toast({ title: 'Could not save the reel', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="max-w-5xl space-y-4">
        <PageHeading icon={Film} title="Reel saved" subtitle="Your shot list is stored on the post, ready to film and assemble." />
        <div className="glass space-y-3 rounded-2xl p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-accent" /> Saved as a draft reel for {project?.title || 'your project'}.
          </p>
          <ReelBriefCard brief={brief} />
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link to={`/marketing/post/${saved.id}`}>Open the post</Link></Button>
            <Button asChild variant="outline"><Link to="/marketing/calendar">See the calendar</Link></Button>
            <Button
              variant="ghost"
              onClick={() => { setSaved(null); setStep(0); setMaxStep(0); setClipIds([]); setForm(EMPTY); setScheduledDate(''); }}
            >
              Plan another reel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canContinue = step === 0 ? !!projectId : step === 1 ? clipIds.length > 0 : step === 2 ? !!form.caption.trim() : false;

  return (
    <div className="max-w-5xl space-y-4">
      <PageHeading
        icon={Film}
        title="Create a Reel"
        subtitle="Plan a vertical short from your saved clips, step by step."
      />
      <HowThisWorks
        steps={[
          'Step 1 — Project: pick the project the reel is about, and when you want to post it.',
          'Step 2 — Clips: tap your clips in the order they should appear.',
          'Step 3 — Words: add the on-screen hook, the caption, and the hashtags.',
          'Step 4 — Brief: save it as a draft reel with a shot list you can follow while editing.',
        ]}
        note="iRoxanne Studio plans the reel — you assemble the video in CapCut or Canva, then attach the finished file to the post."
      />
      <CanvasStepBar steps={STEPS} step={step} maxStep={maxStep} onGoTo={goTo} label="Reel steps" />

      <div className="glass rounded-2xl p-4 sm:p-5">
        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={FL}>Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project">
                <option value="">Choose a project</option>
                {projects.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={FL}>Post it on (optional)</label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {clipIds.length === 0 ? 'Tap clips in the order they should play.' : `${clipIds.length} clip${clipIds.length === 1 ? '' : 's'} in order.`}
            </p>
            <ReelClipPicker clips={clips} selectedIds={clipIds} onToggle={toggleClip} />
          </div>
        )}

        {step === 2 && <ReelDetailsStep form={form} set={set} />}

        {step === 3 && (
          <div className="space-y-3">
            <ReelBriefCard brief={brief} />
            <Button type="button" onClick={save} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />} Save as a draft reel
            </Button>
          </div>
        )}
      </div>

      {step < 3 && (
        <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-3">
          <Button type="button" variant="ghost" onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button type="button" onClick={() => goTo(step + 1)} disabled={!canContinue} className="gap-1.5">
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}