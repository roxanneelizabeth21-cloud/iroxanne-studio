import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Receipt, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

const DEPOSIT_STYLES = {
  pending: 'bg-amber-500/10 text-amber-700',
  paid: 'bg-green-500/10 text-green-700',
  waived: 'bg-secondary text-muted-foreground',
};

export default function InvoicesAdminPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Invoice.list('-created_date', 100).catch(() => []);
      setInvoices(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markDepositPaid = async (inv) => {
    try {
      const balanceDone = inv.balance_amount <= 0 || inv.balance_status === 'paid' || inv.balance_status === 'waived';
      await base44.entities.Invoice.update(inv.id, {
        deposit_status: 'paid',
        deposit_paid_at: new Date().toISOString(),
        deposit_method: 'offline',
        status: balanceDone ? 'paid' : 'deposit_paid',
      });
      toast({ title: 'Deposit marked paid' });
      await load();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const markBalancePaid = async (inv) => {
    try {
      const depositDone = inv.deposit_status === 'paid' || inv.deposit_status === 'waived';
      await base44.entities.Invoice.update(inv.id, {
        balance_status: 'paid',
        balance_paid_amount: inv.balance_amount,
        status: depositDone ? 'paid' : 'deposit_paid',
      });
      toast({ title: 'Balance marked paid' });
      await load();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2">
        <Receipt className="h-6 w-6 text-primary" /> Invoices
      </h1>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && invoices.length === 0 && (
          <p className="text-sm text-muted-foreground">No invoices yet. They're created automatically when a client signs a contract.</p>
        )}
        {invoices.map((inv) => {
          const balanceDone = inv.balance_amount <= 0 || inv.balance_status === 'paid' || inv.balance_status === 'waived';
          const depositOpen = inv.deposit_status === 'pending';
          const balanceOpen = inv.balance_amount > 0 && inv.balance_status !== 'paid' && inv.balance_status !== 'waived';
          return (
            <div key={inv.id} className="rounded-xl bg-secondary/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{inv.project_title}</p>
                  <p className="text-xs text-muted-foreground truncate">{inv.client_name || inv.client_email}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{inv.status}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm items-start">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold">{money(inv.amount_total)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deposit</p>
                  <p className="font-semibold">{money(inv.deposit_amount)}</p>
                  <span className={`mt-0.5 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${DEPOSIT_STYLES[inv.deposit_status] || ''}`}>{inv.deposit_status}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-semibold">{money(inv.balance_amount)}</p>
                  <span className="mt-0.5 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{inv.balance_status}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {depositOpen && (
                    <Button size="sm" variant="outline" onClick={() => markDepositPaid(inv)} className="gap-1 h-7 text-xs">
                      <CheckCircle2 className="h-3 w-3" /> Deposit paid
                    </Button>
                  )}
                  {balanceOpen && (
                    <Button size="sm" variant="outline" onClick={() => markBalancePaid(inv)} className="gap-1 h-7 text-xs">
                      <CheckCircle2 className="h-3 w-3" /> Balance paid
                    </Button>
                  )}
                  {inv.deposit_status !== 'pending' && !balanceOpen && (
                    <p className="text-xs text-green-600">Settled</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Online payments (Stripe) aren't connected yet — use “Deposit paid” to record a payment you collected offline (Square, cash, transfer). When Stripe is wired, a Pay Deposit button will appear on the client's signed agreement and update these invoices automatically.
      </p>
    </div>
  );
}