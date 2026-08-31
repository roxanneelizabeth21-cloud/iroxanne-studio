import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Confirm + permanently delete a marketing post from the calendar.
export default function DeletePostDialog({ post, open, onOpenChange }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!post) return;
    setBusy(true);
    try {
      await base44.entities.MarketingPost.delete(post.id);
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: 'Post deleted' });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>
            {(post?.hook || post?.caption || '').slice(0, 120) || 'This post'} — this permanently removes it from your calendar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); remove(); }} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {busy ? 'Deleting…' : 'Delete post'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}