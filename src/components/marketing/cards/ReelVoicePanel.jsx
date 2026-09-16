import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Mic, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

/**
 * Narration and card uploads for the reel.
 *
 * Narration is generated once and previewed before it goes anywhere near the
 * export, so nothing is committed on the strength of a script alone. The clip
 * length follows the narration when it runs longer than the cards.
 */
export default function ReelVoicePanel({ cards, uploaded, onUploaded, audioUrl, onAudio, disabled }) {
  const { toast } = useToast();
  const [script, setScript] = useState('');
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // A first draft of the narration, straight from the cards on the board.
  const draftFromCards = () => {
    const lines = cards.map((c) => [c.headline, ...(c.items || []), c.body].filter(Boolean).join(' ').replace(/\n/g, ' ').trim());
    setScript(lines.filter(Boolean).join('\n'));
  };

  const makeVoice = async () => {
    const text = script.trim();
    if (!text) return;
    setBusy(true);
    try {
      const { url } = await base44.integrations.Core.GenerateSpeech({ text: text.replace(/\n/g, ' '), voice: 'honey' });
      onAudio(url);
      const probe = new Audio(url);
      probe.addEventListener('loadedmetadata', () => setSeconds(Math.ceil(probe.duration || 0)));
      toast({ title: 'Narration ready', description: 'Listen before you export the reel.' });
    } catch (e) {
      toast({ title: 'Could not generate narration', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const addFiles = (files) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    Promise.all(list.map((f) => new Promise((res) => {
      const reader = new FileReader();
      reader.onload = () => res({ name: f.name, url: reader.result });
      reader.readAsDataURL(f);
    }))).then((rows) => {
      // Sort by filename so 01_, 02_, 03_ land in the right order.
      rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      onUploaded([...uploaded, ...rows]);
      toast({ title: `${rows.length} card${rows.length > 1 ? 's' : ''} added`, description: 'Ordered by filename.' });
    });
  };

  return (
    <div className="rounded-xl border border-border/60 p-3 space-y-3">
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Use cards you already made</Label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:border-primary/40">
            <Upload className="h-3.5 w-3.5" />
            Add card images
            <input type="file" accept="image/*" multiple className="hidden" disabled={disabled}
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>
          {uploaded.length > 0 && (
            <button type="button" className="text-xs text-destructive underline" onClick={() => onUploaded([])}>
              Clear {uploaded.length}
            </button>
          )}
        </div>
        {uploaded.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {uploaded.map((u, i) => (
              <div key={i} className="relative">
                <img src={u.url} alt="" className="h-14 w-9 rounded object-cover border border-border" />
                <button type="button" aria-label="Remove card"
                  onClick={() => onUploaded(uploaded.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 rounded-full bg-background border border-border p-0.5">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Uploaded cards play first, in filename order, then anything on the board.
        </p>
      </div>

      <div className="border-t border-border/60 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Narration</Label>
          <button type="button" onClick={draftFromCards} disabled={disabled || !cards.length}
            className="text-xs underline text-muted-foreground hover:text-foreground disabled:opacity-50">
            Draft from cards
          </button>
        </div>
        <Textarea rows={4} value={script} onChange={(e) => { setScript(e.target.value); onAudio(''); }}
          placeholder="What Roxanne says over the reel. One line per card reads most naturally."
          disabled={disabled} className="text-sm" />
        <Button variant="outline" size="sm" onClick={makeVoice} disabled={disabled || busy || !script.trim()} className="gap-1.5">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
          {audioUrl ? 'Regenerate voice' : 'Generate voice'}
        </Button>
        {audioUrl && (
          <>
            <audio controls src={audioUrl} className="w-full h-9" />
            <p className="text-[11px] text-muted-foreground">
              {seconds ? `About ${seconds} seconds. ` : ''}The reel stretches to fit the narration if it runs longer than the cards.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
