import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, CreditCard, Lock } from 'lucide-react';
import BrandedPageHeader, { BrandedFooter } from '@/components/BrandedPageHeader';

import PaymentPlanDisplay from '@/components/PaymentPlanDisplay';

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

export default function InvoicePay() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = params.get('t') || '';
  const status = params.get('status');

  const [invoice, setInvoice] = useState(null);
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState(
    status === 'COMPLETED' ? 'Checking payment status…' :
    status === 'CANCELED' ? 'Checkout was cancelled. Completed payments are checked automatically.' : ''
  );

  const load = async () => {
    try {
      const res = await base44.functions.invoke('clientInvoice', { id, token, action: 'view' });
      const data = res.data || res;
      if (data.error) { setError(data.error); }
      else {
        setInvoice(data.invoice);
        setSummary(data.summary);
        setPayments(data.payments || []);
      }
    } catch {
      setError('Could not load this invoice.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, token]);

  // When Square redirects back with status=COMPLETED, verify the payment
  // server-side and record it in the invoice ledger.
  useEffect(() => {
    if (status !== 'COMPLETED') return;
    const tid = params.get('transaction_id');
    const oid = params.get('order_id');
    if (!tid && !oid) return;
    let cancelled = false;
    (async () => {
      setVerifying(true);
      try {
        const res = await base44.functions.invoke('verifySquarePayment', { id, token, transaction_id: tid, order_id: oid });
        const data = res.data || res;
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setNotice('');
        } else {
          setNotice(data.pending ? 'Your payment is being checked automatically. Please allow a few minutes, then refresh. You can safely close this page.' : 'Payment received — thank you! Your balance is updated below.');
          await load();
          // Clean Square's query params from the URL so a refresh doesn't re-trigger verification.
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('status');
          cleanUrl.searchParams.delete('transaction_id');
          cleanUrl.searchParams.delete('order_id');
          window.history.replaceState({}, '', cleanUrl);
        }
      } catch {
        if (!cancelled) {
          setError('Could not verify your payment. If you were charged, please contact us.');
          setNotice('');
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    })();
    return () => { cancelled = true; };
  }, [status, id, token]);

  const pay = async (kind, milestoneIndex) => {
    // Hosted checkout must run in a top-level window, not inside the builder iframe.
    if (window.self !== window.top) {
      setError('Checkout opens in a secure payment page and only works from the published app. Open this link directly in your browser.');
      return;
    }
    const key = `square_${kind}${milestoneIndex != null ? `_${milestoneIndex}` : ''}`;
    setRedirecting(key);
    setError('');
    try {
      const res = await base44.functions.invoke('createSquareCheckout', { id, token, kind, milestone_index: milestoneIndex });
      const data = res.data || res;
      if (data.error) { setError(data.error); }
      else if (data.url) { window.location.href = data.url; return; }
    } catch {
      setError('Could not start checkout. Please try again.');
    } finally {
      setRedirecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <p className="text-lg font-semibold text-foreground">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">If you copied this link, make sure it's complete.</p>
        </div>
      </div>
    );
  }

  const depositRemaining = summary?.depositOutstanding ?? 0;
  const balanceRemaining = summary?.balanceOutstanding ?? 0;
  const fullyPaid = summary?.outstanding <= 0.001;

  return (
    <div className="studio-surface min-h-screen bg-[#FAF7F0] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <BrandedPageHeader
          title="Invoice & Payments"
          subtitle="Pay your deposit, milestones, or balance securely online."
          projectTitle={invoice.project_title}
          clientName={invoice.client_name || invoice.client_email}
        />

        {verifying && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying your payment…
          </div>
        )}
        {notice && !verifying && (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-700">
            {notice}
          </div>
        )}
        {error && <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Prepared for</p>
              <p className="font-medium text-foreground">{invoice.client_name || invoice.client_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Project</p>
              <p className="font-medium text-foreground">{invoice.project_title}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Project total</p>
              <p className="text-xl font-bold text-foreground mt-1">{money(invoice.amount_total)}</p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Paid to date</p>
              <p className="text-xl font-bold text-foreground mt-1">{money(summary?.paid)}</p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Outstanding</p>
              <p className="text-xl font-bold text-primary mt-1">{money(summary?.outstanding)}</p>
            </div>
          </div>

          {invoice.payment_installments?.length>0 ? <div className="space-y-4">
            <PaymentPlanDisplay invoice={invoice}/>
            {invoice.status==='cancelled' ? <p>This invoice has been cancelled. Please contact iRoxanne Studio.</p> : invoice.square_needs_review ? <p role="alert">This payment plan needs a review. Please contact iRoxanne Studio before making another payment.</p> : fullyPaid ? <p className="font-semibold">Thank you — your payment plan is paid in full.</p> : invoice.square_public_url ? <Button asChild><a href={invoice.square_public_url}>View and pay securely with Square</a></Button> : <p className="text-sm text-muted-foreground">Your payment plan is being prepared. You'll receive an email from Square when it is ready.</p>}
            <Button variant="outline" onClick={load}>Refresh payment status</Button>
          </div> : fullyPaid ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
              <p className="font-semibold text-foreground">This invoice is paid in full</p>
              <p className="text-sm text-muted-foreground mt-1">Thank you! Your project is all squared away.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Pay online</h2>
              {depositRemaining > 0 && (
                <PayRow
                  label="Deposit"
                  amount={depositRemaining}
                  status={invoice.deposit_status}
                  loading={redirecting === 'square_deposit'}
                  onPay={() => pay('deposit', null)}
                />
              )}
              {(invoice.milestones || []).map((m, i) => (
                <PayRow
                  key={i}
                  label={m.label}
                  amount={m.amount}
                  status={m.status}
                  dueDate={m.due_date}
                  loading={redirecting === `square_milestone_${i}`}
                  onPay={() => pay('milestone', i)}
                />
              ))}
              {balanceRemaining > 0 && (invoice.milestones || []).length === 0 && (
                <PayRow
                  label="Balance"
                  amount={balanceRemaining}
                  status={invoice.balance_status}
                  loading={redirecting === 'square_balance'}
                  onPay={() => pay('balance', null)}
                />
              )}
              {balanceRemaining > 0 && (invoice.milestones || []).length > 0 && (
                <PayRow
                  label="Remaining balance"
                  amount={balanceRemaining}
                  status={invoice.balance_status}
                  loading={redirecting === 'square_balance'}
                  onPay={() => pay('balance', null)}
                />
              )}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Lock className="h-3 w-3" />
                Secure checkout powered by Square.
              </p>
            </div>
          )}

          {payments.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">Payment history</h2>
              <div className="rounded-xl border border-border overflow-hidden">
                {payments.map((p, i) => (
                  <div key={i} className="flex justify-between px-4 py-3 text-sm border-t border-border/60 first:border-t-0">
                    <span className="text-muted-foreground">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : ''} · {p.kind} · {p.method}
                    </span>
                    <span className="font-medium text-foreground">{money(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <BrandedFooter />
      </div>
    </div>
  );
}

function PayRow({ label, amount, status, dueDate, loading, onPay }) {
  const paid = status === 'paid' || status === 'waived';
  const busy = loading;
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {paid ? `${status}` : dueDate ? `Due ${dueDate}` : 'Due now'}
          </p>
        </div>
        <span className="font-bold text-foreground">{money(amount)}</span>
      </div>
      {paid ? (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 className="h-4 w-4" /> Paid</span>
      ) : (
        <div className="mt-3 grid gap-2">
          <Button onClick={onPay} disabled={busy} className="gap-1.5 w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Pay with Square
          </Button>
        </div>
      )}
    </div>
  );
}