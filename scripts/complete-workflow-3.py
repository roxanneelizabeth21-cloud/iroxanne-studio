from pathlib import Path
import json
for file,props in [('Payment',{'request_id':{'type':'string'}}),('Invoice',{'deposit_paid_amount':{'type':'number','default':0},'legacy_deposit_cents':{'type':'number'},'legacy_balance_cents':{'type':'number'}})]:
 p=Path('base44/entities/'+file+'.jsonc');s=json.loads(p.read_text());s['properties'].update(props);p.write_text(json.dumps(s,indent=2))
p=Path('base44/functions/sendInvoice/entry.ts');s=p.read_text().replace("import { requireAdmin }","import { paymentSummary } from '../../shared/paymentSummary.ts';\nimport { requireAdmin }")
a=s.index("    const total =");b=s.index("\n    // Payment instructions",a)
s=s[:a]+"""    if (!['deposit','balance','statement'].includes(which)) return Response.json({error:'Invalid request type'},{status:400});
    if (invoice.status === 'cancelled') return Response.json({error:'This invoice is cancelled'},{status:409});
    const payments = await base44.entities.Payment.filter({invoice_id}, '-created_date', 1000);
    const summary = paymentSummary(invoice,payments);
    const total = summary.total;
    const deposit = summary.deposit;
    const paidSoFar = summary.paid;
    const outstanding = summary.outstanding;
""" + s[b:]
s=s.replace("const payLink: string = settings?.payment_link || '';","const rawLink = settings?.payment_link || '';\n    const payLink = /^https:\\/\\//i.test(rawLink) ? rawLink : '';")
s=s.replace('amountDue = depositPaid ? 0 : deposit;','amountDue = summary.depositOutstanding;').replace('amountDue = Math.max(total - deposit - balancePaidAmt, 0);','amountDue = summary.balanceOutstanding;')
p.write_text(s)
p=Path('src/pages/admin/ContractsAdminPage.jsx');s=p.read_text()
a=s.index('    const token =');b=s.index('\n  const saveSettings',a)
s=s[:a]+"""    try {
      const result = await base44.functions.invoke('sendContract', { contract_id: contract.id });
      const data = result.data || result;
      if (data.error) throw new Error(data.error);
      await navigator.clipboard.writeText(data.link).catch(() => {});
      toast({ title: data.sent ? 'Agreement sent' : 'Email failed; link copied', description: data.sent ? contract.client_email : 'You can retry sending.' });
      await load();
    } catch (e) { toast({ title: 'Could not send agreement', description: e.message, variant: 'destructive' }); }
  };
""" + s[b:]
s=s.replace('      {/* Packages */}',"""      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Proposal validity (days from sending)</Label><Input type="number" min="1" value={s.proposal_valid_days ?? 3} onChange={e=>update('proposal_valid_days',Number(e.target.value))}/><p className="text-xs text-muted-foreground">3 days = 72 hours.</p></div>
        <div className="space-y-1.5"><Label>Invoice due days</Label><Input type="number" min="1" value={s.invoice_due_days ?? 7} onChange={e=>update('invoice_due_days',Number(e.target.value))}/></div>
      </div>
      <div className="space-y-1.5"><Label>Payment instructions shown in emails</Label><Textarea value={s.payment_instructions || ''} onChange={e=>update('payment_instructions',e.target.value)} placeholder="Tell clients how to arrange their deposit or balance payment." /></div>
      {/* Packages */}""")
p.write_text(s)
p=Path('src/components/admin/AdminLayout.jsx');s=p.read_text();a="  const showAdminBack = location.pathname !== '/admin';";s=s.replace(a,a+"""
  useEffect(() => {
    document.body.classList.toggle('studio-admin-theme', location.pathname.startsWith('/admin'));
    return () => document.body.classList.remove('studio-admin-theme');
  }, [location.pathname]);
""");p.write_text(s)
p=Path('src/index.css');s=p.read_text()+"""
/* Studio administration and client proposals share the approved neutral palette. */
body.studio-admin-theme, .studio-surface {
  --background: 42 50% 96%; --foreground: 294 31% 15%;
  --card: 40 38% 99%; --card-foreground: 294 31% 15%;
  --popover: 40 38% 99%; --popover-foreground: 294 31% 15%;
  --primary: 294 31% 15%; --primary-foreground: 42 50% 96%;
  --secondary: 39 27% 91%; --secondary-foreground: 294 31% 15%;
  --muted: 39 22% 92%; --muted-foreground: 287 12% 39%;
  --accent: 42 39% 85%; --accent-foreground: 294 31% 15%;
  --border: 39 23% 83%; --input: 39 23% 83%; --ring: 42 40% 48%;
  --sidebar-background: 40 38% 94%; --sidebar-foreground: 294 31% 15%;
  color: hsl(var(--foreground)); background: hsl(var(--background));
}
""";p.write_text(s)
p=Path('src/pages/ProposalView.jsx');s=p.read_text().replace('className="min-h-screen','className="studio-surface min-h-screen');p.write_text(s)
print('Invoice accounting, admin settings and palette updated')
