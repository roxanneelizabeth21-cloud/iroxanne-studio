import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Save, Pencil, ListMusic, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MediaUploader from './MediaUploader';
import SnippetEditor from './SnippetEditor';
import { useToast } from '@/components/ui/use-toast';

function fmt(s) {
  if (!s || isNaN(s)) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function TrackEditor({ releaseId, track, onDone }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '', audio_file: '', lyrics: '', duration: '',
    snippet_start: 0, snippet_end: 30, snippet_duration: 30,
    ...track,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isEditing = !!track?.id;

  // Song Library = single source of truth for audio + lyrics. When the track
  // title matches a song in the library, pull its audio + lyrics in
  // automatically so the admin never re-uploads. Fields below stay editable
  // as an override.
  const { data: profiles = [] } = useQuery({ queryKey: ['song-profiles'], queryFn: () => base44.entities.SongProfile.list('-created_date') });
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const matchedProfile = profiles.find((p) => form.title && norm(p.title) === norm(form.title));
  const linkedAudio = matchedProfile?.audio_file || '';
  const linkedLyrics = matchedProfile?.lyrics || '';

  // Auto-fill audio + lyrics the moment a library match is found and the
  // fields are still empty (don't clobber a manual override).
  useEffect(() => {
    if (matchedProfile) {
      setForm((f) => ({
        ...f,
        audio_file: f.audio_file || linkedAudio,
        lyrics: f.lyrics || linkedLyrics,
      }));
    }
  }, [linkedAudio, linkedLyrics, matchedProfile]);

  const pickSong = (e) => {
    const p = profiles.find((x) => x.id === e.target.value);
    if (!p) return;
    setForm((f) => ({
      ...f,
      title: p.title || f.title,
      audio_file: p.audio_file || f.audio_file,
      lyrics: p.lyrics || f.lyrics,
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: 'Title is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        audio_file: form.audio_file,
        lyrics: form.lyrics,
        duration: form.duration ? Number(form.duration) : null,
        snippet_start: form.snippet_start != null && form.snippet_start !== '' ? Number(form.snippet_start) : null,
        snippet_end: form.snippet_end != null && form.snippet_end !== '' ? Number(form.snippet_end) : null,
        snippet_duration: form.snippet_duration != null && form.snippet_duration !== '' ? Number(form.snippet_duration) : null,
        release_id: releaseId,
      };
      if (track?.id) {
        await base44.entities.Track.update(track.id, payload);
      } else {
        const existing = await base44.entities.Track.filter({ release_id: releaseId });
        const nextNum = existing.reduce((m, t) => Math.max(m, t.track_number || 0), 0) + 1;
        await base44.entities.Track.create({ ...payload, track_number: nextNum });
      }
      toast({ title: track?.id ? 'Track updated' : 'Track added' });
      qc.invalidateQueries({ queryKey: ['tracks', releaseId] });
      qc.invalidateQueries({ queryKey: ['all-tracks'] });
      onDone();
    } catch (e) {
      toast({ title: 'Error saving track', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
      {!isEditing && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Library className="h-3.5 w-3.5" /> Pull from Song Library</label>
          <select value="" onChange={pickSong} className="h-8 text-sm">
            <option value="">Choose a song (auto-fills audio + lyrics)…</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.title}{p.audio_file ? '' : ' · (no audio)'}</option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Track Title *</label>
        <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Track name" className="h-8 text-sm" autoFocus />
        {matchedProfile && (
          <p className="text-xs text-emerald-600 flex items-center gap-1"><Library className="h-3 w-3" /> Matched "{matchedProfile.title}" in the Song Library{linkedAudio ? ' — audio pulled in' : ' (no audio uploaded there)'}.</p>
        )}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Audio File</label>
        <MediaUploader type="audio" currentUrl={form.audio_file} onUpload={(url) => set('audio_file', url)} placeholder="Upload track audio (MP3, WAV)" />
        {matchedProfile && linkedAudio && (
          <p className="text-xs text-emerald-600 flex items-center gap-1"><Library className="h-3 w-3" /> Audio pulled from the Song Library.</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5 sm:col-span-1">
          <label className="text-xs text-muted-foreground">Duration (sec)</label>
          <Input type="number" value={form.duration || ''} onChange={(e) => set('duration', e.target.value)} placeholder="optional" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs text-muted-foreground">Lyrics (optional)</label>
          <Textarea value={form.lyrics || ''} onChange={(e) => set('lyrics', e.target.value)} rows={2} placeholder="Full lyrics..." className="text-sm" />
        </div>
      </div>
      {form.audio_file && (
        <div className="rounded-lg border border-border/50 p-3 space-y-2 bg-secondary/20">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview Snippet</label>
          <SnippetEditor
            fullAudioUrl={form.audio_file}
            initialStart={form.snippet_start ?? 0}
            initialEnd={form.snippet_end ?? 30}
            onSnippetChange={(s) => setForm((f) => ({
              ...f,
              snippet_start: s.snippet_start,
              snippet_end: s.snippet_end,
              snippet_duration: s.snippet_duration,
            }))}
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 flex-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isEditing ? 'Save Changes' : 'Add Track'}
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </motion.div>
  );
}

export default function TrackManager({ releaseId }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ['tracks', releaseId],
    queryFn: () => base44.entities.Track.filter({ release_id: releaseId }),
  });

  const sorted = [...tracks].sort((a, b) => (a.track_number || 0) - (b.track_number || 0));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tracks', releaseId] });
    qc.invalidateQueries({ queryKey: ['all-tracks'] });
  };

  const handleDelete = async (track) => {
    if (!confirm(`Delete "${track.title}"?`)) return;
    await base44.entities.Track.delete(track.id);
    toast({ title: 'Track deleted' });
    invalidate();
  };

  const move = async (track, dir) => {
    const idx = sorted.findIndex((t) => t.id === track.id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;
    await base44.entities.Track.bulkUpdate([
      { id: track.id, track_number: swapWith.track_number },
      { id: swapWith.id, track_number: track.track_number },
    ]);
    invalidate();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tracklist</span>
          {sorted.length > 0 && <span className="text-xs text-muted-foreground/60">· {sorted.length}</span>}
        </div>
        <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7" onClick={() => { setAdding(!adding); setEditingId(null); }}>
          <Plus className="h-3.5 w-3.5" /> Add Track
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>
      ) : sorted.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground text-center py-4">No tracks yet. Add the first one!</p>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((t, i) => (
            editingId === t.id ? (
              <TrackEditor key={t.id} releaseId={releaseId} track={t} onDone={() => setEditingId(null)} />
            ) : (
              <motion.div key={t.id} layout className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                <span className="w-5 text-center text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  {t.duration ? <p className="text-xs text-muted-foreground">{fmt(t.duration)}</p> : null}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => move(t, -1)}><ChevronUp className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === sorted.length - 1} onClick={() => move(t, 1)}><ChevronDown className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(t.id); setAdding(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </motion.div>
            )
          ))}
        </div>
      )}

      {adding && (
        <TrackEditor releaseId={releaseId} onDone={() => setAdding(false)} />
      )}
    </div>
  );
}