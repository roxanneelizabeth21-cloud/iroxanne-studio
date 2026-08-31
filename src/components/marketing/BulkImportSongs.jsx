import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

// BulkImportSongs — paste many songs' lyrics, AI parses into SongProfile drafts,
// admin reviews once, then saves all with one button.
export default function BulkImportSongs({ onDone }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const parse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    try {
      const res = await base44.functions.invoke('bulkImportSongs', { text, link_existing: true });
      const data = res?.data ?? res;
      if (data?.error) throw new Error(data.error);
      setDrafts(data.drafts || []);
      if (!data.drafts?.length) toast({ title: 'No songs detected — try clearer title lines', variant: 'destructive' });
    } catch (e) {
      toast({ title: 'Parse failed', description: e.message, variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  };

  const saveAll = async () => {
    if (!drafts?.length) return;
    setSaving(true);
    try {
      await base44.entities.SongProfile.bulkCreate(drafts);
      toast({ title: `Imported ${drafts.length} song${drafts.length === 1 ? '' : 's'}` });
      setDrafts(null);
      setText('');
      qc.invalidateQueries({ queryKey: ['song-profiles'] });
      onDone?.();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const editDraft = (i, field, value) => {
    setDrafts((d) => d.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)));
  };

  return (
    <div className="space-y-4">
      {!drafts && (
        <>
          <div className="space-y-1.5">
            <label className={FL}>Paste lyrics for one or more songs</label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder={`Song Title\n[Verse 1]\nlyrics...\n[Chorus]\nlyrics...\n\nAnother Song Title\nlyrics...`} />
            <p className="text-xs text-muted-foreground/80">Start each song with its title on its own line. Separate songs with a blank line. The AI detects titles, splits lyrics, and generates the story, themes, key lines, and chorus summary.</p>
          </div>
          <Button onClick={parse} disabled={parsing || !text.trim()} className="gap-2">
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {parsing ? 'Parsing…' : 'Parse & preview'}
          </Button>
        </>
      )}

      {drafts && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{drafts.length} song{drafts.length === 1 ? '' : 's'} parsed — review and save</p>
            <Button variant="ghost" size="sm" onClick={() => setDrafts(null)} className="gap-1.5"><X className="h-3.5 w-3.5" /> Discard</Button>
          </div>
          <div className="space-y-3">
            {drafts.map((d, i) => (
              <div key={i} className="glass rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={d.title} onChange={(e) => editDraft(i, 'title', e.target.value)} placeholder="Title" className="font-medium" />
                  {d.song_id && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">linked</span>}
                </div>
                <Input value={Array.isArray(d.themes) ? d.themes.join(', ') : d.themes} onChange={(e) => editDraft(i, 'themes', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} placeholder="Themes" className="text-sm" />
                <Textarea value={d.song_story} onChange={(e) => editDraft(i, 'song_story', e.target.value)} rows={2} placeholder="Song story" className="text-sm" />
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Lyrics ({String(d.lyrics || '').split('\n').length} lines)</summary>
                  <pre className="whitespace-pre-wrap mt-1 max-h-40 overflow-auto">{d.lyrics}</pre>
                </details>
              </div>
            ))}
          </div>
          <Button onClick={saveAll} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : `Save all ${drafts.length}`}
          </Button>
        </>
      )}
    </div>
  );
}