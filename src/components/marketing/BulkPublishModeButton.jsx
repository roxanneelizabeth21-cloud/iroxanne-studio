import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Zap, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

// Bulk publish-mode switch — applies to the posts currently shown by the
// calendar filters (Facebook/Instagram only, Posted posts excluded).
export default function BulkPublishModeButton({ posts }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const eligible = posts.filter((p) => ['Facebook', 'Instagram'].includes(p.platform) && p.status !== 'Posted');

  const apply = async (mode) => {
    if (!eligible.length) {
      toast({ title: 'No eligible posts', description: 'Only Facebook/Instagram posts that aren’t posted yet can be switched.' });
      return;
    }
    if (!confirm(`Set ${eligible.length} shown post(s) to ${mode === 'auto' ? 'Auto-publish' : 'Manual publish'}?`)) return;
    setBusy(true);
    try {
      await base44.entities.MarketingPost.bulkUpdate(eligible.map((p) => ({ id: p.id, publish_mode: mode })));
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: `${eligible.length} post(s) set to ${mode}` });
    } catch (e) {
      toast({ title: 'Bulk update failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          Publish mode
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">Applies to {eligible.length} shown FB/IG post(s)</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => apply('auto')}>Set to Auto-publish</DropdownMenuItem>
        <DropdownMenuItem onClick={() => apply('manual')}>Set to Manual</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}