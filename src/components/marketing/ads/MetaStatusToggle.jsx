import { useState } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// Pause or resume anything in Meta (a campaign or a single ad) from here.
export default function MetaStatusToggle({ id, status, label = 'campaign', onChanged }) {
  const [busy, setBusy] = useState(false);
  const running = status === 'ACTIVE';
  const next = running ? 'PAUSED' : 'ACTIVE';

  const handleClick = async () => {
    setBusy(true);
    const res = await base44.functions.invoke('metaAdsSetStatus', { id, status: next });
    setBusy(false);
    if (!res.data?.ok) {
      toast({ title: `Could not update this ${label}`, description: res.data?.error || 'Meta refused the change.' });
      return;
    }
    toast({ title: running ? `Paused this ${label}` : `This ${label} is running again` });
    onChanged?.();
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={running ? 'outline' : 'default'}
      disabled={busy}
      onClick={handleClick}
      className="gap-1.5 shrink-0"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      {running ? 'Pause' : 'Resume'}
    </Button>
  );
}