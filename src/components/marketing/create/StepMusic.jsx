import { useState } from 'react';
import { Search, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { POST_GOALS, effectiveGoal } from '@/lib/createPost';
import { formatDate, STUDIO_SERVICE_ID, STUDIO_SERVICE_ITEM } from '@/lib/marketing';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

function Card({ selected, onClick, image, title, lines, icon: Icon }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`flex min-w-0 items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${selected ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border bg-card/60 hover:border-primary/40'}`}>
      {image ? (<img src={image} alt="" className="h-14 w-14 rounded-lg object-cover bg-muted shrink-0" loading="lazy" />) : (<span className="h-14 w-14 rounded-lg bg-muted grid place-items-center shrink-0"><Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /></span>)}
      <span className="min-w-0"><span className="block text-sm font-medium truncate">{title}</span>{lines.filter(Boolean).map((l, i) => (<span key={i} className="block text-[11px] text-muted-foreground truncate">{l}</span>))}</span>
    </button>
  );
}

export default function StepMusic({ draft, patch, portfolioItems, campaigns }) {
  const [q, setQ] = useState('');
  const campaignFor = (pid) => campaigns.filter((c) => c.portfolio_item_id === pid);
  const term = q.trim().toLowerCase();
  const matches = (text) => !term || String(text || '').toLowerCase().includes(term);
  const rows = portfolioItems.filter((p) => matches(p.title) || matches(p.category) || matches(p.tagline));
  const selected = portfolioItems.find((p) => p.id === draft.portfolioItemId) || null;
  const relevantCampaigns = draft.portfolioItemId ? campaignFor(draft.portfolioItemId) : [];
  const choose = (p) => { const camps = campaignFor(p.id); const active = camps.find((c) => c.status === 'Active') || (camps.length === 1 ? camps[0] : null); patch({ portfolioItemId: p.id, campaignId: active ? active.id : '' }); };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">What are you promoting?</h2>
        <p className="text-sm text-muted-foreground mt-1">Pick a project from your portfolio, or promote your service directly.</p>
      </div>
      <Card icon={LayoutGrid} selected={draft.portfolioItemId === STUDIO_SERVICE_ID} onClick={() => patch({ portfolioItemId: STUDIO_SERVICE_ID, campaignId: '' })} image={null} title={STUDIO_SERVICE_ITEM.title} lines={['Promote your service, share your process, or post a direct offer']} />
      <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your projects" aria-label="Search your projects" className="pl-8" /></div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((p) => (<Card key={p.id} icon={LayoutGrid} selected={draft.portfolioItemId === p.id} onClick={() => choose(p)} image={p.cover_image_url} title={p.title} lines={[p.category, p.date_built ? formatDate(p.date_built) : '', campaignFor(p.id).map((c) => c.name).join(', ')]} />))}
        {!rows.length && (<p className="text-sm text-muted-foreground sm:col-span-2">Nothing matches that search.</p>)}
      </div>
      {relevantCampaigns.length > 1 && (<div className="space-y-1.5"><label className={FL} htmlFor="cp-campaign">Campaign</label><select id="cp-campaign" value={draft.campaignId} onChange={(e) => patch({ campaignId: e.target.value })}><option value="">No campaign</option>{relevantCampaigns.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.status}</option>)}</select></div>)}
      {relevantCampaigns.length === 1 && draft.campaignId && (<p className="text-xs text-muted-foreground">Campaign: {relevantCampaigns[0].name}</p>)}
      {selected && (<p className="text-xs text-muted-foreground">Using your saved details for {selected.title}{selected.description ? ' — description, category and tech included.' : '.'}</p>)}
      <div className="space-y-2">
        <span className={FL} id="cp-goal-label">What should this post accomplish?</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="cp-goal-label">{POST_GOALS.map((g) => (<button key={g} type="button" role="radio" aria-checked={draft.goal === g} onClick={() => patch({ goal: g })} className={`rounded-lg border px-3 py-2 text-sm ${draft.goal === g ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/60 hover:border-primary/40'}`}>{g}</button>))}</div>
        {draft.goal === 'Custom goal' && (<Input value={draft.customGoal} onChange={(e) => patch({ customGoal: e.target.value })} placeholder="Describe the goal in a few words" aria-label="Custom goal" />)}
      </div>
      <div className="space-y-1.5"><label className={FL} htmlFor="cp-instruction">Anything to keep in mind? (optional)</label><Textarea id="cp-instruction" value={draft.instruction} onChange={(e) => patch({ instruction: e.target.value })} rows={2} placeholder='e.g. "Lead with the behind-the-build angle", "Focus on the booking feature", "Do not name the client"' /></div>
      {!effectiveGoal(draft) && (<p className="text-xs text-muted-foreground">Choose a goal to continue.</p>)}
    </div>
  );
}
