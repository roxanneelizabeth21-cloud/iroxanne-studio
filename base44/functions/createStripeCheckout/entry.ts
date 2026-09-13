import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { paymentSummary } from '../../shared/paymentSummary.ts';
import { studioUrl } from '../../shared/studioUrl.ts';

// Token-verified (no login) endpoint that creates a Stripe Checkout session
// for a specific invoice charge: deposit, a single milestone, or the balance.
// Returns { url } — the frontend redirects the client there.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { id, token, kind, milestone_index } = body || {};
    if (!id || !token) return Response.json({ error: 'Missing invoice id or token' }, { status: 400 });

    let invoice: any;
    try {
      invoice = await base44.asServiceRole.entities.Invoice.get(id);
    } catch {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (invoice.access_token !== token) return Response.json({ error: 'Invalid or expired link' }, { status: 403 });
    if (invoice.status === 'cancelled') return Response.json({ error: 'This invoice is cancelled' }, { status: 409 });
    if (!invoice.client_email) return Response.json({ error: 'No client email on file for this invoice' }, { status: 400 });

    if (!['deposit', 'milestone', 'balance'].includes(kind))
      return Response.json({ error: 'Invalid payment kind' }, { status: 400 });

    const payments = await base44.asServiceRole.entities.Payment.filter({ invoice_id: id }, '-created_date', 1000);
    const summary = paymentSummary(invoice, payments);

    let amount: number;
    let label: string;
    let milestoneIndex: number | null = null;
    if (kind === 'deposit') {
      amount = summary.depositOutstanding;
      label = `Deposit — ${invoice.project_title}`;
      if (amount <= 0) return Response.json({ error: 'Deposit is already paid' }, { status: 409 });
    } else if (kind === 'milestone') {
      const idx = Number(milestone_index);
      const m = Array.isArray(invoice.milestones) ? invoice.milestones[idx] : null;
      if (!m) return Response.json({ error: 'Milestone not found' }, { status: 404 });
      if (m.status === 'paid') return Response.json({ error: 'That milestone is already paid' }, { status: 409 });
      amount = Number(m.amount);
      label = `${m.label} — ${invoice.project_title}`;
      milestoneIndex = idx;
    } else {
      amount = summary.balanceOutstanding;
      label = `Balance — ${invoice.project_title}`;
      if (amount <= 0) return Response.json({ error: 'Balance is already paid' }, { status: 409 });
    }

    const secret = secrets.get('STRIPE_SECRET_KEY');
    if (!secret) return Response.json({ error: 'Payments are not configured yet' }, { status: 503 });
    const appId = process.env.BASE44_APP_ID || '';

    const origin = studioUrl(req);
    const successUrl = `${origin}/invoice/${id}?t=${token}&status=success`;
    const cancelUrl = `${origin}/invoice/${id}?t=${token}&status=cancelled`;

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('customer_email', invoice.client_email);
    params.append('client_reference_id', id);
    params.append('line_items[0][quantity]', '1');
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', label.slice(0, 200));
    params.append('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100)));
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('metadata[base44_app_id]', appId);
    params.append('metadata[invoice_id]', id);
    params.append('metadata[kind]', kind);
    params.append('metadata[milestone_index]', milestoneIndex == null ? '' : String(milestoneIndex));
    params.append('metadata[project_title]', String(invoice.project_title || '').slice(0, 200));

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Stripe-Version': '2025-10-29.clover',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: params.toString(),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.log('stripe checkout failed', data?.error?.message);
      return Response.json({ error: data?.error?.message || 'Could not start checkout' }, { status: 502 });
    }
    return Response.json({ url: data.url, session_id: data.id });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}