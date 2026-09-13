import { base44 } from '@/api/base44Client';

// The customer chain: Lead -> Proposal -> Contract -> {Invoice, ClientIntake, Payment}
// Deleting any node should cascade through everything linked to it so the
// pipeline never leaves orphaned records behind.
//
// Linking fields:
//   Proposal.lead_id, Contract.lead_id, Contract.proposal_id,
//   Invoice.contract_id, ClientIntake.contract_id, ClientIntake.lead_id,
//   Payment.contract_id, Payment.invoice_id

const safe = (p) => p.catch(() => null);

async function cascadeContract(contractId, counts) {
  const [invoices, intakes, payByContract] = await Promise.all([
    safe(base44.entities.Invoice.filter({ contract_id: contractId })),
    safe(base44.entities.ClientIntake.filter({ contract_id: contractId })),
    safe(base44.entities.Payment.filter({ contract_id: contractId })),
  ]);

  // Payments may be tied to the contract directly or to one of its invoices.
  let invPayCount = 0;
  for (const inv of invoices || []) {
    const pays = await safe(base44.entities.Payment.filter({ invoice_id: inv.id }));
    if (pays && pays.length) {
      await safe(base44.entities.Payment.deleteMany({ invoice_id: inv.id }));
      invPayCount += pays.length;
    }
  }
  if (payByContract && payByContract.length) {
    await safe(base44.entities.Payment.deleteMany({ contract_id: contractId }));
  }
  if (intakes && intakes.length) {
    await safe(base44.entities.ClientIntake.deleteMany({ contract_id: contractId }));
  }
  if (invoices && invoices.length) {
    await safe(base44.entities.Invoice.deleteMany({ contract_id: contractId }));
  }

  counts.payments += (payByContract?.length || 0) + invPayCount;
  counts.intakes += intakes?.length || 0;
  counts.invoices += invoices?.length || 0;
}

/**
 * Delete a record and everything connected to it in the customer chain.
 * @param {'lead'|'proposal'|'contract'|'invoice'|'intake'|'payment'} rootType
 * @param {string} rootId
 * @returns {Promise<{leads:number,proposals:number,contracts:number,invoices:number,intakes:number,payments:number}>}
 */
export async function deleteProjectChain(rootType, rootId) {
  const counts = { leads: 0, proposals: 0, contracts: 0, invoices: 0, intakes: 0, payments: 0 };

  if (rootType === 'lead') {
    const [proposals, contracts, intakesByLead] = await Promise.all([
      safe(base44.entities.Proposal.filter({ lead_id: rootId })),
      safe(base44.entities.Contract.filter({ lead_id: rootId })),
      safe(base44.entities.ClientIntake.filter({ lead_id: rootId })),
    ]);
    for (const c of contracts || []) await cascadeContract(c.id, counts);
    if (contracts && contracts.length) await safe(base44.entities.Contract.deleteMany({ lead_id: rootId }));
    if (proposals && proposals.length) await safe(base44.entities.Proposal.deleteMany({ lead_id: rootId }));
    if (intakesByLead && intakesByLead.length) await safe(base44.entities.ClientIntake.deleteMany({ lead_id: rootId }));
    await safe(base44.entities.Lead.delete(rootId));
    counts.leads = 1;
    counts.proposals += proposals?.length || 0;
    counts.contracts += contracts?.length || 0;
    counts.intakes += intakesByLead?.length || 0;
  } else if (rootType === 'proposal') {
    const contracts = await safe(base44.entities.Contract.filter({ proposal_id: rootId }));
    for (const c of contracts || []) await cascadeContract(c.id, counts);
    if (contracts && contracts.length) await safe(base44.entities.Contract.deleteMany({ proposal_id: rootId }));
    await safe(base44.entities.Proposal.delete(rootId));
    counts.proposals = 1;
    counts.contracts += contracts?.length || 0;
  } else if (rootType === 'contract') {
    await cascadeContract(rootId, counts);
    await safe(base44.entities.Contract.delete(rootId));
    counts.contracts = 1;
  } else if (rootType === 'invoice') {
    const pays = await safe(base44.entities.Payment.filter({ invoice_id: rootId }));
    if (pays && pays.length) await safe(base44.entities.Payment.deleteMany({ invoice_id: rootId }));
    await safe(base44.entities.Invoice.delete(rootId));
    counts.invoices = 1;
    counts.payments += pays?.length || 0;
  } else if (rootType === 'intake') {
    await safe(base44.entities.ClientIntake.delete(rootId));
    counts.intakes = 1;
  } else if (rootType === 'payment') {
    await safe(base44.entities.Payment.delete(rootId));
    counts.payments = 1;
  }

  return counts;
}

/** Human-readable summary of what a cascade removed, for toast messages. */
export function chainSummary(counts) {
  const parts = [];
  const labels = {
    leads: 'request',
    proposals: 'proposal',
    contracts: 'agreement',
    invoices: 'invoice',
    intakes: 'intake',
    payments: 'payment',
  };
  for (const [key, label] of Object.entries(labels)) {
    const n = counts[key] || 0;
    if (n > 0) parts.push(`${n} ${label}${n > 1 ? 's' : ''}`);
  }
  return parts.length ? `Removed: ${parts.join(', ')}.` : '';
}