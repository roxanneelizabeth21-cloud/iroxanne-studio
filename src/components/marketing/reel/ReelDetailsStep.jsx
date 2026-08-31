import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

// The words and the music section for the reel. Everything here is plain text
// the owner will use while assembling the video in CapCut or Canva.
export default function ReelDetailsStep({ form, set, tracks }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={FL}>Opening hook</label>
        <Input value={form.hook} onChange={(e) => set('hook', e.target.value)} placeholder="The first line on screen" />
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Caption</label>
        <Textarea rows={4} value={form.caption} onChange={(e) => set('caption', e.target.value)} placeholder="What you'll post with the reel" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className={FL}>Song section</label>
          <select value={form.musicTrackId} onChange={(e) => set('musicTrackId', e.target.value)} aria-label="Song section">
            <option value="">No specific track</option>
            {tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Starts at (sec)</label>
          <Input type="number" min="0" value={form.musicStart} onChange={(e) => set('musicStart', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Ends at (sec)</label>
          <Input type="number" min="0" value={form.musicEnd} onChange={(e) => set('musicEnd', e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={FL}>Hashtags</label>
        <Input value={form.hashtags} onChange={(e) => set('hashtags', e.target.value)} placeholder="#countrysoul #newmusic" />
      </div>
    </div>
  );
}