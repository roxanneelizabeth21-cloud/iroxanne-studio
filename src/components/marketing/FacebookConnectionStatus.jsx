import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import FacebookPageConnectForm from '@/components/marketing/FacebookPageConnectForm';

// Facebook publishing is only "connected" once a Page with content-creation
// access comes back from Facebook — this card shows the real reason when not.
export default function FacebookConnectionStatus() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const check = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('checkFacebookConnection', {});
      setResult(res?.data || null);
    } catch (e) {
      setResult({ ok: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-[0.5px] border-border bg-card/60 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Facebook publishing</p>
        <Button variant="outline" size="sm" onClick={check} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {loading ? 'Checking…' : 'Check connection'}
        </Button>
      </div>

      {result && (
        <div className={`flex items-start gap-2 text-xs ${result.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}>
          {result.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
          <span>{result.message}</span>
        </div>
      )}

      {result && !result.ok && (
        <>
          <p className="text-[11px] text-muted-foreground">
            Paste the Page ID shown in Meta Business settings to connect the Page directly.
          </p>
          <FacebookPageConnectForm onConnected={check} />
        </>
      )}
    </div>
  );
}