import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Megaphone, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import CanvasStepBar from '@/components/marketing/canvas/CanvasStepBar';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import SlideBuilder from '@/components/marketing/ads/SlideBuilder';
import SlideList from '@/components/marketing/ads/SlideList';
import AdSettingsPanel from '@/components/marketing/ads/AdSettingsPanel';
import LaunchedAdsList from '@/components/marketing/ads/LaunchedAdsList';
import { STUDIO_SERVICE_ID, STUDIO_SERVICE_ITEM } from '@/lib/marketing';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

const STEPS = [
  { key: 'track', label: 'Project' },
  { key: 'slides', label: 'Slides' },
  { key: 'audience', label: 'Budget' },
  { key: 'launch', label: 'Launch' },
];

const DEFAULTS = {
  ad_account_id: '',
  primary_text: '',
  destination_url: '',
  cta_type: 'LEARN_MORE',
  daily_budget_usd: 10,
  countries: 'US',
  age_min: 18,
  age_max: 65,
};

export default function CarouselAds() {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [slides, setSlides] = useState([]);
  const [form, setForm] = useState(DEFAULTS);
  const [launching, setLaunching] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const goTo = (i) => { setStep(i); setMaxStep((m) => Math.max(m, i)); };

  const { data: setup, isLoading: loadingSetup } = useQuery({
    queryKey: ['meta-ads-setup'],
    queryFn: async () => (await base44.functions.invoke('metaAdsAccounts', {})).data,
  });
  const { data: portfolioItems = [] } = useQuery({
    queryKey: ['portfolio-items'],
    queryFn: () => base44.entities.PortfolioItem.list('-sort_order'),
  });

  const project = useMemo(() => portfolioItems.find((r) => r.id === projectId) || null, [portfolioItems, projectId]);

  const chooseProject = (id) => {
    const item = portfolioItems.find((r) => r.id === id);
    setProjectId(id);
    if (item) {
      setName((n) => n || `${item.title} — Carousel`);
      set('destination_url', item.project_url || (item.slug ? `https://iroxanne.com/portfolio/${item.slug}` : ''));
    }
  };

  const launch = async (activate) => {
    setLaunching(true);
    const res = await base44.functions.invoke('launchCarouselAd', {
      name,
      portfolio_item_id: projectId,
      project_title: project?.title || '',
      ad_account_id: form.ad_account_id,
      page_id: setup?.page?.id || '',
      primary_text: form.primary_text,
      destination_url: form.destination_url,
      cta_type: form.cta_type,
      daily_budget_usd: Number(form.daily_budget_usd),
      countries: String(form.countries).split(',').map((c) => c.trim().toUpperCase()).filter(Boolean),
      age_min: Number(form.age_min),
      age_max: Number(form.age_max),
      slides,
      activate,
    }).catch((e) => ({ data: { ok: false, error: e.message } }));
    setLaunching(false);

    if (res?.data?.ok) {
      toast({ title: 'Carousel ad created', description: res.data.message });
      setSlides([]);
      qc.invalidateQueries({ queryKey: ['carousel-ads'] });
    } else {
      toast({ title: 'Meta rejected the ad', description: res?.data?.error || 'Launching failed.', variant: 'destructive' });
    }
  };

  if (loadingSetup) {
    return <p className="text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Loading your ad accounts…</p>;
  }

  if (!setup?.ok) {
    return (
      <div className="glass rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <p className="text-sm">{setup?.error || 'Meta Ads is not available right now.'}</p>
      </div>
    );
  }

  const canLaunch = !launching && slides.length >= 2 && !!form.ad_account_id && !!name && !!form.destination_url;
  const canContinue = step === 0 ? !!projectId && !!name : step === 1 ? slides.length >= 2 : step === 2 ? !!form.ad_account_id : false;

  return (
    <div className="max-w-5xl space-y-4">
      <HowThisWorks
        steps={[
          'Step 1 — Project: choose the portfolio project the ad is about and name the ad.',
          'Step 2 — Slides: add two to ten images from your library, the project screenshots, or generate them.',
          'Step 3 — Budget: pick the ad account, daily budget, countries and age range.',
          'Step 4 — Launch: create it paused to check it in Meta first, or set it live right away.',
        ]}
        note="Nothing spends money until the ad is live in Meta."
      />
      <CanvasStepBar steps={STEPS} step={step} maxStep={maxStep} onGoTo={goTo} label="Carousel ad steps" />

      {step === 0 && (
        <div className="glass rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={FL}>Project</label>
              <select value={projectId} onChange={(e) => chooseProject(e.target.value)} aria-label="Project">
                <option value="">Choose a project</option>
                <option value={STUDIO_SERVICE_ID}>{STUDIO_SERVICE_ITEM.title}</option>
                {portfolioItems.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={FL}>Ad name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name — Carousel" />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="glass rounded-2xl p-4 sm:p-5 space-y-4">
          <SlideBuilder project={project} portfolioItems={portfolioItems} onAdd={(added) => setSlides((s) => [...s, ...added].slice(0, 10))} />
          <SlideList slides={slides} onChange={setSlides} />
        </div>
      )}

      {step === 2 && (
        <div className="glass rounded-2xl p-4 sm:p-5">
          <AdSettingsPanel form={form} set={set} accounts={setup.accounts || []} page={setup.page} />
        </div>
      )}

      {step === 3 && (
        <div className="glass rounded-2xl p-4 sm:p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            This spends real money once it's live. Create it paused, check it in Ads Manager, then set it live there — or launch it live now if you're sure.
          </p>
          <p className="text-sm">
            <span className="font-medium">{name || 'Untitled ad'}</span> · {slides.length} slides · ${Number(form.daily_budget_usd) || 0}/day · {String(form.countries || 'US')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => launch(false)} disabled={!canLaunch} className="gap-1.5">
              {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />} Create paused ad
            </Button>
            <Button type="button" variant="outline" onClick={() => launch(true)} disabled={!canLaunch}>
              Create and set live
            </Button>
          </div>
          {slides.length < 2 && <p className="text-xs text-muted-foreground">Add at least 2 slides first.</p>}
        </div>
      )}

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

      {step === 3 && <LaunchedAdsList />}
    </div>
  );
}