// Single source of truth for "what do I do next" on a pipeline record.
//
// ProjectsPipeline.buildPipeline() hands us a normalized project: a Lead,
// Proposal or Contract annotated with _kind / _stage / _intake / _invoice.
// This turns that state into one plain-language sentence and one tone, so the
// answer to "what now" is never something you have to derive from a badge.

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

// action = a hint for the card's destination; tone drives colour and sort order.
const step = (text, tone, action = null) => ({ text, tone, action });

function leadStep(p) {
  switch (p.status) {
    case 'new': return step('Review the request and record consultation notes', 'action', 'proposal');
    case 'contacted': return step('Followed up — no proposal sent yet', 'action', 'proposal');
    case 'proposal_sent': return step('Proposal sent — waiting on them', 'waiting');
    case 'won': return step('Won', 'done');
    case 'lost': return step('Closed out', 'done');
    default: return step('Archived', 'done');
  }
}

function proposalStep(p) {
  if (p.status === 'changes_requested') return step('Changes requested — review and revise the proposal', 'action', 'proposal');
  const expiry = p.expires_at || p.valid_until;
  const expired = expiry && new Date(expiry) < new Date() &&
    !['accepted', 'declined'].includes(p.status);
  if (expired) return step('Expired — extend the date and resend', 'attention', 'proposal');

  switch (p.status) {
    case 'draft': return step('Send this proposal to the client', 'action', 'proposal');
    case 'sent': return step('Sent — waiting for them to open it', 'waiting');
    case 'viewed': return step('They read it — nudge if it goes quiet', 'waiting');
    case 'accepted': return step('Accepted — review the draft agreement', 'action', 'contract');
    case 'declined': return step('Declined', 'done');
    default: return step('Expired — extend the date and resend', 'attention', 'proposal');
  }
}

function contractStep(p) {
  const inv = p._invoice;
  const intake = p._intake;

  const depositDone = inv
    ? ['paid', 'waived'].includes(inv.deposit_status)
    : !!p.deposit_paid_at || p.status === 'deposit_paid';
  const balanceOpen = inv && inv.balance_amount > 0 &&
    !['paid', 'waived'].includes(inv.balance_status);

  if (['signed', 'deposit_paid', 'active'].includes(p.status) && !depositDone) {
    if (!inv) return step('Signed — create the deposit invoice', 'action', 'invoice');
    return inv.last_sent_at
      ? step(`Waiting on the ${money(inv.deposit_amount)} deposit`, 'waiting', 'invoice')
      : step(`Email the ${money(inv.deposit_amount)} deposit request`, 'action', 'invoice');
  }

  switch (p.status) {
    case 'draft':
      return step('Review the scope, then send for signature', 'action', 'contract');
    case 'sent':
      return step('Sent — waiting on their signature', 'waiting');

    case 'signed':
    case 'deposit_paid':
    case 'active': {
      if (!inv) return step('Signed — create the deposit invoice', 'action', 'invoice');
      if (!depositDone) {
        return inv.last_sent_at
          ? step(`Waiting on the ${money(inv.deposit_amount)} deposit`, 'waiting', 'invoice')
          : step(`Email the ${money(inv.deposit_amount)} deposit request`, 'action', 'invoice');
      }
      // All signed states share the same intake and delivery requirements.
      if (!intake) return step('Deposit received — send the content intake form', 'action', 'intake');
      if (intake.status === 'submitted') return step('Content is in — review it and build', 'action', 'intake');
      if (intake.status === 'pending') return step('Send the saved content intake form', 'action', 'intake');
      if (intake.status === 'sent') return step('Waiting on their content', 'waiting', 'intake');
      if (intake.status === 'in_progress') return step('They started filling in their content', 'waiting', 'intake');

      if (p.handoff_status === 'changes_requested') return step('Client requested changes — review their handoff feedback', 'attention', 'handoff');
      if (p.handoff_status === 'ready') return step('Delivered — waiting on their sign-off', 'waiting');
      if (p.handoff_status === 'accepted' || p.delivered_at) {
        return balanceOpen
          ? step(`Signed off — collect the ${money(inv.balance_amount)} balance`, 'action', 'invoice')
          : step('Signed off and paid — mark complete', 'action', 'contract');
      }
      return balanceOpen
        ? step('In build — finish the work, then request the remaining balance before handoff', 'action', 'invoice')
        : step('In build — prepare the delivery checklist and handoff', 'action', 'handoff');
    }

    case 'completed':
      if (balanceOpen) return step(`Complete — ${money(inv.balance_amount)} still outstanding`, 'attention', 'invoice');
      return step('Complete', 'done');

    default:
      return step('Cancelled', 'done');
  }
}

/** Main entry point — takes a normalized pipeline project, returns its next step. */
export function projectNextStep(project) {
  if (!project) return step('—', 'waiting');
  switch (project._kind) {
    case 'contract': return contractStep(project);
    case 'proposal': return proposalStep(project);
    default: return leadStep(project);
  }
}

export const TONE_STYLES = {
  action: 'text-primary',
  waiting: 'text-muted-foreground',
  attention: 'text-amber-600',
  done: 'text-green-600',
};

// Rows needing action sort to the top — the pile you work through today.
export const TONE_RANK = { action: 0, attention: 1, waiting: 2, done: 3 };

export function sortByUrgency(projects) {
  return [...projects].sort((a, b) => {
    const ra = TONE_RANK[projectNextStep(a).tone] ?? 9;
    const rb = TONE_RANK[projectNextStep(b).tone] ?? 9;
    if (ra !== rb) return ra - rb;
    return String(b.created_date || '').localeCompare(String(a.created_date || ''));
  });
}

/** How many projects are actually waiting on you, for a nav or overview badge. */
export function countNeedingAction(projects) {
  return projects.filter((p) => {
    const t = projectNextStep(p).tone;
    return t === 'action' || t === 'attention';
  }).length;
}
