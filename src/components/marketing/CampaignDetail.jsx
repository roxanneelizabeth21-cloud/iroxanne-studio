import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Save, Trash2, ChevronDown, ChevronUp, RefreshCw, Music, Megaphone, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import PostEditorDrawer from '@/components/marketing/PostEditorDrawer';
import { PLATFORMS, FORMATS, CAMPAIGN_STATUSES, platformColor, formatDate, daysUntil } from '@/lib/marketing';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

function DraftCard({ draft, index, onChange, onDelete, onRegenerate, regenerating }) {
  const [open, setOpen] = useState(false);
  const pc = platformColor(draft.platform);
  const set = (k, v) => onChange(index, { ...draft, [k]: v });
  return (
    <div className="glass rounded-xl border border-border/50">
      <div className="flex items-center gap-2 p-3">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pc.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{draft.platform} · {draft.format}</p>
          <p className="text-xs text-muted-foreground truncate">{draft.scheduled_date} — {draft.hook || draft.caption?.slice(0, 60)}</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg hover:bg-secondary/50">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
        <button onClick={() => onDelete(index)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"><Trash2 className="h-4 w-4" /></button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/40 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={FL}>Platform</label>
              <select value={draft.platform} onChange={(e) => set('platform', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={FL}>Format</label>
              <select value={draft.format} onChange={(e) => set('format', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={FL}>Date</label><Input type="date" value={draft.scheduled_date} onChange={(e) => set('scheduled_date', e.target.value)} /></div>
            <div><label className={FL}>Time</label><Input type="time" value={draft.scheduled_time || ''} onChange={(e) => set('scheduled_time', e.target.value)} /></div>
          </div>
          <div><label className={FL}>Hook</label><Textarea value={draft.hook} onChange={(e) => set('hook', e.target.value)} rows={2} /></div>
          <div><label className={FL}>Caption</label><Textarea value={draft.caption} onChange={(e) => set('caption', e.target.value)} rows={4} /></div>
          <div><label className={FL}>Hashtags</label><Textarea value={draft.hashtags} onChange={(e) => set('hashtags', e.target.value)} rows={2} /></div>
          <div><label className={FL}>CTA</label><Input value={draft.cta} onChange={(e) => set('cta', e.target.value)} /></div>
          <div><label className={FL}>Image prompt</label><Textarea value={draft.image_prompt} onChange={(e) => set('image_prompt', e.target.value)} rows={3} /></div>
          <div><label className={FL}>Video brief</label><Textarea value={draft.video_brief} onChange={(e) => set('video_brief', e.target.value)} rows={2} /></div>
          <Button type="button" variant="secondary" size="sm" onClick={() => onRegenerate(index)} disabled={regenerating} className="gap-1.5">
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CampaignDetail({ id }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [regenIdx, setRegenIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editCampaign, setEditCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState(null);

  const { data: campaign } = useQuery({ queryKey: ['marketing-campaigns', id], queryFn: () => base44.entities.Campaign.get(id) });
  const { data: releases = [] } = useQuery({ queryKey: ['releases-admin'], queryFn: () => base44.entities.MusicRelease.list('-created_date') });
  const { data: brandProfile } = useQuery({ queryKey: ['brand-profile'], queryFn: () => base44.entities.BrandProfile.list() });
  const presets = (brandProfile && brandProfile[0]?.image_style_presets) || [];
  const { data: posts = [] } = useQuery({ queryKey: ['marketing-posts'], queryFn: () => base44.entities.MarketingPost.list('-created_date') });

  const campaignPosts = posts.filter((p) => p.campaign_id === id);
  const releaseTitle = (sid) => releases.find((r) => r.id === sid)?.title || '—';
  const cForm = campaignForm || (campaign ? {
    name: campaign.name, song_id: campaign.song_id, release_date: campaign.release_date,
    start_date: campaign.start_date, end_date: campaign.end_date, goal: campaign.goal,
    status: campaign.status, notes: campaign.notes, default_image_style_preset: campaign.default_image_style_preset,
  } : null);

  const generate = async () => {
    if (!campaign) return;
    if (!campaign.start_date || !campaign.end_date) return toast({ title: 'Set campaign start & end dates first', variant: 'destructive' });
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateCampaignPlan', {
        song_id: campaign.song_id,
        release_date: campaign.release_date,
        goal: campaign.goal,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        default_image_style_preset: campaign.default_image_style_preset,
      });
      const data = res?.data ?? res;
      const list = data?.posts;
      if (!Array.isArray(list) || list.length === 0) throw new Error('No posts generated');
      setDrafts(list.map((p) => ({ ...p, original_ai_caption: p.caption, campaign_id: id, song_id: campaign.song_id, status: 'Draft' })));
      toast({ title: `${list.length} posts generated — review below` });
    } catch (e) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const updateDraft = (i, next) => setDrafts((d) => d.map((x, idx) => (idx === i ? next : x)));
  const deleteDraft = (i) => setDrafts((d) => d.filter((_, idx) => idx !== i));
  const regenerateDraft = async (i) => {
    setRegenIdx(i);
    try {
      const res = await base44.functions.invoke('regeneratePost', { post: drafts[i], instruction: undefined });
      const np = (res?.data ?? res)?.post;
      if (!np) throw new Error('No post returned');
      setDrafts((d) => d.map((x, idx) => idx === i ? { ...x, caption: np.caption, hashtags: np.hashtags, hook: np.hook, cta: np.cta, image_prompt: np.image_prompt, video_brief: np.video_brief } : x));
      toast({ title: 'Post regenerated' });
    } catch (e) {
      toast({ title: 'Regeneration failed', description: e.message, variant: 'destructive' });
    } finally {
      setRegenIdx(null);
    }
  };

  const saveAll = async () => {
    if (!drafts || drafts.length === 0) return;
    setSaving(true);
    try {
      await base44.entities.MarketingPost.bulkCreate(drafts);
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: `${drafts.length} posts saved` });
      setDrafts(null);
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveCampaign = async () => {
    setSaving(true);
    try {
      await base44.entities.Campaign.update(id, campaignForm);
      qc.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      setEditCampaign(false);
      setCampaignForm(null);
      toast({ title: 'Campaign updated' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!campaign) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const dUntil = daysUntil(campaign.release_date);

  return (
    <div className="space-y-6">
      <Link to="/marketing/campaigns" className="text-sm text-muted-foreground hover:text-foreground">← All campaigns</Link>

      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><Music className="h-3.5 w-3.5" /> {releaseTitle(campaign.song_id)}</p>
            <h1 className="font-display text-2xl font-bold mt-0.5 truncate">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground">{campaign.goal} · {formatDate(campaign.start_date)} → {formatDate(campaign.end_date)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Release: {formatDate(campaign.release_date) || '—'} · {dUntil === null ? '' : dUntil > 0 ? `${dUntil} days to release` : dUntil === 0 ? 'release day' : `${Math.abs(dUntil)} days past`} · {campaignPosts.length} posts
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setCampaignForm(cForm); setEditCampaign(true); }} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
        </div>

        {editCampaign && cForm && (
          <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className={FL}>Name</label><Input value={cForm.name} onChange={(e) => setCampaignForm({ ...cForm, name: e.target.value })} /></div>
              <div><label className={FL}>Release date</label><Input type="date" value={cForm.release_date} onChange={(e) => setCampaignForm({ ...cForm, release_date: e.target.value })} /></div>
              <div><label className={FL}>Status</label><select value={cForm.status} onChange={(e) => setCampaignForm({ ...cForm, status: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">{CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className={FL}>Start date</label><Input type="date" value={cForm.start_date} onChange={(e) => setCampaignForm({ ...cForm, start_date: e.target.value })} /></div>
              <div><label className={FL}>End date</label><Input type="date" value={cForm.end_date} onChange={(e) => setCampaignForm({ ...cForm, end_date: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className={FL}>Notes</label><Textarea value={cForm.notes} onChange={(e) => setCampaignForm({ ...cForm, notes: e.target.value })} rows={2} /></div>
              <div className="sm:col-span-2">
                <label className={FL}>Default image style preset</label>
                <select value={cForm.default_image_style_preset || ''} onChange={(e) => setCampaignForm({ ...cForm, default_image_style_preset: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">None</option>
                  {presets.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveCampaign} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>
              <Button variant="outline" onClick={() => setEditCampaign(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* Generate */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Generate campaign plan</h2>
            <p className="text-sm text-muted-foreground">AI drafts a full content calendar across Facebook, Instagram & YouTube.</p>
          </div>
          <Button onClick={generate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Generating…' : drafts ? 'Regenerate plan' : 'Generate Campaign Plan'}
          </Button>
        </div>
        {generating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Writing posts across the campaign window — this can take 20–40s.
          </div>
        )}
      </div>

      {/* Drafts review */}
      {drafts && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Review drafts ({drafts.length})</h2>
            <Button onClick={saveAll} disabled={saving || drafts.length === 0} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save all posts
            </Button>
          </div>
          {drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">All drafts removed. Regenerate to start over.</p>
          ) : (
            <div className="space-y-2">
              {drafts.map((d, i) => (
                <DraftCard key={i} draft={d} index={i} onChange={updateDraft} onDelete={deleteDraft} onRegenerate={regenerateDraft} regenerating={regenIdx === i} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Saved posts */}
      <section>
        <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-3"><Megaphone className="h-5 w-5 text-primary" /> Saved posts ({campaignPosts.length})</h2>
        {campaignPosts.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">No posts yet. Generate a plan above to get started.</div>
        ) : (
          <div className="space-y-2">
            {campaignPosts.map((p) => {
              const pc = platformColor(p.platform);
              return (
                <button key={p.id} onClick={() => setEditing(p)} className="w-full text-left glass rounded-xl p-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${pc.dot}`} />
                    <p className="text-sm font-medium">{p.platform} · {p.format}</p>
                    <span className="text-xs text-muted-foreground ml-auto">{p.scheduled_date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">{p.hook || p.caption?.slice(0, 80)}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {editing && <PostEditorDrawer post={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />}
    </div>
  );
}