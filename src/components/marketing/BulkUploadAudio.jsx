import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, Music, CheckCircle2, AlertCircle, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

// Normalize a string the same way for filenames and song titles so they match:
// lowercase, strip apostrophes, strip leading track numbers, drop extension,
// collapse to alphanumerics + single spaces.
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '') // drop file extension
    .replace(/^\d+[\s._-]+/, '') // drop leading "01 - " / "01_" prefixes
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const titleFromName = (name) =>
  (name || '')
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/^\d+[\s._-]+/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// BulkUploadAudio — two modes:
//  1) "match"  : upload many audio files, auto-match each to an existing
//                SongProfile by filename, set audio_file on the match.
//  2) "tracks" : pick an album (Release), upload many audio files, create
//                Track records (auto track_number) linked to that album.
export default function BulkUploadAudio({ onDone }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const inputRef = useRef(null);

  const [mode, setMode] = useState('match'); // 'match' | 'tracks'
  const [files, setFiles] = useState([]); // [{ file, norm, title }]
  const [busy, setBusy] = useState(false);
  const [releaseId, setReleaseId] = useState('');

  const { data: profiles = [] } = useQuery({ queryKey: ['song-profiles'], queryFn: () => base44.entities.SongProfile.list('-created_date') });
  const { data: releases = [] } = useQuery({ queryKey: ['releases-admin'], queryFn: () => base44.entities.MusicRelease.list() });
  const { data: existingTracks = [] } = useQuery({ queryKey: ['tracks-admin', releaseId], queryFn: () => releaseId ? base44.entities.Track.filter({ release_id: releaseId }) : [], enabled: !!releaseId });

  // Build a normalized-title -> profile map for exact matching
  const profileByNorm = {};
  for (const p of profiles) profileByNorm[norm(p.title)] = p;

  const pickFiles = (list) => {
    const arr = Array.from(list || []).filter((f) => f.type.startsWith('audio/') || /\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(f.name));
    setFiles(arr.map((file) => ({ file, norm: norm(file.name), title: titleFromName(file.name) })));
  };

  // Filler words ignored when token-matching so "Slow Like Sunday" matches
  // "slow sunday.mp3" and "Slow Like Sunday (demo).mp3".
  const STOP = new Set(['the', 'and', 'a', 'an', 'of', 'in', 'on', 'to', 'for', 'like', 'yeah', 'hey', 'oh', 'ooh', 'with', 'my', 'your', 'you', 'i', 'im', 'its', 'it', 'is', 'are', 'be', 'me', 'we', 'so', 'but', 'or', 'at', 'by', 'from']);

  // Match a normalized filename to a SongProfile:
  //  1) exact normalized equality, then
  //  2) whole title as substring of filename (or vice versa), then
  //  3) every significant token of the title appears in the filename.
  // Longest matching title wins to avoid short-string false positives.
  const findMatch = (fileNorm) => {
    if (profileByNorm[fileNorm]) return profileByNorm[fileNorm];
    let best = null;
    let bestLen = 0;
    for (const p of profiles) {
      const t = norm(p.title);
      if (!t || t.length < 3) continue;
      if (fileNorm.includes(t) || t.includes(fileNorm)) {
        if (t.length > bestLen) { best = p; bestLen = t.length; }
        continue;
      }
      // Every significant word of the title must appear somewhere in the
      // filename — substring match handles space-less filenames like
      // "clockmein" matching "Clock Me In". Require at least 3 significant
      // tokens so short titles (e.g. "Island Sun") don't falsely match a
      // longer filename that merely contains those words.
      const tokens = t.split(' ').filter((w) => w.length >= 3 && !STOP.has(w));
      if (tokens.length >= 3 && tokens.every((w) => fileNorm.includes(w))) {
        if (t.length > bestLen) { best = p; bestLen = t.length; }
      }
    }
    return best;
  };

  const matched = files.map((f) => ({ ...f, profile: findMatch(f.norm) }));

  const run = async () => {
    if (!files.length) return;
    if (mode === 'tracks' && !releaseId) return toast({ title: 'Pick an album first', variant: 'destructive' });
    setBusy(true);
    try {
      if (mode === 'match') {
        const updates = [];
        const seenIds = new Set();
        const skipped = [];
        const dupes = [];
        for (const f of matched) {
          if (!f.profile) { skipped.push(f.title); continue; }
          if (seenIds.has(f.profile.id)) { dupes.push(f.title); continue; }
          seenIds.add(f.profile.id);
          const { file_url } = await base44.integrations.Core.UploadFile({ file: f.file });
          updates.push({ id: f.profile.id, audio_file: file_url });
        }
        if (updates.length) await base44.entities.SongProfile.bulkUpdate(updates);
        qc.invalidateQueries({ queryKey: ['song-profiles'] });
        const notes = [skipped.length && `${skipped.length} unmatched`, dupes.length && `${dupes.length} duplicate skipped`].filter(Boolean).join(' · ');
        toast({
          title: `Uploaded ${updates.length} audio file${updates.length === 1 ? '' : 's'}`,
          description: notes || undefined,
        });
      } else {
        const base = existingTracks.length;
        const toCreate = [];
        for (let i = 0; i < files.length; i++) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: files[i].file });
          toCreate.push({
            title: files[i].title,
            audio_file: file_url,
            release_id: releaseId,
            track_number: base + i + 1,
          });
        }
        if (toCreate.length) await base44.entities.Track.bulkCreate(toCreate);
        qc.invalidateQueries({ queryKey: ['tracks-admin', releaseId] });
        qc.invalidateQueries({ queryKey: ['tracks'] });
        toast({ title: `Created ${toCreate.length} track${toCreate.length === 1 ? '' : 's'} on the album` });
      }
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
      onDone?.();
    } catch (e) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border border-border p-1 bg-secondary/30">
        <button
          onClick={() => setMode('match')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === 'match' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >Match to songs</button>
        <button
          onClick={() => setMode('tracks')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${mode === 'tracks' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >Create album tracks</button>
      </div>

      {mode === 'tracks' && (
        <div className="space-y-1.5">
          <label className={FL}>Album / Release</label>
          <select value={releaseId} onChange={(e) => setReleaseId(e.target.value)}>
            <option value="">Select an album…</option>
            {releases.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          {releaseId && <p className="text-xs text-muted-foreground">{existingTracks.length} existing track{existingTracks.length === 1 ? '' : 's'} — new files append after them.</p>}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac"
        multiple
        className="hidden"
        onChange={(e) => pickFiles(e.target.files)}
      />
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); pickFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border/50 hover:border-primary/40 bg-secondary/20 hover:bg-primary/5 rounded-xl py-8 px-4 text-center cursor-pointer transition-colors"
      >
        {busy ? <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" /> : <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />}
        <p className="text-sm text-muted-foreground">
          {busy ? 'Uploading…' : 'Click or drag audio files here (mp3, m4a, wav)'}
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{files.length} file{files.length === 1 ? '' : 's'} ready{mode === 'match' ? ' — matched by filename' : ' — will become new tracks'}:</p>
          <div className="space-y-1.5 max-h-64 overflow-auto pr-1">
            {matched.map((f, i) => (
              <div key={i} className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-sm">
                <FileAudio className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate flex-1">{f.title}</span>
                {mode === 'match' ? (
                  f.profile ? (
                    <span className="flex items-center gap-1.5 text-xs shrink-0">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> {f.profile.title}</span>
                      {f.profile.audio_file
                        ? <span className="text-amber-600 dark:text-amber-400" title="Audio already uploaded">has audio</span>
                        : <span className="text-muted-foreground" title="No audio yet">no audio</span>}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 shrink-0"><AlertCircle className="h-3.5 w-3.5" /> no match</span>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">track {(existingTracks.length || 0) + i + 1}</span>
                )}
              </div>
            ))}
          </div>
          <Button onClick={run} disabled={busy || (mode === 'tracks' && !releaseId)} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music className="h-4 w-4" />}
            {mode === 'match' ? `Upload & match ${files.length}` : `Create ${files.length} track${files.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      )}
    </div>
  );
}