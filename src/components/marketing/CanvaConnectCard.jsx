import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Palette, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Starts the Canva PKCE flow and shows whether a connection is live.
export default function CanvaConnectCard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [starting, setStarting] = useState(false);

  const { data: auths = [], isLoading } = useQuery({
    queryKey: ['canva-auth'],
    queryFn: () => base44.entities.CanvaAuth.list('-created_date'),
  });

  const connected = auths.find((a) => a.status === 'connected');
  const lastFailed = !connected && auths.find((a) => a.status === 'failed');

  const connect = async () => {
    setStarting(true);
    try {
      const res = await base44.functions.invoke('canvaConnect', {});
      const url = res?.data?.authorize_url;
      if (!url) throw new Error(res?.data?.error || 'Could not start the Canva connection');
      window.open(url, '_blank', 'noopener');
      toast({ title: 'Approve access in the Canva tab', description: 'Come back here and tap Refresh status when you are done.' });
    } catch (e) {
      toast({ title: 'Canva connection failed to start', description: e.message, variant: 'destructive' });
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div>
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" /> Canva
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Canva account so marketing designs and assets can be pulled into your media library.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isLoading ? (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…</span>
        ) : (
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${connected ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
            {connected ? 'Canva Connected' : 'Not Connected'}
          </span>
        )}
        {lastFailed?.error && <span className="text-xs text-destructive">Last attempt failed: {lastFailed.error}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={connect} disabled={starting} className="gap-2">
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          {connected ? 'Reconnect Canva' : 'Connect Canva'}
        </Button>
        <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ['canva-auth'] })} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh status
        </Button>
      </div>
      <p className="text-xs text-muted-foreground/80">Canva opens in a new tab. Approving access there finishes the connection.</p>
    </div>
  );
}