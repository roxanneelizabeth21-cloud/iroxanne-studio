import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Play, Check, Loader2, ImageIcon, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mediaType } from '@/lib/postMedia';

// Visual picker for the Gallery and the Clips library. Selecting a card only
// selects it — attaching is an explicit, clearly labelled action, so a tap that
// lands on a scrolling list can never look like a completed attachment.
export default function MediaLibraryPicker({ source, campaigns = [], portfolioItems = [], busy, onAttach, onCancel }) {
  const isClips = source === 'clips';
  const [q, setQ] = useState('');
  const [campaign, setCampaign] = useState('');
  const [project, setProject] = useState('');
  const [kind, setKind] = useState('');
  const [selected, setSelected] = useState(null);
  const [previewing, setPreviewing] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: isClips ? ['clip-assets'] : ['gallery-images'],
    queryFn: () => (isClips
      ? base44.entities.ClipAsset.list('-created_date')
      : base44.entities.GalleryImage.list('-created_date', 200)),
  });

  const rows = useMemo(() => items
    .map((it) => ({
      raw: it,
      id: it.id,
      url: isClips ? it.file : it.image_url,
      title: it.title || 'Untitled',
      campaignId: it.campaign_id || '',
      projectId: it.portfolio_item_id || '',
      meta: isClips
        ? [it.orientation, it.duration_seconds ? `${it.duration_seconds}s` : null].filter(Boolean).join(' · ')
        : [it.aspect_ratio, it.format].filter(Boolean).join(' · '),
    }))
    .filter((r) => r.url)
    .filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()))
    .filter((r) => !campaign || r.campaignId === campaign)
    .filter((r) => !project || r.projectId === project)
    .filter((r) => !kind || mediaType(r.url) === kind),
  [items, isClips, q, campaign, project, kind]);

  const chosen = rows.find((r) => r.id === selected) || null;

  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-2 space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={isClips ? 'Search clips' : 'Search gallery images'}
          aria-label={isClips ? 'Search clips' : 'Search gallery images'}
          className="pl-8 h-8 text-xs"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {!!campaigns.length && (
          <select value={campaign} onChange={(e) => setCampaign(e.target.value)} aria-label="Filter by campaign">
            <option value="">All campaigns</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {!!portfolioItems.length && (
          <select value={project} onChange={(e) => setProject(e.target.value)} aria-label="Filter by project">
            <option value="">All projects</option>
            {portfolioItems.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        )}
        {isClips && (
          <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by media type">
            <option value="">All media types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Newest first. Tap a card to select it, then attach it.
        {!isClips && ' The Gallery holds still images only — for video, use Choose from Clips.'}
      </p>

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /> Loading…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {rows.map((r) => {
            const isVideo = mediaType(r.url) === 'video';
            const isSelected = selected === r.id;
            return (
              <div
                key={r.id}
                className={`rounded-lg border overflow-hidden bg-card ${isSelected ? 'border-primary ring-2 ring-primary/40' : 'border-border/60'}`}
              >
                <button
                  type="button"
                  onClick={() => setSelected(r.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select ${r.title}`}
                  className="relative block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isVideo ? (
                    <video
                      src={r.url}
                      muted={previewing !== r.id}
                      playsInline
                      preload="metadata"
                      controls={previewing === r.id}
                      className="w-full aspect-square object-cover bg-black"
                    />
                  ) : (
                    <img src={r.url} alt={r.title} loading="lazy" className="w-full aspect-square object-cover bg-muted" />
                  )}
                  {isSelected && (
                    <span className="absolute top-1 right-1 rounded-full bg-primary text-primary-foreground p-1">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                </button>
                <div className="px-1.5 py-1 space-y-0.5">
                  <p className="text-[10px] font-medium truncate" title={r.title}>{r.title}</p>
                  {r.meta && <p className="text-[9px] text-muted-foreground truncate">{r.meta}</p>}
                  {isVideo && previewing !== r.id && (
                    <button
                      type="button"
                      onClick={() => { setSelected(r.id); setPreviewing(r.id); }}
                      className="text-[10px] text-primary inline-flex items-center gap-1"
                    >
                      <Play className="h-2.5 w-2.5" aria-hidden="true" /> Preview
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!rows.length && (
            <p className="col-span-full text-xs text-muted-foreground py-4 text-center">
              {isClips ? 'No clips match this filter.' : 'No gallery images match this filter.'}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => chosen && onAttach(chosen.raw, chosen.url)}
          disabled={!chosen || !!busy}
          className="gap-1.5"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (isClips ? <Clapperboard className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />)}
          {isClips ? 'Attach Selected Clip' : 'Attach Selected Image'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={!!busy}>Cancel</Button>
        {chosen && <span className="text-[11px] text-muted-foreground truncate">Selected: {chosen.title}</span>}
      </div>
    </div>
  );
}