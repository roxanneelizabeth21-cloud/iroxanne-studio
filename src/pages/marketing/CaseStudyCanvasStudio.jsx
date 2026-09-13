import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Loader2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CanvasStepBar from '@/components/marketing/canvas/CanvasStepBar';
import CanvaImportDialog from '@/components/marketing/CanvaImportDialog';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import CanvasStepRelease from '@/components/marketing/canvas/CanvasStepRelease';
import CanvasStepDesign from '@/components/marketing/canvas/CanvasStepDesign';
import CanvasStepSave from '@/components/marketing/canvas/CanvasStepSave';
import AlbumCanvasCard from '@/components/marketing/AlbumCanvasCard';
import useCanvasPreview from '@/hooks/useCanvasPreview';
import { useDominantColor } from '@/hooks/useDominantColor';
import { drawProjectCanvas } from '@/lib/drawProjectCanvas';
import { recordCanvasVideo } from '@/lib/recordCanvasVideo';
import { getCanvasPreset } from '@/lib/canvasPresets';
import { paletteFromCover } from '@/lib/canvasPalette';

const CANVAS_STEPS = [
  { key: 'project', label: 'Project' },
  { key: 'design', label: 'Design' },
  { key: 'save', label: 'Save' },
];

const EMPTY_DESIGN = { color: '', ctaPreset: 'See the build', customCta: '', subtext: '', services: ['Base44'] };

// Case Study Canvas — the same guided shell as Create a Post
// (Project → Design → Save), on top of the existing canvas renderer.
// Cards are built from a PortfolioItem's screenshot/cover image.
export default function AlbumCanvasStudio() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [projectId, setProjectId] = useState('');
  const [design, setDesign] = useState({ ...EMPTY_DESIGN });
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: allItems = [] } = useQuery({
    queryKey: ['portfolio-items'],
    queryFn: () => base44.entities.PortfolioItem.list('-date_built'),
  });
  const { data: canvases = [], isLoading } = useQuery({
    queryKey: ['case-study-canvases'],
    queryFn: () => base44.entities.CaseStudyCanvas.list('-created_date'),
  });

  // Map portfolio items into the release-like shape the canvas renderer expects.
  const projects = useMemo(
    () => allItems
      .filter((r) => r.cover_image_url)
      .map((r) => ({
        id: r.id,
        title: r.title,
        cover_image_url: r.cover_image_url,
        studio_name: 'iRoxanne Studio',
        release_type: r.category,
        status: 'released',
        release_date: r.date_built,
      })),
    [allItems]
  );
  const project = projects.find((r) => r.id === projectId) || null;
  const { dominant } = useDominantColor(project?.cover_image_url);
  const { data: palette = [] } = useQuery({
    queryKey: ['canvas-palette', project?.cover_image_url],
    queryFn: () => paletteFromCover(project.cover_image_url),
    enabled: !!project?.cover_image_url,
  });
  const color = design.color || palette[0] || dominant || '#8a8580';
  const cta = design.ctaPreset === 'Custom' ? design.customCta : design.ctaPreset;
  const preset = getCanvasPreset('promo_portrait');
  const { preview, rendering } = useCanvasPreview({ project, color, preset, cta, subtext: design.subtext, services: design.services });

  const patch = (fields) => setDesign((d) => ({ ...d, ...fields }));

  const goToStep = (next) => {
    setStep(next);
    setMaxStep((m) => Math.max(m, next));
  };

  const canContinue = step === 0 ? !!projectId : step === 1 ? !!preview : false;

  const save = async () => {
    setSaving(true);
    try {
      const canvas = await drawProjectCanvas({
        coverUrl: project.cover_image_url,
        title: project.title,
        studioName: project.studio_name || 'iRoxanne Studio',
        color, ratio: preset.ratio, width: preset.w, height: preset.h, safeBottom: preset.safeBottom,
        cta, subtext: design.subtext, services: design.services,
      });
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const file = new File([blob], `canvas-${preset.id}-${preset.w}x${preset.h}.png`, { type: 'image/png' });
      const up = await base44.integrations.Core.UploadFile({ file });

      // Second format: a short silent slow-zoom video of the same card.
      let videoUrl = '';
      let videoFormat = '';
      const video = await recordCanvasVideo(canvas).catch(() => null);
      if (video) {
        const videoFile = new File([video.blob], `canvas-${preset.id}-${preset.w}x${preset.h}.${video.ext}`, { type: video.blob.type });
        const videoUp = await base44.integrations.Core.UploadFile({ file: videoFile });
        videoUrl = videoUp?.file_url || videoUp?.data?.file_url || '';
        videoFormat = video.ext;
      }

      await base44.entities.CaseStudyCanvas.create({
        title: `${project.title} — ${preset.label}`,
        portfolio_item_id: project.id,
        project_title: project.title,
        image_url: up?.file_url || up?.data?.file_url,
        aspect_ratio: preset.ratio,
        target_platform: preset.label,
        pixel_size: `${preset.w}x${preset.h}`,
        matched_color: color,
        cta,
        subtext: design.subtext,
        services: design.services,
        video_url: videoUrl,
        video_format: videoFormat,
      });
      toast({ title: videoUrl ? `Canvas saved as PNG + ${videoFormat.toUpperCase()}` : 'Canvas saved' });
      qc.invalidateQueries({ queryKey: ['case-study-canvases'] });
      setStep(0);
      setMaxStep(0);
      setProjectId('');
      setDesign({ ...EMPTY_DESIGN });
    } catch (e) {
      toast({ title: 'Could not save the canvas', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Editing always starts a copy: the saved card is left untouched and saving
  // creates a new one.
  const duplicate = (canvas) => {
    setProjectId(canvas.portfolio_item_id || '');
    setDesign({
      color: canvas.matched_color || '',
      ctaPreset: 'Custom',
      customCta: canvas.cta || '',
      subtext: canvas.subtext || '',
      services: canvas.services?.length ? canvas.services : ['Base44'],
    });
    setMaxStep(2);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ title: 'Editing a copy', description: 'Saving creates a new canvas — the original stays as it is.' });
  };

  const remove = async (canvas) => {
    await base44.entities.CaseStudyCanvas.delete(canvas.id);
    qc.invalidateQueries({ queryKey: ['case-study-canvases'] });
  };

  return (
    <div className="space-y-8">
      <div className="max-w-5xl">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <CanvasStepBar steps={CANVAS_STEPS} step={step} maxStep={maxStep} onGoTo={goToStep} />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5 shrink-0">
            <Palette className="h-4 w-4" /> Bring back from Canva
          </Button>
        </div>

        <div className="min-w-0">
          <HowThisWorks
            steps={[
              'Step 1 — Project: pick the portfolio project whose screenshot the card is built from.',
              'Step 2 — Design: the card is the portrait shape at 1080×1920. Pick the background colour from the swatches pulled out of your screenshot, add the second line, and choose which tech marks show.',
              'Step 3 — Save: check the card and save it to your canvases.',
              'Optional — send a saved canvas to Canva, add your motion there, then use “Bring back from Canva” to pull the finished video into your clips.',
            ]}
            note="Colours are matched to your project screenshot automatically, so every card stays on brand."
          />

          {step === 0 && (
            <CanvasStepRelease releases={projects} releaseId={projectId} onPick={setProjectId} />
          )}
          {step === 1 && (
            <CanvasStepDesign design={design} patch={patch} preset={preset} palette={palette} color={color} preview={preview} rendering={rendering} />
          )}
          {step === 2 && (
            <CanvasStepSave
              release={project}
              design={design}
              preset={preset}
              cta={cta}
              preview={preview}
              rendering={rendering}
              saving={saving}
              onSave={save}
            />
          )}

          {step < 2 && (
            <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-2 border-t border-border/40 bg-background/90 backdrop-blur py-3">
              <Button type="button" variant="ghost" onClick={() => goToStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={() => canContinue && goToStep(step + 1)} disabled={!canContinue} className="gap-1.5">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Saved canvases</h2>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : canvases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No canvases yet — build your first one above.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
            {canvases.map((c) => (
              <div key={c.id} className="w-52 shrink-0 snap-start">
                <AlbumCanvasCard canvas={c} onDelete={remove} onDuplicate={duplicate} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CanvaImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        allowVideo
        onImported={() => {
          setImportOpen(false);
          qc.invalidateQueries({ queryKey: ['clip-assets'] });
          qc.invalidateQueries({ queryKey: ['gallery-images'] });
        }}
      />
    </div>
  );
}