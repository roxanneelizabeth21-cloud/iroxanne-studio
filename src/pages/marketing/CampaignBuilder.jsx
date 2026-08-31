import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Megaphone, ChevronRight, Briefcase, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import CampaignDetail from '@/components/marketing/CampaignDetail';
import CampaignListControls from '@/components/marketing/CampaignListControls';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import { CAMPAIGN_STATUSES, formatDate, daysUntil } from '@/lib/marketing';

export default function CampaignBuilder() {
  const { id } = useParams();
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', portfolio_item_id: '', release_date: '', start_date: '', end_date: '', goal: 'Launch week push', status: 'Planning', notes: '', default_image_style_preset: '',
  });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: campaigns = [] } = useQuery({ queryKey: ['marketing-campaigns'], queryFn: () => base44.entities.Campaign.list('-created_date') });
  const { data: portfolioItems = [] } = useQuery({ queryKey: ['portfolio-items'], queryFn: () => base44.entities.PortfolioItem.list('-created_date') });
  const { data: brandProfile } = useQuery({ queryKey: ['brand-profile'], queryFn: () => base44.entities.BrandProfile.list() });
  const presets = (brandProfile && brandProfile[0]?.image_style_presets) || [];
  const { data: posts = [] } = useQuery({ queryKey: ['marketing-posts'], queryFn: () => base44.entities.MarketingPost.list() });

  if (id) return <CampaignDetail id={id} />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Pre-fill the name and launch date from the selected portfolio project.
  const onProjectChange = (projectId) => {
    const item = portfolioItems.find((r) => r.id === projectId) || null;
    setForm((f) => ({
      ...f,
      portfolio_item_id: projectId,
      name: f.name ? f.name : (item?.title ? `${item.title} — Launch` : ''),
      release_date: f.release_date ? f.release_date : (item?.date_built || ''),
    }));
  };

  const create = async () => {
    if (!form.name.trim()) return toast({ title: 'Campaign name is required', variant: 'destructive' });
    if (!form.portfolio_item_id) return toast({ title: 'Select a project', variant: 'destructive' });
    setSaving(true);
    try {
      const created = await base44.entities.Campaign.create(form);
      qc.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast({ title: 'Campaign created' });
      navigate(`/marketing/campaigns/${created.id}`);
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const projectTitle = (sid) => portfolioItems.find((r) => r.id === sid)?.title || '—';
  const counts = (cid) => posts.filter((p) => p.campaign_id === cid).length;

  const visible = campaigns.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (query) {
      const hay = `${c.name} ${c.goal || ''} ${projectTitle(c.portfolio_item_id)}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <HowThisWorks
        steps={[
          'Start a campaign with New Campaign, pick the project, and the launch date fills itself in.',
          'Choose the goal so the plan matches the moment — building buzz, launch week, or keeping a project in rotation.',
          'Open a campaign to see its posts and let the strategist fill out the plan.',
          'Search or filter by status to find an older campaign.',
        ]}
        note="Posts made inside a campaign stay linked to it, so performance rolls up per project."
      />

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <CampaignListControls query={query} onQuery={setQuery} status={statusFilter} onStatus={setStatusFilter} />
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* New campaign form — hidden until asked for */}
      {showForm && (
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Campaign name</label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Booking App — Launch Week" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</label>
            <select value={form.portfolio_item_id} onChange={(e) => onProjectChange(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">Select a project…</option>
              {portfolioItems.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Launch date</label>
            <Input type="date" value={form.release_date} onChange={(e) => set('release_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Goal</label>
            <select value={form.goal} onChange={(e) => set('goal', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
              {['Launch buzz', 'Launch week push', 'Evergreen showcase', 'Lead/consult push'].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start date</label>
            <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End date</label>
            <Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Internal notes…" />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Default image style preset (optional)</label>
            <select value={form.default_image_style_preset} onChange={(e) => set('default_image_style_preset', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">None</option>
              {presets.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={create} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Create campaign
          </Button>
          <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
        </div>
      </div>
      )}

      {/* Existing campaigns */}
      <section>
        {visible.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
            {campaigns.length === 0 ? 'No campaigns yet. Use New Campaign to plan your first project launch.' : 'No campaigns match your search.'}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((c) => {
              const d = daysUntil(c.release_date);
              return (
                <Link key={c.id} to={`/marketing/campaigns/${c.id}`} className="block glass rounded-xl p-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-primary shrink-0" /> {projectTitle(c.portfolio_item_id)}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.name} · {c.goal} · {counts(c.id)} posts</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{c.status}</span>
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {d === null ? '' : d > 0 ? `${d}d to launch` : d === 0 ? 'launch day' : `${Math.abs(d)}d past`}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}