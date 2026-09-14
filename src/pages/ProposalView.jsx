import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, Check, Clock, Sparkles, XCircle } from 'lucide-react';
import BrandedPageHeader, { PrintButton, BrandedFooter } from '@/components/BrandedPageHeader';

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

export default function ProposalView() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = params.get('t') || '';

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [changeRequest, setChangeRequest] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('clientProposal', { id, token });
        const data = res.data || res;
        if (data.error) setError(data.error);
        else setProposal(data.proposal);
      } catch {
        setError('Could not load this proposal.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  const act = async (action) => {
    setWorking(action);
    setError('');
    try {
      const res = await base44.functions.invoke('clientProposal', {
        id,
        token,
        action,
        change_request: action === 'request_changes' ? changeRequest : undefined,
        decline_reason: action === 'decline' ? declineReason : undefined,
      });
      const data = res.data || res;
      if (data.error) setError(data.error);
      else {
        setProposal(data.proposal);
        setShowDecline(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setWorking('');
    }
  };

  if (loading) {
    return (
      <div className="studio-surface min-h-screen flex items-center justify-center bg-[#FAF7F0]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="studio-surface min-h-screen flex items-center justify-center bg-[#FAF7F0] px-4">
        <div className="max-w-md text-center">
          <p className="text-lg font-semibold text-foreground">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">If you copied this link, make sure it's complete.</p>
        </div>
      </div>
    );
  }

  const accepted = proposal.status === 'accepted';
  const declined = proposal.status === 'declined';
  const changesRequested = proposal.status === 'changes_requested';
  const expiry = proposal.expires_at || proposal.valid_until;
  const expired = expiry && new Date(expiry) <= new Date();
  const settled = accepted || declined || changesRequested || expired;
  const depositPct = typeof proposal.deposit_percent === 'number' ? proposal.deposit_percent : 50;
  const depositAmt = proposal.payment_installments?.[0]?.amount ?? (typeof proposal.price_total === 'number'
    ? Math.round(proposal.price_total * depositPct) / 100
    : null);

  return (
    <div className="studio-surface min-h-screen bg-[#FAF7F0] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <BrandedPageHeader
          title="Project Proposal"
          subtitle="Here's what I'd build for you, what it costs, and how we'd get there."
          projectTitle={proposal.project_title}
          clientName={proposal.business_name || proposal.client_name || proposal.client_email}
        />
        <div className="flex justify-end mb-2"><PrintButton /></div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-7 shadow-sm">
          {proposal.intro_note && (
            <p className="text-[15px] text-foreground/90 whitespace-pre-wrap leading-7 font-serif italic">
              {proposal.intro_note}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Prepared for</p>
              <p className="font-medium text-foreground">{proposal.business_name || proposal.client_name || proposal.client_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Project</p>
              <p className="font-medium text-foreground">{proposal.project_title}</p>
            </div>
          </div>

          {proposal.scope_summary && (
            <div>
              <h2 className="font-serif text-xl text-foreground mb-2">What I'll build</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-7">{proposal.scope_summary}</p>
            </div>
          )}

          {proposal.deliverables?.length > 0 && (
            <div>
              <h2 className="font-serif text-xl text-foreground mb-3">What you get</h2>
              <ul className="space-y-2">
                {proposal.deliverables.map((d, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-foreground/90">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {proposal.saas_replacement_note && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">What this replaces</p>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-6">{proposal.saas_replacement_note}</p>
            </div>
          )}

          <div>
            <h2 className="font-serif text-xl text-foreground mb-2">Investment</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              {proposal.selected_package && (
                <div className="flex justify-between px-4 py-3 text-sm bg-secondary/40">
                  <span className="text-foreground font-medium">{proposal.selected_package} package</span>
                </div>
              )}
              {proposal.line_items?.map((li, i) => (
                <div key={i} className="flex justify-between gap-4 px-4 py-3 text-sm border-t border-border/60">
                  <span className="text-muted-foreground">
                    {li.description}{li.quantity > 1 ? ` × ${li.quantity}` : ''}
                  </span>
                  <span className="text-foreground font-medium shrink-0">{money(li.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3.5 border-t border-border bg-secondary/40">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-primary text-lg">{money(proposal.price_total)}</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {depositAmt != null && (
              <div className="rounded-xl bg-secondary/40 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">To get started</p>
                <p className="text-xl font-bold text-foreground mt-1">{money(depositAmt)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{proposal.payment_installments?.length ? 'Payments follow the dated schedule below' : depositPct+'% deposit, balance on launch'}</p>
              </div>
            )}
            {proposal.timeline_estimate && (
              <div className="rounded-xl bg-secondary/40 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">Timeline</p>
                <p className="text-sm text-foreground mt-1 flex items-start gap-1.5">
                  <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  {proposal.timeline_estimate}
                </p>
              </div>
            )}
          </div>

          {proposal.payment_installments?.length>0 && <section><h2 className="font-serif text-xl mb-3">Payment schedule</h2>{proposal.payment_installments.map((r,i)=><div className="flex flex-wrap justify-between gap-2 border-b py-3 text-sm" key={i}><span>{r.label} · due {r.due_date}</span><strong>{money(r.amount)}</strong></div>)}</section>}

          {proposal.valid_until && !settled && (
            <p className="text-xs text-muted-foreground text-center">
              This proposal is valid through {new Date(expiry).toLocaleString()}.
            </p>
          )}

          {accepted && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
              <p className="font-semibold text-foreground">Proposal accepted</p>
              <p className="text-sm text-muted-foreground mt-1">
                Accepted on {proposal.accepted_at ? new Date(proposal.accepted_at).toLocaleString() : ''}.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Your project agreement is on its way for signature — watch your inbox.
              </p>
            </div>
          )}

          {declined && (
            <div className="rounded-xl border border-border bg-muted/40 p-6 text-center">
              <XCircle className="h-9 w-9 mx-auto text-muted-foreground mb-2" />
              <p className="font-semibold text-foreground">Proposal declined</p>
              <p className="text-xs text-muted-foreground mt-2">
                If you'd like to revisit this, just reply to my email — no hard feelings either way.
              </p>
            </div>
          )}

          {changesRequested && <div className="rounded-xl border border-border p-5"><h2 className="font-semibold">Your change request is saved</h2><p className="mt-2 whitespace-pre-wrap">{proposal.change_request}</p><p className="text-sm mt-3">I'll review it and send a revised proposal.</p></div>}
          {expired && !accepted && !declined && <p role="status">This proposal has expired. Please contact me for an updated proposal.</p>}
          {!settled && (
            <div className="border-t border-border pt-6 space-y-3">
              {error && <p className="text-sm text-destructive">{error}</p>}
              {showDecline ? (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Anything you'd like me to know? (optional)
                  </label>
                  <Textarea
                    rows={3}
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Budget, timing, scope — whatever it is, it helps me."
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowDecline(false)}>
                      Back
                    </Button>
                    <Button variant="outline" className="flex-1" disabled={working === 'decline'} onClick={() => act('decline')}>
                      {working === 'decline' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Confirm decline
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button className="w-full h-12 text-base" disabled={!!working} onClick={() => act('accept')}>
                    {working === 'accept' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Accept this proposal
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Accepting doesn't charge you anything. I'll send your agreement to sign, then the deposit.
                  </p>
                  <div className="space-y-2 pt-4">
                    <label htmlFor="proposal-changes" className="text-sm font-medium">Need something adjusted?</label>
                    <Textarea id="proposal-changes" value={changeRequest} onChange={(e) => setChangeRequest(e.target.value)} maxLength={2000} placeholder="Describe any changes to scope, timing, or pricing." />
                    <Button variant="outline" disabled={!!working || !changeRequest.trim()} onClick={() => act('request_changes')}>Request changes</Button>
                  </div>
                  <button
                    onClick={() => setShowDecline(true)}
                    className="w-full text-xs text-muted-foreground underline hover:text-foreground pt-1"
                  >
                    This isn't the right fit
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <BrandedFooter />
      </div>
    </div>
  );
}
