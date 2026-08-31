import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  runMarketingBackGuard, hasSafeInAppHistory, MARKETING_HOME,
} from '@/lib/marketingBackNav';
import { previousVisit, popCurrentVisit } from '@/lib/appVisitHistory';

// Small, secondary back arrow for the Marketing page header. It never leaves the
// app: with no safe in-app history it falls back to the Marketing Hub.
export default function MarketingBackButton() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const go = async () => {
    setBusy(true);
    const res = await runMarketingBackGuard();
    setBusy(false);
    if (!res.ok) { setFailed(true); return; }
    setFailed(false);
    if (res.message) toast({ title: res.message });
    const prev = previousVisit();
    if (prev) {
      popCurrentVisit();
      navigate(prev);
    } else if (hasSafeInAppHistory()) {
      navigate(-1);
    } else {
      navigate(MARKETING_HOME);
    }
  };

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        aria-label="Go back"
        title="Go back"
        className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
      </button>

      {failed && (
        <div role="alert" className="absolute left-4 right-4 z-30 mt-2 max-w-md rounded-xl border border-destructive/40 bg-card p-3 shadow-lg">
          <p className="text-sm font-medium">We couldn’t save your Draft. Try again before leaving.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={go}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setFailed(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Stay Here
            </button>
          </div>
        </div>
      )}
    </div>
  );
}