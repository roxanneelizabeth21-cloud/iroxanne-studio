import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { isLocked } from '@/lib/postValidation';
import DateField from '@/components/marketing/DateField';

// Keyboard/mobile-friendly rescheduling — the drag-and-drop alternative.
export default function MovePostDialog({ post, open, onOpenChange, onMove, timezone }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDate(post?.scheduled_date || '');
    setTime(post?.scheduled_time || '');
  }, [post?.id, post?.scheduled_date, post?.scheduled_time]);

  if (!post) return null;
  const locked = isLocked(post);

  const submit = async () => {
    setBusy(true);
    try {
      await onMove({ scheduled_date: date || '', scheduled_time: time || '' });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Move post</DialogTitle>
          <DialogDescription>
            {locked
              ? 'This post is published — its calendar position is locked.'
              : `Scheduled in ${timezone}. Clearing the date returns it to the Unscheduled queue.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="move-date" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</label>
            <DateField id="move-date" value={date} onChange={setDate} disabled={locked} placeholder="Unscheduled" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="move-time" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</label>
            <Input id="move-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={locked} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={submit} disabled={locked || busy} className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Move post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}