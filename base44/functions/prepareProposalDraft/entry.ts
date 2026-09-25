import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Sam may prepare or revise a proposal draft for an existing quote request.
// This function never sends email, changes lead status, or creates a contract.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const leadId = String(body.lead_id || '').trim();
    if (!leadId) return Response.json({ error: 'lead_id is required' }, { status: 400 });
    const lead = await base44.entities.Lead.get(leadId).catch(() => null);
    if (!lead || lead.is_test_record) return Response.json({ error: 'Eligible quote request not found' }, { status: 404 });
    if (!lead.email) return Response.json({ error: 'The quote request has no email address' }, { status: 400 });

    const projectTitle = String(body.project_title || lead.business_name || 'Custom app or website').trim().slice(0, 160);
    const scope = String(body.scope_summary || lead.quick_pitch || lead.problem_to_solve || '').trim().slice(0, 4000);
    if (!scope) return Response.json({ error: 'A specific scope summary is required' }, { status: 400 });
    const deliverables = Array.isArray(body.deliverables)
      ? body.deliverables.slice(0, 20).map((v: unknown) => String(v || '').trim().slice(0, 300)).filter(Boolean)
      : [];
    if (!deliverables.length) return Response.json({ error: 'At least one deliverable is required' }, { status: 400 });

    const price = body.price_total === undefined || body.price_total === null || body.price_total === ''
      ? undefined : Number(body.price_total);
    if (price !== undefined && (!Number.isFinite(price) || price <= 0)) {
      return Response.json({ error: 'price_total must be a positive number or left for Roxanne to set' }, { status: 400 });
    }

    const existing = await base44.entities.Proposal.filter({ lead_id: leadId }, '-created_date', 20);
    const draft = existing.find((p: any) => p.status === 'draft');
    if (existing.some((p: any) => ['sent', 'viewed', 'accepted', 'changes_requested'].includes(p.status)) && !draft) {
      return Response.json({ error: 'A client-facing proposal already exists. Open it for review before making a new one.' }, { status: 409 });
    }

    const data: Record<string, unknown> = {
      lead_id: leadId,
      client_name: lead.name || '',
      client_email: lead.email,
      business_name: lead.business_name || '',
      project_title: projectTitle,
      scope_summary: scope,
      deliverables,
      intro_note: String(body.intro_note || '').trim().slice(0, 2000),
      timeline_estimate: String(body.timeline_estimate || '').trim().slice(0, 300),
      selected_package: String(body.selected_package || lead.selected_package || '').trim().slice(0, 120),
      status: 'draft',
    };
    if (price !== undefined) data.price_total = price;
    const proposal = draft
      ? await base44.entities.Proposal.update(draft.id, data)
      : await base44.entities.Proposal.create(data);
    return Response.json({
      ok: true, proposal_id: proposal.id, status: proposal.status,
      review_path: '/admin/proposals', price_needs_review: !Number.isFinite(proposal.price_total),
      sent: false,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message || 'Could not prepare proposal' }, { status: 500 });
  }
}
