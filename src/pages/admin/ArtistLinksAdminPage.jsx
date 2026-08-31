import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Loader2, Link2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { PLATFORM_DEFAULTS, resolveIcon } from '@/lib/platformConfig';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

export default function ArtistLinksAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | record

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['artist-profile-links'],
    queryFn: () => base44.entities.ArtistProfileLink.list('sort_order'),
  });

  const sorted = [...links].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const del = async (l) => {
    if (!confirm(`Delete "${l.platform_name}" link?`)) return;
    try {
      await base44.entities.ArtistProfileLink.delete(l.id);
      qc.invalidateQueries({ queryKey: ['artist-profile-links'] });
      toast({ title: 'Link deleted' });
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const toggleVisible = async (l) => {
    try {
      await base44.entities.ArtistProfileLink.update(l.id, { is_visible: !l.is_visible });
      qc.invalidateQueries({ queryKey: ['artist-profile-links'] });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const save = async (payload) => {
    try {
      if (editing && editing !== 'new') {
        await base44.entities.ArtistProfileLink.update(editing.id, payload);
        toast({ title: 'Link updated' });
      } else {
        await base44.entities.ArtistProfileLink.create(payload);
        toast({ title: 'Link added' });
      }
      qc.invalidateQueries({ queryKey: ['artist-profile-links'] });
      setEditing(null);
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" /> Artist Profile Links</h1>
          <p className="text-sm text-muted-foreground mt-1">Your artist profiles across streaming + social. These feed the “Connect” section on every release page.</p>
        </div>
        <Button size="sm" onClick={() => setEditing('new')} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add link</Button>
      </div>

      {editing && (
        <div className="glass rounded-2xl p-5">
          <ArtistLinkForm link={editing === 'new' ? null : editing} onSave={save} onCancel={() => setEditing(null)} />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : sorted.length === 0 && !editing ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No artist profile links yet. <button onClick={() => setEditing('new')} className="text-primary hover:underline">Add your first one</button>.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((l) => {
            const Icon = resolveIcon(l.icon_name);
            return (
              <div key={l.id} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{l.platform_name}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <ExternalLink className="h-3 w-3 shrink-0" /> {l.url}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${l.is_visible ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                  {l.is_visible ? 'Visible' : 'Hidden'}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleVisible(l)} title={l.is_visible ? 'Hide' : 'Show'}>
                    {l.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => del(l)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ArtistLinkForm({ link, onSave, onCancel }) {
  const def = PLATFORM_DEFAULTS.find((p) => p.platform_type === (link?.platform_type || 'spotify')) || PLATFORM_DEFAULTS[0];
  const [form, setForm] = useState({
    platform_name: def.platform_name,
    platform_type: def.platform_type,
    url: '',
    display_label: '',
    icon_name: def.icon_name,
    is_visible: true,
    sort_order: 0,
    ...link,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onTypeChange = (type) => {
    const preset = PLATFORM_DEFAULTS.find((p) => p.platform_type === type);
    setForm((f) => ({
      ...f,
      platform_type: type,
      icon_name: preset?.icon_name || f.icon_name,
      platform_name: f.platform_name && f.platform_name !== PLATFORM_DEFAULTS.find((p) => p.platform_type === f.platform_type)?.platform_name ? f.platform_name : preset?.platform_name || f.platform_name,
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.url.trim()) return;
    onSave({
      ...form,
      sort_order: Number(form.sort_order) || 0,
      display_label: form.display_label || `Follow on ${form.platform_name}`,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={FL}>Platform</label>
          <select value={form.platform_type} onChange={(e) => onTypeChange(e.target.value)}>
            {PLATFORM_DEFAULTS.map((p) => <option key={p.platform_type} value={p.platform_type}>{p.platform_name}</option>)}
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Display name</label>
          <Input value={form.platform_name} onChange={(e) => set('platform_name', e.target.value)} placeholder="Spotify" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Artist profile URL *</label>
        <Input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://open.spotify.com/artist/…" type="url" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={FL}>Button label</label>
          <Input value={form.display_label} onChange={(e) => set('display_label', e.target.value)} placeholder="Follow on Spotify" />
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Sort order</label>
          <Input type="number" value={form.sort_order ?? 0} onChange={(e) => set('sort_order', e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" className="gap-1.5"><Plus className="h-4 w-4" /> {link ? 'Update' : 'Add'} link</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}