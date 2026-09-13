import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import BrandedPageHeader, { PrintButton, BrandedFooter } from '@/components/BrandedPageHeader';

import SignaturePad from '@/components/SignaturePad';

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
  const [signatureMode,setSignatureMode] = useState('typed');
  const [signatureImage,setSignatureImage] = useState('');
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
      const res = await base44.functions.invoke('clientContract', { id, token, action: 'sign', signerName, consent: agree, signatureMode, signatureImage });
      const data = res.data || res;
      if (data.error) { setError(data.error); }
      else { setSigned(true); setContract(data.contract); }
    } catch (e) {
      setError(e?.message || 'Signing failed. Please try again.');
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
    <div className="studio-surface min-h-screen bg-[#FAF7F0] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <BrandedPageHeader
          title="Project Agreement"
          subtitle={signed ? 'Your signed agreement has been saved.' : 'Review the terms below and sign to get started.'}
          projectTitle={contract.project_title}
          clientName={contract.client_name || contract.client_email}
        />
        <div className="flex justify-end mb-2"><PrintButton /></div>

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
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-6 max-h-72 overflow-y-auto print:max-h-none print:overflow-visible rounded-xl bg-muted/40 p-4">
                {contract.terms}
              </div>
            </div>
          )}

          {contract.target_launch_date && <p className="text-sm">Target launch date: {contract.target_launch_date}</p>}
          {contract.contract_variant === 'rush' && <div><h2 className="font-semibold mb-2">Rush schedule addendum</h2><p className="text-sm whitespace-pre-wrap leading-6">{contract.rush_terms}</p></div>}
          {signed ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
              <p className="font-semibold text-foreground">Agreement signed</p>
              {contract.signature_mode === 'drawn' && contract.signature_image && <img src={contract.signature_image} alt="Recorded signature" className="max-w-full w-72 mx-auto bg-[#FAF7F0] rounded-lg" />}
              <p className="text-sm text-muted-foreground mt-1">
                Signed by {contract.signer_name} on {contract.signed_at ? new Date(contract.signed_at).toLocaleString() : ''}.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                We'll be in touch shortly about your deposit and next steps. You can return to this link to view your agreement.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 print:hidden">
                <Button asChild><Link to="/" replace>Done — return to iRoxanne Studio</Link></Button>
                <PrintButton />
              </div>
            </div>
          ) : (
            <div className="border-t border-border pt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Full legal name</label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1.5"
                />
              </div>
              <fieldset className="space-y-3"><legend className="text-sm font-medium">Signature method</legend><div className="flex gap-5">{['typed','drawn'].map(mode=><label key={mode} className="flex gap-2"><input type="radio" name="signature-method" checked={signatureMode===mode} onChange={()=>{setSignatureMode(mode);setSignatureImage('');}} />{mode==='typed'?'Type my signature':'Draw my signature'}</label>)}</div>{signatureMode==='drawn' && <SignaturePad onChange={setSignatureImage} disabled={signing}/>}</fieldset>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <span className="text-sm text-muted-foreground">
                  I have read and agree to the scope, investment, and terms above. My {signatureMode === 'drawn' ? 'drawn signature' : 'typed name'} serves as my electronic signature.
                </span>
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                onClick={handleSign}
                disabled={!signerName.trim() || !agree || signing || (signatureMode==='drawn' && !signatureImage)}
                className="w-full h-11"
              >
                {signing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Sign Agreement
              </Button>
            </div>
          )}
        </div>
        <BrandedFooter />
      </div>
    </div>
  );
}