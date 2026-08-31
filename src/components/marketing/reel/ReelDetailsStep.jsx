import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

// The words for the reel. Everything here is plain text the owner will use
// while assembling the video in CapCut or Canva.
export default function ReelDetailsStep({ form, set }) {
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
      <div className="space-y-1.5">
        <label className={FL}>Hashtags</label>
        <Input value={form.hashtags} onChange={(e) => set('hashtags', e.target.value)} placeholder="#customapps #smallbusiness #nocode" />
      </div>
    </div>
  );
}