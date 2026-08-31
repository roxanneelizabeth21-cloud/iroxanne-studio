import SnippetEditor from '@/components/admin/SnippetEditor';
import AudioPreviewButton from '@/components/marketing/AudioPreviewButton';

// Same preview-clip tool used in the Music module, wired to a post's music
// snippet fields — plus the option to let the app pick the preview itself.
export default function MusicSnippetPicker({ tracks, trackId, start, end, onChange, label = 'Music snippet' }) {
  const track = tracks.find((t) => t.id === trackId) || null;
  const auto = start === '' || start === null || start === undefined;

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>

      <div className="space-y-1.5">
        <label className="text-[11px] text-muted-foreground">Track</label>
        <select
          value={trackId || ''}
          onChange={(e) => onChange({ music_track_id: e.target.value, music_start_seconds: '', music_end_seconds: '' })}
          className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">—</option>
          {tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        {track?.audio_file && <AudioPreviewButton src={track.audio_file} label="Hear it" />}
      </div>

      {track && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How the preview clip is chosen">
            <button
              type="button"
              role="radio"
              aria-checked={auto}
              onClick={() => onChange({ music_start_seconds: '', music_end_seconds: '' })}
              className={`rounded-lg border px-3 py-2 text-sm ${auto ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/60 hover:border-primary/40'}`}
            >
              Let the app pick it
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!auto}
              onClick={() => onChange({ music_start_seconds: 0, music_end_seconds: 30 })}
              className={`rounded-lg border px-3 py-2 text-sm ${!auto ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/60 hover:border-primary/40'}`}
            >
              Choose the clip myself
            </button>
          </div>

          {auto ? (
            <p className="text-[11px] text-muted-foreground">The app uses this song's saved preview, or its first 30 seconds when none is set.</p>
          ) : (
            <SnippetEditor
              key={track.id}
              fullAudioUrl={track.audio_file}
              initialStart={Number(start) || 0}
              initialEnd={Number(end) || 30}
              onSnippetChange={({ snippet_start, snippet_end }) => onChange({ music_start_seconds: snippet_start, music_end_seconds: snippet_end })}
            />
          )}
        </div>
      )}
    </div>
  );
}