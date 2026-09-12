import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { paymentSummary } from '../../shared/paymentSummary.ts';

// Public, token-verified access for a client to view their invoice and
// payment status. No user auth — the access_token is the credential.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { id, token, action } = body || {};
    if (!id || !token) return Response.json({ error: 'Missing invoice id or token' }, { status: 400 });

    let invoice: any;
    try {
      invoice = await base44.asServiceRole.entities.Invoice.get(id);
    } catch {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (invoice.access_token !== token) return Response.json({ error: 'Invalid or expired link' }, { status: 403 });

    const payments = await base44.asServiceRole.entities.Payment.filter({ invoice_id: id }, '-created_date', 1000);
    const summary = paymentSummary(invoice, payments);

    // Only expose what the client needs to see.
    const safe = {
      id: invoice.id,
      client_name: invoice.client_name,
      client_email: invoice.client_email,
      project_title: invoice.project_title,
      amount_total: invoice.amount_total,
      deposit_amount: invoice.deposit_amount,
      deposit_status: invoice.deposit_status,
      balance_amount: invoice.balance_amount,
      balance_status: invoice.balance_status,
      milestones: invoice.milestones || [],
      due_date: invoice.due_date,
      status: invoice.status,
      last_sent_at: invoice.last_sent_at,
    };

    const ledger = payments.map((p: any) => ({
      amount: p.amount,
      kind: p.kind,
      method: p.method,
      reference: p.reference,
      paid_at: p.paid_at,
    }));

    return Response.json({
      invoice: safe,
      summary,
      payments: ledger,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}