import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Sparkles, Film, Search, Copy, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { copyText, formatDuration, isVideoFormat } from '@/lib/marketing';

// Suggests clips from the admin's library for a post. For authentic/personal posts,
// only My Footage clips are suggested (enforced in the backend). Shows 3–5 matches
// as selectable previews, plus ready-to-copy search phrases when coverage is thin.
export default function ClipSuggester({ post, clipAssetId, onSelectClip }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null); // [{id, reason}]
  const [phrases, setPhrases] = useState([]);
  const [forceMy, setForceMy] = useState(false);
  const [note, setNote] = useState('');

  const { data: clips = [] } = useQuery({
    queryKey: ['clip-assets'],
    queryFn: () => base44.entities.ClipAsset.list('-created_date'),
  });

  const isVideo = isVideoFormat(post?.format);
  if (!isVideo) return null;

  const suggest = async () => {
    setLoading(true);
    setMatches(null);
    setPhrases([]);
    setNote('');
    try {
      const res = await base44.functions.invoke('suggestClips', { post });
      const data = res?.data ?? res;
      setMatches(Array.isArray(data?.matches) ? data.matches : []);
      setPhrases(Array.isArray(data?.search_phrases) ? data.search_phrases : []);
      setForceMy(!!data?.force_my_footage);
      setNote(data?.note || '');
    } catch (e) {
      toast({ title: 'Suggestion failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resolved = (matches || []).map((m) => ({ ...m, clip: clips.find((c) => c.id === m.id) })).filter((m) => m.clip);

  return (
    <div className="glass rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clip matching</label>
        <Button type="button" variant="secondary" size="sm" onClick={suggest} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Matching…' : 'Suggest Clips'}
        </Button>
      </div>

      {forceMy && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Authentic/personal posts must use your own footage — only “My Footage” clips are shown.
        </p>
      )}
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}

      {resolved.length > 0 && (
        <div className="space-y-2">
          {resolved.map((m) => {
            const c = m.clip;
            const isVideoClip = /\.(mp4|mov|webm|ogg)$/i.test(c.file || '');
            const selected = clipAssetId === c.id;
            return (
              <div key={c.id} className="flex gap-2 items-start glass rounded-lg p-2">
                <div className="relative w-16 h-20 rounded-md overflow-hidden bg-secondary shrink-0">
                  {c.file ? (
                    isVideoClip ? (
                      <video src={c.file} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    ) : (
                      <img src={c.file} alt={c.title} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Film className="h-4 w-4 text-muted-foreground" /></div>
                  )}
                  {c.duration_seconds ? (
                    <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/70 text-white px-1 rounded">{formatDuration(c.duration_seconds)}</span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.source_type} · {c.orientation} · {(c.moods || []).join(', ')}</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5 line-clamp-2">{m.reason}</p>
                </div>
                <Button type="button" variant={selected ? 'default' : 'outline'} size="sm" onClick={() => onSelectClip(c)} className="h-7 px-2 shrink-0 gap-1">
                  {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {selected ? 'Selected' : 'Select'}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {matches !== null && resolved.length === 0 && !note && (
        <p className="text-xs text-muted-foreground">No matching clips in your library. Use the search phrases below.</p>
      )}

      {phrases.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Search className="h-3 w-3" /> Search phrases for new clips</p>
          {phrases.map((p, i) => (
            <PhraseCopy key={i} text={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhraseCopy({ text }) {
  const [done, setDone] = useState(false);
  const handle = async () => {
    const ok = await copyText(text);
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }
  };
  return (
    <div className="flex items-center gap-2">
      <code className="text-xs flex-1 truncate glass rounded px-2 py-1">{text}</code>
      <Button type="button" variant="outline" size="sm" onClick={handle} className="h-7 px-2 gap-1 shrink-0">
        {done ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        {done ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}