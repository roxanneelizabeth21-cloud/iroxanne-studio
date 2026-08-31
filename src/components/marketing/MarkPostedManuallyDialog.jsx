import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { SOCIAL_PLATFORMS, getPlatform, isHttpsUrl } from '@/lib/socialPlatforms';

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toTimeString().slice(0, 5);

// Owner-confirmed record of a posting this app cannot verify (TikTok, YouTube,
// or a manual post on Instagram/Facebook). Requires an explicit confirmation
// tick — opening a profile link never marks anything posted.
export default function MarkPostedManuallyDialog({ post, defaultPlatformId, open, onOpenChange }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [platformId, setPlatformId] = useState(defaultPlatformId || 'tiktok');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState(now());
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlatformId(defaultPlatformId || 'tiktok');
    setDate(today());
    setTime(now());
    setUrl('');
    setNotes('');
    setConfirmed(false);
  }, [open, defaultPlatformId]);

  if (!post) return null;
  const cfg = getPlatform(platformId);
  const urlValid = !url.trim() || isHttpsUrl(url);

  const save = async () => {
    if (!cfg || !confirmed || !urlValid) return;
    setSaving(true);
    try {
      const postedAt = new Date(`${date}T${time || '00:00'}:00`).toISOString();
      const existing = Array.isArray(post.manual_posts) ? post.manual_posts : [];
      await base44.entities.MarketingPost.update(post.id, {
        manual_posts: [...existing, { platform: cfg.entityValue, posted_at: postedAt, post_url: url.trim(), notes: notes.trim() }],
        status: 'Posted',
        posted_at: postedAt,
      });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: `Recorded as posted on ${cfg.label}`, description: 'Publishing connections were not used or changed.' });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Could not save', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as posted manually</DialogTitle>
          <DialogDescription>
            Use this only after you have actually posted it yourself. This app can't verify posts made outside it, so this is your own record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide" htmlFor="mp-platform">Platform</label>
            <select id="mp-platform" value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
              {SOCIAL_PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide" htmlFor="mp-date">Posted date</label>
              <Input id="mp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide" htmlFor="mp-time">Posted time</label>
              <Input id="mp-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide" htmlFor="mp-url">Public post URL (optional)</label>
            <Input id="mp-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            {!urlValid && <p className="text-xs text-destructive">Use a full https:// link.</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide" htmlFor="mp-notes">Notes (optional)</label>
            <Textarea id="mp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
            I confirm I posted this on {cfg?.label} myself.
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={save} disabled={!confirmed || !urlValid || saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save manual posting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}