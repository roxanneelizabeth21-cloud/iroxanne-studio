import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { paymentSummary } from '../../shared/paymentSummary.ts';
import { requireAdmin } from '../../shared/marketingAdmin.ts';
import { esc, brandedEmail, brandButton, detailRows } from '../../shared/emailBrand.ts';

const money = (n: unknown) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  return url.origin.includes('base44') ? url.origin : 'https://iroxannestudio.base44.app';
}

// Admin-only: email the client their invoice — total, what's been paid, what's
// still due, and how to pay. `which` picks the framing: deposit request,
// balance request, or a full statement.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const { invoice_id, which = 'statement', note = '' } = await req.json();
    if (!invoice_id) return Response.json({ error: 'invoice_id is required' }, { status: 400 });

    let invoice;
    try {
      invoice = await base44.entities.Invoice.get(invoice_id);
    } catch {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (!invoice.client_email) return Response.json({ error: 'Invoice has no client email' }, { status: 400 });

    if (!['deposit','balance','statement'].includes(which)) return Response.json({error:'Invalid request type'},{status:400});
    if (invoice.status === 'cancelled') return Response.json({error:'This invoice is cancelled'},{status:409});
    const payments = await base44.entities.Payment.filter({invoice_id}, '-created_date', 1000);
    const summary = paymentSummary(invoice,payments);
    const total = summary.total;
    const deposit = summary.deposit;
    const paidSoFar = summary.paid;
    const outstanding = summary.outstanding;

    // Payment instructions come from PricingSettings so Roxanne can change them
    // in one place without a redeploy.
    const settingsList = await base44.asServiceRole.entities.PricingSettings.list('-updated_date');
      const settings = settingsList.find((s: any) => s.packages?.length) || settingsList[0];
    const payInstructions: string = settings?.payment_instructions || '';
    const rawLink = settings?.payment_link || '';
    const payLink = /^https:\/\//i.test(rawLink) ? rawLink : '';
    // Hosted invoice page — clients pay their deposit / milestones / balance online.
    const hostedPayLink = invoice.access_token ? `${getBaseUrl(req)}/invoice/${invoice.id}?t=${invoice.access_token}` : '';

    const firstName = (invoice.client_name || '').split(' ')[0] || 'there';

    let title: string;
    let lead: string;
    let amountDue = outstanding;
    if (which === 'deposit') {
      title = `Your deposit is ready, ${esc(firstName)}`;
      amountDue = summary.depositOutstanding;
      lead = `<p style="margin:0 0 16px;">Here's the deposit for <strong>${esc(invoice.project_title)}</strong>. Once it's in, your build slot is locked and I start work.</p>`;
    } else if (which === 'balance') {
      title = `Final balance — ${esc(invoice.project_title)}`;
      amountDue = summary.balanceOutstanding;
      lead = `<p style="margin:0 0 16px;">Your build is wrapping up. Here's the remaining balance for <strong>${esc(invoice.project_title)}</strong>.</p>`;
    } else {
      title = `Invoice — ${esc(invoice.project_title)}`;
      lead = `<p style="margin:0 0 16px;">Here's where things stand on <strong>${esc(invoice.project_title)}</strong>.</p>`;
    }

    const rows: [string, string][] = [
      ['Project total', money(total)],
      ['Deposit', `${money(deposit)} — ${esc(invoice.deposit_status || 'pending')}`],
      ['Paid to date', money(paidSoFar)],
      ['Outstanding', money(outstanding)],
    ];

    const emailed = await base44.asServiceRole.integrations.Core.SendEmail({
      to: invoice.client_email,
      subject: which === 'deposit'
        ? `Deposit due — ${invoice.project_title}`
        : which === 'balance'
          ? `Final balance due — ${invoice.project_title}`
          : `Invoice — ${invoice.project_title}`,
      html: brandedEmail({
        title,
        content: `${lead}
          ${note ? `<p style="margin:0 0 16px;">${esc(note)}</p>` : ''}
          <p style="font-size:22px;font-weight:600;margin:0 0 4px;">Amount due: ${money(amountDue)}</p>
          <div style="margin:20px 0;padding:16px;background:#FAF7F0;border-radius:10px;">${detailRows(rows)}</div>
          ${hostedPayLink ? `<p style="margin:0 0 16px;">${brandButton('Pay online', hostedPayLink)}</p>` : ''}
          ${payLink ? `<p style="margin:0 0 16px;font-size:13px;">Prefer a direct link? <a href="${payLink}" style="color:#2D2A4A;">Pay here</a>.</p>` : ''}
          ${payInstructions ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;">${esc(payInstructions).replace(/\n/g, '<br/>')}</p>` : ''}
          ${(invoice.milestones || []).length > 0
            ? `<p style="margin:16px 0 6px;font-weight:600;">Payment schedule</p>${detailRows(
                (invoice.milestones || []).map((m: any) => [
                  `${esc(m.label)}${m.due_date ? ` (due ${esc(m.due_date)})` : ''}`,
                  `${money(m.amount)} — ${esc(m.status || 'pending')}`,
                ] as [string, string])
              )}`
            : ''}
          <p style="margin:16px 0 0;font-size:13px;color:#8B7B95;">Questions about anything on here? Just reply to this email.</p>`,
        footerNote: 'iRoxanne Studio — one builder, not an agency.',
      }),
    }).then(() => true).catch((e) => { console.log('invoice email failed', (e as Error)?.message); return false; });

    if (emailed) {
      await base44.entities.Invoice.update(invoice_id, {
        last_sent_at: new Date().toISOString(),
        status: invoice.status === 'draft' ? 'open' : invoice.status,
      }).catch(() => {});
    }

    return Response.json({ sent: emailed, amount_due: amountDue, outstanding, base_url: getBaseUrl(req) });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}