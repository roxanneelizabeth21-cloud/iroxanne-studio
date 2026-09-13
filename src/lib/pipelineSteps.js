// Single source of truth for "what do I do next" across the client pipeline.
// Every row in the admin renders its next action from here, so the answer is
// never something Roxanne has to work out by reading a status badge.
//
// Stage order: lead → proposal → contract → deposit → intake → balance → done

export const STAGES = [
  { key: 'requests', label: 'Quote Requests', blurb: 'Someone asked for a quote. Turn it into a proposal.' },
  { key: 'proposals', label: 'Proposals', blurb: 'Send it, then wait for them to accept online.' },
  { key: 'agreements', label: 'Agreements', blurb: 'Send for signature. They sign online.' },
  { key: 'money', label: 'Payments', blurb: 'Collect the deposit, then the final balance.' },
  { key: 'intake', label: 'Content Intake', blurb: 'Get their copy, images and details — organized by page.' },
];

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

// --- Leads ------------------------------------------------------------------
export function leadNextStep(lead) {
  if (lead.status === 'new') {
    return { text: 'Build a proposal from this request', action: 'build_proposal', tone: 'action' };
  }
  if (lead.status === 'contacted') {
    return { text: 'Follow up — no proposal sent yet', action: 'build_proposal', tone: 'action' };
  }
  if (lead.status === 'proposal_sent') {
    return { text: 'Proposal sent — waiting on them', action: null, tone: 'waiting' };
  }
  if (lead.status === 'won') return { text: 'Won', action: null, tone: 'done' };
  if (lead.status === 'lost') return { text: 'Closed out', action: null, tone: 'done' };
  return { text: 'Archived', action: null, tone: 'done' };
}

// --- Proposals --------------------------------------------------------------
export function proposalNextStep(proposal) {
  const expired = proposal.valid_until &&
    new Date(proposal.valid_until) < new Date() &&
    !['accepted', 'declined'].includes(proposal.status);

  switch (proposal.status) {
    case 'draft':
      return { text: 'Send this proposal to the client', action: 'send_proposal', tone: 'action' };
    case 'sent':
      if (expired) return { text: 'Expired — extend the date and resend', action: 'send_proposal', tone: 'attention' };
      return { text: 'Sent — waiting for them to open it', action: null, tone: 'waiting' };
    case 'viewed':
      if (expired) return { text: 'Expired — extend the date and resend', action: 'send_proposal', tone: 'attention' };
      return { text: 'They read it — nudge if it goes quiet', action: null, tone: 'waiting' };
    case 'accepted':
      return { text: 'Accepted — your draft agreement is ready', action: 'open_agreement', tone: 'action' };
    case 'declined':
      return { text: 'Declined', action: null, tone: 'done' };
    default:
      return { text: 'Expired — extend the date and resend', action: 'send_proposal', tone: 'attention' };
  }
}

// --- Agreements (Contract) --------------------------------------------------
export function contractNextStep(contract, invoice) {
  switch (contract.status) {
    case 'draft':
      return { text: 'Review the scope, then send for signature', action: 'send_contract', tone: 'action' };
    case 'sent':
      return { text: 'Sent — waiting on their signature', action: null, tone: 'waiting' };
    case 'signed': {
      if (!invoice) return { text: 'Signed — create the deposit invoice', action: 'create_invoice', tone: 'action' };
      if (invoice.deposit_status === 'pending') {
        return { text: `Signed — collect the ${money(invoice.deposit_amount)} deposit`, action: 'send_deposit', tone: 'action' };
      }
      return { text: 'Signed — send the content intake form', action: 'send_intake', tone: 'action' };
    }
    case 'deposit_paid':
      return { text: 'Deposit in — send the content intake form', action: 'send_intake', tone: 'action' };
    case 'active': {
      if (invoice && invoice.balance_status !== 'paid' && invoice.balance_status !== 'waived' && invoice.balance_amount > 0) {
        return { text: `In build — ${money(invoice.balance_amount)} balance due at launch`, action: 'send_balance', tone: 'waiting' };
      }
      return { text: 'In build — mark complete when you launch', action: 'complete', tone: 'action' };
    }
    case 'completed':
      return { text: 'Complete', action: null, tone: 'done' };
    default:
      return { text: 'Cancelled', action: null, tone: 'done' };
  }
}

// --- Invoices ---------------------------------------------------------------
export function invoiceNextStep(invoice) {
  const total = invoice.amount_total || 0;
  const depositDone = invoice.deposit_status === 'paid' || invoice.deposit_status === 'waived';
  const balanceDone = invoice.balance_status === 'paid' || invoice.balance_status === 'waived' || !(invoice.balance_amount > 0);

  if (depositDone && balanceDone) return { text: `Paid in full — ${money(total)}`, action: null, tone: 'done' };
  if (!depositDone) {
    if (!invoice.last_sent_at) {
      return { text: `Email the ${money(invoice.deposit_amount)} deposit request`, action: 'send_deposit', tone: 'action' };
    }
    return { text: `Waiting on ${money(invoice.deposit_amount)} deposit`, action: 'record_payment', tone: 'waiting' };
  }
  if (invoice.balance_status === 'partial') {
    const left = (invoice.balance_amount || 0) - (invoice.balance_paid_amount || 0);
    return { text: `Part-paid — ${money(left)} still outstanding`, action: 'record_payment', tone: 'attention' };
  }
  return { text: `Collect the ${money(invoice.balance_amount)} final balance`, action: 'send_balance', tone: 'action' };
}

// --- Intake -----------------------------------------------------------------
export function intakeNextStep(intake) {
  if (!intake) return { text: 'Not sent yet', action: 'send_intake', tone: 'action' };
  switch (intake.status) {
    case 'pending':
      return { text: 'Sent — waiting on their content', action: null, tone: 'waiting' };
    case 'in_progress':
      return { text: 'They started filling it in', action: null, tone: 'waiting' };
    case 'submitted':
      return { text: 'Content is in — review it and start building', action: 'review_intake', tone: 'action' };
    default:
      return { text: 'Reviewed', action: null, tone: 'done' };
  }
}

// Tailwind classes per tone, so the whole admin reads the same way.
export const TONE_STYLES = {
  action: 'text-primary font-medium',
  waiting: 'text-muted-foreground',
  attention: 'text-amber-700 font-medium',
  done: 'text-green-700',
};

// Rows needing action sort to the top — the pile you work through today.
export const TONE_RANK = { action: 0, attention: 1, waiting: 2, done: 3 };

export function sortByUrgency(rows, getStep) {
  return [...rows].sort((a, b) => {
    const ra = TONE_RANK[getStep(a).tone] ?? 9;
    const rb = TONE_RANK[getStep(b).tone] ?? 9;
    if (ra !== rb) return ra - rb;
    return String(b.created_date || '').localeCompare(String(a.created_date || ''));
  });
}
