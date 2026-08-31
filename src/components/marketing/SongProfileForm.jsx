import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mic } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { RELEASE_STATUSES } from '@/lib/marketing';
import MediaUploader from '@/components/admin/MediaUploader';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

// SongProfileForm — add or edit a single song content profile.
export default function SongProfileForm({ profile, releases = [], onSave, onCancel }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: profile?.title || '',
    song_id: profile?.song_id || '',
    lyrics: profile?.lyrics || '',
    audio_file: profile?.audio_file || '',
    song_story: profile?.song_story || '',
    themes: Array.isArray(profile?.themes) ? profile.themes.join(', ') : (profile?.themes || ''),
    key_lines: profile?.key_lines || '',
    chorus_summary: profile?.chorus_summary || '',
    streaming_links: profile?.streaming_links || '',
    release_status: profile?.release_status || 'Unreleased',
    release_date: profile?.release_date || '',
    evergreen_on: profile?.evergreen_on !== false,
  });
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Speech-to-text the uploaded audio (Whisper) and drop the result into the
  // lyrics field so the admin can review and edit it.
  const transcribe = async () => {
    if (!form.audio_file) return toast({ title: 'Upload an audio file first', variant: 'destructive' });
    setTranscribing(true);
    try {
      const res = await base44.integrations.Core.TranscribeAudio({ audio_url: form.audio_file });
      const text = typeof res === 'string' ? res : res?.text || res?.transcript || '';
      if (!text) throw new Error('No transcript returned');
      set('lyrics', text);
      toast({ title: 'Transcription ready — review and edit the lyrics' });
    } catch (e) {
      toast({ title: 'Transcription failed', description: e.message, variant: 'destructive' });
    } finally {
      setTranscribing(false);
    }
  };

  const submit = async () => {
    if (!form.title.trim()) return toast({ title: 'Title is required', variant: 'destructive' });
    setSaving(true);
    try {
      const payload = {
        ...form,
        themes: String(form.themes).split(',').map((t) => t.trim()).filter(Boolean),
      };
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={FL}>Title</label>
        <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Song title" />
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Linked release (optional)</label>
        <select value={form.song_id} onChange={(e) => set('song_id', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">None</option>
          {releases.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Lyrics</label>
        <Textarea value={form.lyrics} onChange={(e) => set('lyrics', e.target.value)} rows={8} placeholder="Full lyrics with [Verse 1], [Chorus] labels" />
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Audio file</label>
        <MediaUploader type="audio" currentUrl={form.audio_file} onUpload={(url) => set('audio_file', url)} placeholder="Upload the song audio (mp3, m4a, wav)" />
        <Button type="button" variant="outline" size="sm" onClick={transcribe} disabled={transcribing || !form.audio_file} className="gap-1.5 mt-2">
          {transcribing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
          {transcribing ? 'Transcribing…' : 'Transcribe audio → lyrics'}
        </Button>
        <p className="text-xs text-muted-foreground/80">Uses Whisper speech-to-text on the uploaded audio. The result fills the lyrics field above so you can review and edit it.</p>
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Song story</label>
        <Textarea value={form.song_story} onChange={(e) => set('song_story', e.target.value)} rows={3} placeholder="What the song is about and why it was written" />
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Themes (comma-separated)</label>
        <Input value={form.themes} onChange={(e) => set('themes', e.target.value)} placeholder="Faith, Love, Resilience" />
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Key lines (one per line)</label>
        <Textarea value={form.key_lines} onChange={(e) => set('key_lines', e.target.value)} rows={4} placeholder="The most quotable lyric lines" />
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Chorus summary</label>
        <Input value={form.chorus_summary} onChange={(e) => set('chorus_summary', e.target.value)} placeholder="The chorus message in one sentence" />
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Streaming links</label>
        <Textarea value={form.streaming_links} onChange={(e) => set('streaming_links', e.target.value)} rows={2} placeholder="Streaming platform links for this song" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={FL}>Release status</label>
          <select value={form.release_status} onChange={(e) => set('release_status', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
            {RELEASE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Release date</label>
          <Input type="date" value={form.release_date} onChange={(e) => set('release_date', e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input type="checkbox" checked={form.evergreen_on} onChange={(e) => set('evergreen_on', e.target.checked)} className="accent-primary" />
        Evergreen rotation (auto-promote this song once released)
      </label>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={saving}>Save song</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
}