import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { paymentSummary } from '../../shared/paymentSummary.ts';
import { studioUrl } from '../../shared/studioUrl.ts';

// Token-verified (no login) endpoint that creates a Square Online Checkout
// payment link for a specific invoice charge: deposit, a single milestone,
// or the balance. Returns { url } — the frontend redirects the client there.
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

    if (!['deposit', 'milestone', 'balance', 'project'].includes(kind))
      return Response.json({ error: 'Invalid payment kind' }, { status: 400 });

    if(invoice.payment_installments?.length || invoice.square_schedule_enabled) return Response.json({error:'Use the Square invoice payment plan link. Separate checkout is disabled for this invoice.'},{status:409});
    const payments = await base44.asServiceRole.entities.Payment.filter({ invoice_id: id }, '-created_date', 1000);
    const summary = paymentSummary(invoice, payments);

    let amount: number;
    let label: string;
    let milestoneIndex: number | null = null;
    if (kind === 'project') {
      const requested = body.amount == null ? summary.outstanding : Number(body.amount);
      const cents = Math.round(requested * 100);
      if (!Number.isFinite(requested) || !Number.isSafeInteger(cents) || cents < 100 || Math.abs(requested * 100 - cents) > 0.000001 || cents > Math.round(summary.outstanding * 100)) {
        return Response.json({error:'Enter an amount of at least $1.00, no more than the outstanding balance, with at most two decimal places.'},{status:400});
      }
      amount = cents / 100;
      label = `Project payment — ${invoice.project_title}`;
    } else if (kind === 'deposit') {
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

    if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100))) return Response.json({error:'Invalid payment amount'}, {status:400});
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('square');
    if (!accessToken) return Response.json({ error: 'Square payments are not configured yet' }, { status: 503 });

    // Fetch the merchant's default location ID (required by quick_pay).
    const locResp = await fetch('https://connect.squareup.com/v2/locations', {
      headers: { Authorization: `Bearer ${accessToken}`, 'Square-Version': '2025-08-21' },
    });
    const locData = await locResp.json();
    const locationId = locData?.locations?.find((l: any) => l.status === 'ACTIVE')?.id || locData?.locations?.[0]?.id;
    if (!locationId) return Response.json({ error: 'No active Square location found' }, { status: 503 });

    const origin = studioUrl(req);
    const redirectUrl = `${origin}/invoice/${id}?t=${token}`;

    const checkoutBody: any = {
      idempotency_key: crypto.randomUUID(),
      description: `${label} (Invoice ${id})`.slice(0, 200),
      quick_pay: {
        name: label.slice(0, 100),
        price_money: { amount: Math.round(amount * 100), currency: 'USD' },
        location_id: locationId,
      },
      checkout_options: {
        redirect_url: redirectUrl,
        ask_for_shipping_address: false,
        allow_tipping: false,
      },
      payment_note: `invoice:${id}|kind:${kind}${milestoneIndex != null ? `|mi:${milestoneIndex}` : ''}`.slice(0, 500),
    };

    // Pre-populate buyer email only if it's a real address (Square rejects example/test domains).
    if (invoice.client_email && !invoice.client_email.includes('example.com')) {
      checkoutBody.pre_populated_data = { buyer_email: invoice.client_email };
    }

    const resp = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Square-Version': '2025-08-21',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutBody),
    });
    const data = await resp.json();
    if (!resp.ok) {
      const sqErr = data?.errors?.[0];
      console.log('square checkout failed', JSON.stringify(sqErr));
      return Response.json({ error: sqErr ? `${sqErr.detail || sqErr.code}${sqErr.field ? ` (${sqErr.field})` : ''}` : 'Could not start checkout' }, { status: 502 });
    }

    const link = data.payment_link;
    if (!link?.order_id || !(link.url || link.long_url)) throw new Error('Square did not return a bound checkout');
    await base44.asServiceRole.entities.SquareCheckout.create({invoice_id:id,order_id:link.order_id,location_id:locationId,kind,currency:'USD',expected_amount_cents:Math.round(amount*100),...(milestoneIndex != null ? {milestone_index:milestoneIndex} : {}),status:'pending',last_checked_at:new Date().toISOString()});
    return Response.json({ url: link.url || link.long_url });
  } catch (error) {
    console.log('createSquareCheckout error', (error as Error)?.message);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}