import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Film, Upload, Loader2, Search, X, Plus } from 'lucide-react';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { CLIP_SOURCES, CLIP_MOODS, ORIENTATIONS } from '@/lib/marketing';
import { isVideoFile } from '@/components/marketing/ClipThumb';
import ClipCard from '@/components/marketing/clips/ClipCard';
import { MEDIA_CATEGORIES, guessCategory } from '@/lib/mediaCategories';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';
const SIZE_WARN = 60 * 1024 * 1024; // 60MB gentle warning threshold

function UploadForm({ releases, onDone }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rows, setRows] = useState([]); // {file, title, source_type, moods, orientation, linked_song_id, notes}
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (files) => {
    const next = [...files].map((f) => ({
      file: f, title: f.name.replace(/\.[^.]+$/, ''),
      source_type: 'My Footage', moods: [], orientation: 'Vertical 9:16', linked_song_id: '', notes: '',
      media_category: guessCategory(f.name),
    }));
    setRows((r) => [...r, ...next]);
    const big = next.filter((r) => r.file.size > SIZE_WARN);
    if (big.length) {
      toast({ title: 'Large file(s) detected', description: 'For faster uploads, use compressed/downloaded-quality clips where possible.', variant: 'default' });
    }
  };

  const setRow = (i, k, v) => setRows((arr) => arr.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const removeRow = (i) => setRows((arr) => arr.filter((_, idx) => idx !== i));
  const toggleMood = (i, m) => setRows((arr) => arr.map((r, idx) => (idx === i ? { ...r, moods: r.moods.includes(m) ? r.moods.filter((x) => x !== m) : [...r.moods, m] } : r)));

  const upload = async () => {
    if (rows.length === 0) return;
    setBusy(true);
    let ok = 0;
    try {
      for (const r of rows) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: r.file });
        await base44.entities.ClipAsset.create({
          title: r.title.trim() || r.file.name,
          file: file_url,
          source_type: r.source_type,
          moods: r.moods,
          linked_song_id: r.linked_song_id || undefined,
          media_category: r.media_category || undefined,
          orientation: r.orientation,
          notes: r.notes.trim(),
        });
        ok++;
      }
      qc.invalidateQueries({ queryKey: ['clip-assets'] });
      toast({ title: `${ok} clip(s) added` });
      setRows([]);
      if (inputRef.current) inputRef.current.value = '';
      onDone?.();
    } catch (e) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <label className={FL}>Add clips</label>
        <input ref={inputRef} type="file" accept="video/*,image/*" multiple onChange={(e) => addFiles([...e.target.files])} className="text-xs" />
      </div>

      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="glass rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium truncate">{r.file.name} <span className="text-muted-foreground">({(r.file.size / 1024 / 1024).toFixed(1)}MB)</span></p>
                <button onClick={() => removeRow(i)} className="p-1 rounded-lg hover:bg-secondary/50 text-destructive"><X className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-[10px] text-muted-foreground">Title</label><Input value={r.title} onChange={(e) => setRow(i, 'title', e.target.value)} className="h-8 text-sm" /></div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Source type</label>
                  <select value={r.source_type} onChange={(e) => setRow(i, 'source_type', e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
                    {CLIP_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Orientation</label>
                  <select value={r.orientation} onChange={(e) => setRow(i, 'orientation', e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
                    {ORIENTATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Linked song (optional)</label>
                  <select value={r.linked_song_id} onChange={(e) => setRow(i, 'linked_song_id', e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
                    <option value="">None</option>
                    {releases.map((rl) => <option key={rl.id} value={rl.id}>{rl.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Clip type</label>
                  <select value={r.media_category} onChange={(e) => setRow(i, 'media_category', e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
                    {MEDIA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-muted-foreground">Moods</label>
                  <div className="flex flex-wrap gap-1">
                    {CLIP_MOODS.map((m) => (
                      <button key={m} type="button" onClick={() => toggleMood(i, m)} className={`px-2 py-0.5 rounded-full text-[11px] border ${r.moods.includes(m) ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground'}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2"><label className="text-[10px] text-muted-foreground">Notes</label><Input value={r.notes} onChange={(e) => setRow(i, 'notes', e.target.value)} className="h-8 text-sm" /></div>
              </div>
            </div>
          ))}
          <Button onClick={upload} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload {rows.length} clip(s)
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ClipLibrary() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [fMood, setFMood] = useState('');
  const [fSource, setFSource] = useState('');
  const [fSong, setFSong] = useState('');
  const [fOrient, setFOrient] = useState('');
  const [fType, setFType] = useState('');
  const [fKind, setFKind] = useState('');
  const [groupBy, setGroupBy] = useState('album');
  const [showUpload, setShowUpload] = useState(false);

  const { data: clips = [], isLoading } = useQuery({ queryKey: ['clip-assets'], queryFn: () => base44.entities.ClipAsset.list('-created_date') });
  const { data: releases = [] } = useQuery({ queryKey: ['releases-admin'], queryFn: () => base44.entities.MusicRelease.list('-created_date') });

  const songTitle = (id) => releases.find((r) => r.id === id)?.title || '';

  const filtered = clips.filter((c) => {
    if (q && !(`${c.title} ${c.notes} ${(c.moods || []).join(' ')}`.toLowerCase().includes(q.toLowerCase()))) return false;
    if (fMood && !(c.moods || []).includes(fMood)) return false;
    if (fSource && c.source_type !== fSource) return false;
    if (fSong && c.linked_song_id !== fSong) return false;
    if (fOrient && c.orientation !== fOrient) return false;
    if (fType && (c.media_category || '') !== fType) return false;
    if (fKind && (isVideoFile(c.file) ? 'video' : 'image') !== fKind) return false;
    return true;
  });

  // Groups the filtered clips under the heading the owner chose.
  const groups = (() => {
    if (groupBy === 'none') return [{ key: 'all', label: `All clips (${filtered.length})`, items: filtered }];
    const map = new Map();
    for (const c of filtered) {
      const label = groupBy === 'album'
        ? (songTitle(c.linked_song_id) || 'Unfiled — no album or song')
        : groupBy === 'type'
          ? (c.media_category || 'Untyped')
          : isVideoFile(c.file) ? 'Videos' : 'Images';
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(c);
    }
    return [...map.entries()]
      .sort((a, b) => (/^Unfiled|^Untyped/.test(a[0]) ? 1 : /^Unfiled|^Untyped/.test(b[0]) ? -1 : a[0].localeCompare(b[0])))
      .map(([label, items]) => ({ key: label, label: `${label} (${items.length})`, items }));
  })();

  const del = async (c) => {
    if (!confirm(`Delete clip "${c.title}"?`)) return;
    try {
      await base44.entities.ClipAsset.delete(c.id);
      qc.invalidateQueries({ queryKey: ['clip-assets'] });
      toast({ title: 'Clip deleted' });
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <HowThisWorks
        steps={[
          'Add clips with the Add clips button, then tag each one with its moods, orientation and song.',
          'Vertical 9:16 clips work best — they are what reels and stories need.',
          'Use the filters to find the right clip by mood, source, song or shape.',
          'Tagged clips get matched automatically when you build a video post or a reel.',
        ]}
        note="Canva exports and stock footage belong here too — anything you would reuse in a video."
      />

      <div className="flex justify-end">
        <Button variant={showUpload ? 'secondary' : 'default'} onClick={() => setShowUpload((s) => !s)} className="gap-1.5">
          <Plus className="h-4 w-4" /> {showUpload ? 'Close uploader' : 'Add clips'}
        </Button>
      </div>

      {showUpload && <UploadForm releases={releases} onDone={() => setShowUpload(false)} />}

      {/* Filters */}
      <div className="glass rounded-xl p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 items-center">
        <div className="relative col-span-2 sm:col-span-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, moods, notes…" className="h-8 pl-7 text-sm" />
        </div>
        <select value={fMood} onChange={(e) => setFMood(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">All moods</option>{CLIP_MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={fSource} onChange={(e) => setFSource(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">All sources</option>{CLIP_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fSong} onChange={(e) => setFSong(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">All songs</option>{releases.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <select value={fOrient} onChange={(e) => setFOrient(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">All orientations</option>{ORIENTATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={fType} onChange={(e) => setFType(e.target.value)} aria-label="Clip type" className="h-8 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">All types</option>{MEDIA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fKind} onChange={(e) => setFKind(e.target.value)} aria-label="Videos or images" className="h-8 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Videos and images</option>
          <option value="video">Videos only</option>
          <option value="image">Images only</option>
        </select>
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} aria-label="Group by" className="h-8 rounded-md border border-input bg-background px-2 text-sm">
          <option value="album">Group by album or song</option>
          <option value="type">Group by clip type</option>
          <option value="kind">Group by video or image</option>
          <option value="none">No grouping</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Film className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{clips.length === 0 ? 'No clips yet. Upload your first clips above.' : 'No clips match your filters.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.key} className="space-y-2">
              <h2 className="font-display text-sm font-semibold">{g.label}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {g.items.map((c) => <ClipCard key={c.id} clip={c} releases={releases} onDelete={del} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}