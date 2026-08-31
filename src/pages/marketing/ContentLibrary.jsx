import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Library, Plus, Search, Trash2, CheckSquare, Sparkles, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import PostEditorDrawer from '@/components/marketing/PostEditorDrawer';
import { PLATFORMS, POST_STATUSES, platformColor, STATUS_STYLES, formatDate, captureStyleExample } from '@/lib/marketing';

export default function ContentLibrary() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ song: '', campaign: '', platform: '', status: '', from: '', to: '' });
  const [selected, setSelected] = useState({});
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [staleLoading, setStaleLoading] = useState(false);

  // Re-run AI on auto-generated Draft/Pending-Review posts whose song now has real
  // lyrics uploaded, replacing fabricated lyric lines with actual quotes.
  const regenerateStale = async () => {
    setStaleLoading(true);
    try {
      const res = await base44.functions.invoke('regenerateStalePosts', { limit: 40 });
      const r = (res?.data ?? res) || {};
      toast({
        title: `Regenerated ${r.regenerated || 0} post${(r.regenerated || 0) === 1 ? '' : 's'}`,
        description: [
          `${r.eligible || 0} had real lyrics available`,
          r.skipped_no_lyrics ? `${r.skipped_no_lyrics} still have no lyrics` : '',
          r.remaining ? `${r.remaining} remaining — run again` : '',
        ].filter(Boolean).join(' · '),
      });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
    } catch (e) {
      toast({ title: 'Regeneration failed', description: e.message, variant: 'destructive' });
    } finally {
      setStaleLoading(false);
    }
  };

  const { data: posts = [] } = useQuery({ queryKey: ['marketing-posts'], queryFn: () => base44.entities.MarketingPost.list('-created_date') });
  const { data: campaigns = [] } = useQuery({ queryKey: ['marketing-campaigns'], queryFn: () => base44.entities.Campaign.list() });
  const { data: releases = [] } = useQuery({ queryKey: ['releases-admin'], queryFn: () => base44.entities.MusicRelease.list() });

  const releaseTitle = (sid) => releases.find((r) => r.id === sid)?.title || '';
  const campaignName = (cid) => campaigns.find((c) => c.id === cid)?.name || '';

  const filtered = useMemo(() => posts.filter((p) => {
    if (filters.song && p.song_id !== filters.song) return false;
    if (filters.campaign && p.campaign_id !== filters.campaign) return false;
    if (filters.platform && p.platform !== filters.platform) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.from && p.scheduled_date && p.scheduled_date < filters.from) return false;
    if (filters.to && p.scheduled_date && p.scheduled_date > filters.to) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${p.caption} ${p.hashtags} ${p.hook} ${p.cta} ${p.image_prompt}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [posts, filters, search]);

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleAll = () => {
    if (allSelected) setSelected({});
    else setSelected(Object.fromEntries(filtered.map((p) => [p.id, true])));
  };

  const bulkStatus = async (status) => {
    if (selectedIds.length === 0) return;
    const updates = selectedIds.map((id) => ({ id, status }));
    try {
      await base44.entities.MarketingPost.bulkUpdate(updates);
      if (status === 'Ready' || status === 'Posted') {
        const changed = posts.filter((p) => selectedIds.includes(p.id) && p.status !== status && p.original_ai_caption);
        for (const p of changed) await captureStyleExample(p, status, p.caption);
        if (changed.length) qc.invalidateQueries({ queryKey: ['style-examples'] });
      }
      setSelected({});
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: `${selectedIds.length} posts → ${status}` });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} posts?`)) return;
    try {
      await base44.entities.MarketingPost.deleteMany({ id: { $in: selectedIds } });
      setSelected({});
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: `${selectedIds.length} posts deleted` });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const deleteOne = async (post) => {
    if (!confirm(`Delete this ${post.platform} post?`)) return;
    try {
      await base44.entities.MarketingPost.delete(post.id);
      setSelected((s) => ({ ...s, [post.id]: false }));
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: 'Post deleted' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const duplicateSelected = async () => {
    if (selectedIds.length === 0) return;
    const copies = posts.filter((p) => selectedIds.includes(p.id)).map((p) => ({
      platform: p.platform, format: p.format, song_id: p.song_id, campaign_id: p.campaign_id,
      content_bucket: p.content_bucket, publish_targets: p.publish_targets,
      caption: p.caption, hashtags: p.hashtags, hook: p.hook, cta: p.cta,
      image_prompt: p.image_prompt, image_style_preset: p.image_style_preset, video_brief: p.video_brief,
      template_id: p.template_id, slot_values: p.slot_values, clip_asset_id: p.clip_asset_id,
      media_clip_id: p.media_clip_id, media_file_url: p.media_file_url,
      requested_aspect_ratio: p.requested_aspect_ratio,
      status: 'Draft', approval_status: 'Not Reviewed', publish_mode: 'manual',
    }));
    try {
      await base44.entities.MarketingPost.bulkCreate(copies);
      setSelected({});
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: `${copies.length} cop${copies.length === 1 ? 'y' : 'ies'} created as Draft` });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const newPost = async () => {
    setCreating(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const created = await base44.entities.MarketingPost.create({
        platform: 'Instagram', format: 'Feed Post', scheduled_date: today, status: 'Draft',
        caption: '', hashtags: '', hook: '', cta: '', image_prompt: '', video_brief: '',
      });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      setEditing(created);
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Library className="h-4 w-4 text-primary" />
          {filtered.length} post{filtered.length === 1 ? '' : 's'} — search, filter, or work on several at once.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={regenerateStale} disabled={staleLoading} variant="outline" className="gap-2" title="Re-run AI on auto-generated posts now that real lyrics are uploaded">
            {staleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {staleLoading ? 'Regenerating…' : 'Regenerate stale'}
          </Button>
          <Button onClick={newPost} disabled={creating} className="gap-2"><Plus className="h-4 w-4" /> New Post</Button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="glass rounded-2xl p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search caption, hashtags, hook…" className="pl-9" />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          <select value={filters.song} onChange={(e) => setFilters({ ...filters, song: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">All songs</option>
            {releases.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          <select value={filters.campaign} onChange={(e) => setFilters({ ...filters, campaign: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">All campaigns</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.platform} onChange={(e) => setFilters({ ...filters, platform: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">All statuses</option>
            {POST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="h-9 w-full" />
          <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="h-9 w-full" />
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="glass rounded-xl p-2 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground px-2">{selectedIds.length} selected</span>
          <Button variant="outline" size="sm" onClick={duplicateSelected} className="gap-1.5"><Copy className="h-3.5 w-3.5" /> Duplicate</Button>
          {POST_STATUSES.map((s) => (
            <Button key={s} variant="outline" size="sm" onClick={() => bulkStatus(s)}>Set {s}</Button>
          ))}
          <Button variant="ghost" size="sm" onClick={bulkDelete} className="text-destructive hover:text-destructive gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-sm text-muted-foreground">
          <CheckSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          No posts match. Try clearing filters or create a new post.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded" />
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>
          {filtered.map((p) => {
            const pc = platformColor(p.platform);
            return (
              <div key={p.id} className="flex items-start gap-2 glass rounded-xl p-3">
                <input type="checkbox" checked={!!selected[p.id]} onChange={() => toggle(p.id)} className="h-4 w-4 mt-1 rounded" />
                <button onClick={() => setEditing(p)} className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`w-2.5 h-2.5 rounded-full ${pc.dot}`} />
                    <span className="text-sm font-medium">{p.platform} · {p.format}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] || ''}`}>{p.status}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{formatDate(p.scheduled_date)} {p.scheduled_time || ''}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">{p.hook || p.caption?.slice(0, 120) || '(empty)'}</p>
                  {(releaseTitle(p.song_id) || campaignName(p.campaign_id)) && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">{releaseTitle(p.song_id) || '—'} {campaignName(p.campaign_id) ? `· ${campaignName(p.campaign_id)}` : ''}</p>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteOne(p)}
                  aria-label="Delete post"
                  title="Delete this post"
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {editing && <PostEditorDrawer post={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />}
    </div>
  );
}