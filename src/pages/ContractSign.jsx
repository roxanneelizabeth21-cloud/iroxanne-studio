import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, ShieldCheck, FileSignature } from 'lucide-react';

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

export default function ContractSign() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = params.get('t') || '';

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signerName, setSignerName] = useState('');
  const [agree, setAgree] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('clientContract', { id, token, action: 'view' });
        const data = res.data || res;
        if (data.error) { setError(data.error); }
        else {
          setContract(data.contract);
          if (['signed', 'deposit_paid', 'active', 'completed'].includes(data.contract?.status)) setSigned(true);
        }
      } catch {
        setError('Could not load this contract.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  const handleSign = async () => {
    if (!signerName.trim()) return;
    setSigning(true);
    setError('');
    try {
      const res = await base44.functions.invoke('clientContract', { id, token, action: 'sign', signerName });
      const data = res.data || res;
      if (data.error) { setError(data.error); }
      else { setSigned(true); setContract(data.contract); }
    } catch {
      setError('Signing failed. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <p className="text-lg font-semibold text-foreground">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">If you copied this link, make sure it's complete.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <FileSignature className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Project Agreement</h1>
            <p className="text-sm text-muted-foreground">iRoxanne Studio</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Prepared for</p>
              <p className="font-medium text-foreground">{contract.client_name || contract.client_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Project</p>
              <p className="font-medium text-foreground">{contract.project_title}</p>
            </div>
          </div>

          {contract.scope_summary && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">Scope of work</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-6">{contract.scope_summary}</p>
            </div>
          )}

          {(contract.line_items?.length > 0 || contract.selected_package) && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">Investment</h2>
              <div className="rounded-xl border border-border overflow-hidden">
                {contract.selected_package && (
                  <div className="flex justify-between px-4 py-3 text-sm bg-secondary/40">
                    <span className="text-foreground font-medium">{contract.selected_package}</span>
                  </div>
                )}
                {contract.line_items?.map((li, i) => (
                  <div key={i} className="flex justify-between px-4 py-3 text-sm border-t border-border/60">
                    <span className="text-muted-foreground">{li.description}</span>
                    <span className="text-foreground font-medium">{money(li.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 border-t border-border bg-secondary/40">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-primary">{money(contract.price_total)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Deposit due at signing</p>
              <p className="text-xl font-bold text-foreground mt-1">{money(contract.deposit_amount)}</p>
            </div>
            {contract.payment_schedule && (
              <div className="rounded-xl bg-secondary/40 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Payment schedule</p>
                <p className="text-sm text-foreground mt-1">{contract.payment_schedule}</p>
              </div>
            )}
          </div>

          {contract.terms && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">Terms &amp; conditions</h2>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-6 max-h-72 overflow-y-auto rounded-xl bg-muted/40 p-4">
                {contract.terms}
              </div>
            </div>
          )}

          {signed ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
              <p className="font-semibold text-foreground">Agreement signed</p>
              <p className="text-sm text-muted-foreground mt-1">
                Signed by {contract.signer_name} on {contract.signed_at ? new Date(contract.signed_at).toLocaleString() : ''}.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                We'll be in touch shortly about your deposit and next steps.
              </p>
            </div>
          ) : (
            <div className="border-t border-border pt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Type your full legal name to sign</label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1.5"
                />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <span className="text-sm text-muted-foreground">
                  I have read and agree to the scope, investment, and terms above. My typed name serves as my electronic signature.
                </span>
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                onClick={handleSign}
                disabled={!signerName.trim() || !agree || signing}
                className="w-full h-11"
              >
                {signing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Sign Agreement
              </Button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} iRoxanne Studio
        </p>
      </div>
    </div>
  );
}