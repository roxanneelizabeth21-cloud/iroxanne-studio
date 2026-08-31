import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MediaUploader from './MediaUploader';
import SnippetEditor from './SnippetEditor';
import TrackManager from './TrackManager';
import { useToast } from '@/components/ui/use-toast';
import { THEME_PRESET_OPTIONS } from '@/lib/releaseThemes';

const normTitle = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

const STATUS_OPTIONS = [
  { value: 'released', label: 'Released' },
  { value: 'upcoming', label: 'Upcoming / Pre-release' },
];

function slugify(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function Toggle({ label, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 cursor-pointer select-none p-3 rounded-xl border border-border/50 hover:bg-secondary/40 transition-colors w-full text-left"
    >
      <span className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${value ? 'bg-primary' : 'bg-secondary'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

// Admin form for MusicRelease records — each record produces a public landing
// page at /release/:slug with zero code changes. Platform links are managed
// separately in AdminMusicLinks.
export default function MusicReleaseForm({ release, onSave, onCancel }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '',
    slug: '',
    artist_name: 'ROXSAN',
    release_type: '',
    label: 'Roxsan Music',
    status: 'released',
    release_date: '',
    tagline: '',
    theme_preset: 'gold',
    show_email_capture: true,
    show_in_nav: true,
    nav_sort_order: 0,
    cover_image_url: '',
    hero_image_url: '',
    youtube_embed_url: '',
    apple_embed_url: '',
    apple_preorder_url: '',
    is_active: true,
    featured: false,
    previews_enabled: true,
    audio_snippet: '',
    snippet_start: 0,
    snippet_end: 30,
    snippet_duration: 30,
    social_share_image: '',
    share_description: '',
    behind_the_scenes: '',
    description: '',
    ...release,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Pull audio uploaded on the Song Library page (SongProfile) so the admin
  // doesn't have to re-upload it here. Match by song_id, then by exact title.
  const { data: profiles = [] } = useQuery({ queryKey: ['song-profiles'], queryFn: () => base44.entities.SongProfile.list('-created_date') });
  // Title match is the primary key — the song_id link is unreliable on older
  // records and can point at the wrong release (e.g. a "You Don't Know Roxanne"
  // profile whose song_id lands on the "Some Day" release). Fall back to song_id
  // only when no title match exists.
  const linkedProfile = profiles.find((p) => form.title && normTitle(p.title) === normTitle(form.title))
    || profiles.find((p) => release?.id && p.song_id === release.id);
  const linkedAudio = linkedProfile?.audio_file || '';

  // Song Library = source of truth. When a match is found, pull its audio into
  // the release so the snippet tool always has the right source. Fires on match
  // change (not on every audio_snippet edit) so a manual override during this
  // session is preserved.
  useEffect(() => {
    if (linkedAudio) {
      setForm((f) => ({ ...f, audio_snippet: linkedAudio }));
    }
  }, [linkedProfile?.id, linkedAudio]);

  const fullAudio = form.audio_snippet || linkedAudio;

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!form.slug.trim()) {
      toast({ title: 'Slug is required (used for the /release/:slug URL)', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      nav_sort_order: Number(form.nav_sort_order) || 0,
      snippet_start: form.snippet_start !== '' && form.snippet_start != null ? Number(form.snippet_start) : null,
      snippet_end: form.snippet_end !== '' && form.snippet_end != null ? Number(form.snippet_end) : null,
      snippet_duration: form.snippet_duration !== '' && form.snippet_duration != null ? Number(form.snippet_duration) : null,
    };
    try {
      if (release?.id) {
        await base44.entities.MusicRelease.update(release.id, payload);
      } else {
        await base44.entities.MusicRelease.create(payload);
      }
      toast({ title: release?.id ? 'Release page updated!' : 'Release page created!', duration: 3000 });
      onSave?.();
    } catch (e) {
      toast({ title: 'Error saving', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cover Art</label>
          <MediaUploader type="image" currentUrl={form.cover_image_url} onUpload={(url) => set('cover_image_url', url)} placeholder="Upload cover" />
        </div>
        <div className="sm:col-span-2 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title *</label>
            <Input
              value={form.title}
              onChange={(e) => { set('title', e.target.value); if (!release?.id) set('slug', slugify(e.target.value)); }}
              placeholder="Release title"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Slug * — URL: /release/{form.slug || '…'}</label>
            <Input value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} placeholder="dont-get-it-twisted" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tagline (subtitle)</label>
            <Input value={form.tagline || ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Raw. Real. Unapologetic." />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Release Date</label>
          <Input type="date" value={form.release_date || ''} onChange={(e) => set('release_date', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Theme Preset</label>
          <select value={form.theme_preset} onChange={(e) => set('theme_preset', e.target.value)}>
            {THEME_PRESET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Artist Name</label>
          <Input value={form.artist_name || ''} onChange={(e) => set('artist_name', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Release Type</label>
          <Input value={form.release_type || ''} onChange={(e) => set('release_type', e.target.value)} placeholder="Single or Album" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nav Sort Order</label>
          <Input type="number" value={form.nav_sort_order ?? 0} onChange={(e) => set('nav_sort_order', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">YouTube Embed URL</label>
        <Input value={form.youtube_embed_url || ''} onChange={(e) => set('youtube_embed_url', e.target.value)} placeholder="https://www.youtube.com/embed/…" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Apple Music embed URL</label>
        <Input value={form.apple_embed_url || ''} onChange={(e) => set('apple_embed_url', e.target.value)} placeholder="https://embed.music.apple.com/us/album/…/…" />
        <p className="text-xs text-muted-foreground">Shown only on upcoming releases, below the pre-save button.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Apple Music Pre-Order URL</label>
        <Input value={form.apple_preorder_url || ''} onChange={(e) => set('apple_preorder_url', e.target.value)} placeholder="https://music.apple.com/us/album/…/…" />
        <p className="text-xs text-muted-foreground">Adds a secondary “Pre-Order on Apple Music” button on the /go/:slug thank-you state.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hero Background Image (optional)</label>
        <MediaUploader type="image" currentUrl={form.hero_image_url} onUpload={(url) => set('hero_image_url', url)} placeholder="Optional hero background" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description (optional, tagline fallback)</label>
        <Textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={2} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Behind the Song (personal story)</label>
        <Textarea
          value={form.behind_the_scenes || ''}
          onChange={(e) => set('behind_the_scenes', e.target.value)}
          rows={6}
          placeholder="The story behind this song — how it came together, what it means…"
        />
        <p className="text-xs text-muted-foreground">Shown as a “Behind the Song” section on /release/{form.slug || '…'} and /go/{form.slug || '…'}. Leave blank to hide it.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Toggle label="Show email capture" value={form.show_email_capture} onChange={(v) => set('show_email_capture', v)} />
        <Toggle label="Show in nav menu" value={form.show_in_nav} onChange={(v) => set('show_in_nav', v)} />
        <Toggle label="Page is live" value={form.is_active} onChange={(v) => set('is_active', v)} />
        <Toggle label="Featured" value={form.featured} onChange={(v) => set('featured', v)} />
      </div>

      <div className="space-y-1">
        <Toggle label="Track previews" value={form.previews_enabled !== false} onChange={(v) => set('previews_enabled', v)} />
        <p className="text-xs text-muted-foreground px-3">Off: no tracks on this release are playable publicly, regardless of status.</p>
      </div>

      <div className="border border-border/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Audio Snippet (preview)</label>
          {linkedAudio && !form.audio_snippet && (
            <Button type="button" variant="outline" size="sm" onClick={() => set('audio_snippet', linkedAudio)} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Pull from song page
            </Button>
          )}
        </div>
        <MediaUploader type="audio" currentUrl={form.audio_snippet} onUpload={(url) => set('audio_snippet', url)} placeholder="Upload full song audio" />
        {linkedProfile && (
          <p className="text-xs text-muted-foreground">
            Matched “{linkedProfile.title}” from the Song Library
            {linkedProfile.audio_file ? ' · audio attached' : ' · no audio uploaded yet'}.
          </p>
        )}
        <SnippetEditor
          fullAudioUrl={fullAudio}
          initialStart={form.snippet_start ?? 0}
          initialEnd={form.snippet_end ?? 30}
          onSnippetChange={(s) => setForm((f) => ({ ...f, ...s }))}
        />
      </div>

      <div className="border border-border/50 rounded-xl p-4 space-y-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Social Sharing</label>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Share Description (social previews)</label>
          <Textarea value={form.share_description || ''} onChange={(e) => set('share_description', e.target.value)} rows={2} placeholder="Short description for social previews..." />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Custom Social Share Image (falls back to cover)</label>
          <MediaUploader type="image" currentUrl={form.social_share_image} onUpload={(url) => set('social_share_image', url)} placeholder="Upload OG share image (1200×630 recommended)" />
        </div>
      </div>

      {release?.id && (
        <div className="border border-border/50 rounded-xl p-4">
          <TrackManager releaseId={release.id} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : release?.id ? 'Update Release Page' : 'Create Release Page'}
        </Button>
        {onCancel && <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
      </div>

      {release?.id && (
        <p className="text-xs text-muted-foreground">
          Public URL: /release/{release.slug} · Manage platform links in{' '}
          <Link to="/admin/music-links" className="text-primary underline">Platform Links</Link>.
        </p>
      )}
    </div>
  );
}