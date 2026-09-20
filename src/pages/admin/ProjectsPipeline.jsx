import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FolderKanban, AlertCircle } from 'lucide-react';
import ProjectCard from '@/components/admin/ProjectCard';
import { sortByUrgency, countNeedingAction } from '@/lib/pipelineSteps';

import IntakeManager from '@/components/admin/IntakeManager';

const STAGES = [
  { key: 'inquiry', label: 'Inquiry', hint: 'New leads' },
  { key: 'proposal', label: 'Proposal', hint: 'Sent, awaiting decision' },
  { key: 'contract', label: 'Contract', hint: 'Sent or signed' },
  { key: 'deposit', label: 'Deposit', hint: 'Request or await payment' },
  { key: 'intake', label: 'Content Intake', hint: 'Collect and review project details' },
  { key: 'build', label: 'In Build', hint: 'Active work' },
  { key: 'handoff', label: 'Handoff', hint: 'Delivered, awaiting acceptance' },
  { key: 'paid', label: 'Paid', hint: 'Completed & paid' },
];

const STAGE_TINT = {
  inquiry: '#60a5fa',
  proposal: '#a78bfa',
  contract: '#fbbf24',
  deposit: '#eab308',
  intake: '#2dd4bf',
  build: 'var(--accent, #10b981)',
  handoff: '#fb923c',
  paid: '#22c55e',
};

/**
 * Stitch Leads, Proposals, Contracts, Intakes, and Invoices into a single
 * pipeline of project records. Each record gets _kind, _stage, and where
 * relevant _intake / _invoice so the card can render extra detail.
 */
function buildPipeline(leads, proposals, contracts, intakes, invoices) {
  const intakesByContract = new Map();
  intakes.forEach((i) => { if (i.contract_id && !intakesByContract.has(i.contract_id)) intakesByContract.set(i.contract_id, i); });
  const invoicesByContract = new Map();
  invoices.forEach((inv) => { if (inv.contract_id && inv.status !== 'cancelled' && !invoicesByContract.has(inv.contract_id)) invoicesByContract.set(inv.contract_id, inv); });

  const usedLeadIds = new Set();
  const usedProposalIds = new Set();
  const projects = [];

  contracts.forEach((c) => {
    const intake = intakesByContract.get(c.id);
    const invoice = invoicesByContract.get(c.id);
    let stage = 'contract';
    if (c.status === 'cancelled') {
      if(c.lead_id) usedLeadIds.add(c.lead_id);
      if(c.proposal_id) usedProposalIds.add(c.proposal_id);
      return;
    }
    if (c.status === 'completed' && invoice && invoice.status === 'paid') stage = 'paid';
    else if (['ready','accepted','changes_requested'].includes(c.handoff_status) || c.delivered_at) stage = 'handoff';
    else if (['signed', 'deposit_paid', 'active'].includes(c.status)) {
      const depositDone = invoice
        ? ['paid', 'waived'].includes(invoice.deposit_status)
        : !!c.deposit_paid_at || c.status === 'deposit_paid';
      if (!depositDone) stage = 'deposit';
      else if (!intake || intake.status !== 'reviewed') stage = 'intake';
      else stage = 'build';
    }
    else if (c.status === 'sent') stage = 'contract';
    if (c.lead_id) usedLeadIds.add(c.lead_id);
    if (c.proposal_id) usedProposalIds.add(c.proposal_id);
    projects.push({ ...c, _kind: 'contract', _stage: stage, _intake: intake, _invoice: invoice });
  });

  proposals.forEach((p) => {
    if (usedProposalIds.has(p.id)) return;
    if (p.contract_id && contracts.some(c => c.id === p.contract_id)) return;
    if (['declined', 'expired'].includes(p.status)) return;
    const stage = p.status === 'accepted' ? 'contract' : 'proposal';
    if (p.lead_id) usedLeadIds.add(p.lead_id);
    projects.push({ ...p, _kind: 'proposal', _stage: stage });
  });

  leads.forEach((l) => {
    if (l.is_test_record || usedLeadIds.has(l.id)) return;
    if (['lost', 'archived'].includes(l.status)) return;
    const stage = l.status === 'proposal_sent' ? 'proposal' : 'inquiry';
    projects.push({ ...l, _kind: 'lead', _stage: stage });
  });

  return projects;
}

export default function ProjectsPipeline() {
  const [searchParams] = useSearchParams();
  const requestedView=searchParams.get('view');
  const [view,setView]=useState(requestedView === 'intakes' ? 'intakes' : 'pipeline');
  useEffect(()=>{setView(requestedView === 'intakes' ? 'intakes' : 'pipeline');},[requestedView]);
  const { data: leads = [], isLoading: lLoading, error: lErr } = useQuery({ queryKey: ['pipeline-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 500) });
  const { data: proposals = [], isLoading: pLoading, error: pErr } = useQuery({ queryKey: ['pipeline-proposals'], queryFn: () => base44.entities.Proposal.list('-created_date', 500) });
  const { data: contracts = [], isLoading: cLoading, error: cErr } = useQuery({ queryKey: ['pipeline-contracts'], queryFn: () => base44.entities.Contract.list('-created_date', 500) });
  const { data: intakes = [], isLoading: iLoading, error: iErr } = useQuery({ queryKey: ['pipeline-intakes'], queryFn: () => base44.entities.ClientIntake.list('-created_date', 500) });
  const { data: invoices = [], isLoading: invLoading, error: invErr } = useQuery({ queryKey: ['pipeline-invoices'], queryFn: () => base44.entities.Invoice.list('-created_date', 500) });

  const isLoading = lLoading || pLoading || cLoading || iLoading || invLoading;
  const errors = [lErr, pErr, cErr, iErr, invErr].filter(Boolean);

  const projects = useMemo(
    () => buildPipeline(leads, proposals, contracts, intakes, invoices),
    [leads, proposals, contracts, intakes, invoices]
  );

  const byStage = useMemo(() => {
    const map = {};
    STAGES.forEach((s) => { map[s.key] = []; });
    projects.forEach((p) => { if (map[p._stage]) map[p._stage].push(p); });
    // Anything waiting on Roxanne rises to the top of its column, so the work
    // to do today is always the first thing in view.
    STAGES.forEach((s) => { map[s.key] = sortByUrgency(map[s.key]); });
    return map;
  }, [projects]);

  const actionCount = countNeedingAction(projects);

  const totalValue = projects.reduce((sum, p) => {
    const v = p.price_total ?? p.amount_total;
    return v != null ? sum + Number(v) : sum;
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Page header ── */}
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Projects Pipeline</h1>
        <p>Track projects from inquiry through completion.</p>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div className="irx-stat">
          <span className="irx-stat-value" style={{ color: 'var(--accent, #10b981)' }}>{actionCount}</span>
          <span className="irx-stat-label">need you today</span>
        </div>
        <div className="irx-stat">
          <span className="irx-stat-value">{projects.filter(p=>p._stage!=='paid').length}</span>
          <span className="irx-stat-label">active projects</span>
        </div>
        <div className="irx-stat">
          <span className="irx-stat-value">${totalValue.toLocaleString()}</span>
          <span className="irx-stat-label">pipeline value</span>
        </div>
      </div>

      {/* ── How-to accordion ── */}
      <details className="irx-card" style={{ padding: '16px', fontSize: '14px' }}>
        <summary style={{ fontWeight: 600, cursor: 'pointer' }}>How to move a client through the studio</summary>
        <ol style={{ listStyleType: 'decimal', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          <li>Open the inquiry, review their goal and requested add-ons, and record consultation notes.</li>
          <li>Prepare the proposal with the $650 website where appropriate, individually priced additions, deliverables, and payment terms. Send after reviewing.</li>
          <li>After acceptance, open the linked agreement, check its scope, and send it for signature.</li>
          <li>Review the generated invoice. Request the agreed deposit. If invoice creation failed, use Prepare missing invoice.</li>
          <li>Send the linked content intake; review the submitted answers and mark them reviewed.</li>
          <li>Build and review the agreed work. Quote extra scope separately. Collect the remaining balance according to the agreement.</li>
          <li>Complete the delivery checklist, share the handoff link, resolve any requested changes, obtain acceptance, and mark the project complete.</li>
        </ol>
        <p style={{ marginTop: '12px', color: 'var(--text-secondary, #66736e)' }}>A saved link is not an email delivery confirmation. Use each Send action and check its result. Marketing and paid ongoing support remain separate from project delivery.</p>
      </details>

      {/* ── View toggle ── */}
      <nav aria-label="Project workspace" className="irx-filters" style={{ borderBottom: '1px solid var(--border, #e2e5e3)', paddingBottom: '16px' }}>
        <button
          className={`irx-pill${view === 'intakes' ? ' active' : ''}`}
          onClick={() => setView('intakes')}
          aria-pressed={view === 'intakes'}
        >
          Client intakes
        </button>
        <button
          className={`irx-pill${view === 'pipeline' ? ' active' : ''}`}
          onClick={() => setView('pipeline')}
          aria-pressed={view === 'pipeline'}
        >
          Project pipeline
        </button>
      </nav>

      {view === 'intakes' && <IntakeManager />}
      {view === 'pipeline' && <>
        {errors.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px',
            border: '1px solid rgba(220,38,38,0.3)',
            background: 'rgba(220,38,38,0.05)',
            padding: '8px 12px',
            fontSize: '14px',
            color: '#dc2626',
          }}>
            <AlertCircle style={{ height: '16px', width: '16px', flexShrink: 0 }} /> Some data failed to load. The pipeline is hidden to avoid showing incorrect next steps. Refresh to retry.
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '4px solid rgba(16,185,129,0.2)',
              borderTopColor: 'var(--accent, #10b981)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        ) : errors.length ? null : (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', marginLeft: '-4px', paddingLeft: '4px' }}>
            {STAGES.map((stage) => {
              const items = byStage[stage.key] || [];
              const stageValue = items.reduce((sum, p) => {
                const v = p.price_total ?? p.amount_total;
                return v != null ? sum + Number(v) : sum;
              }, 0);
              return (
                <div key={stage.key} style={{ flexShrink: 0, width: '288px', display: 'flex', flexDirection: 'column' }}>
                  {/* Column header */}
                  <div className="irx-card" style={{ padding: '10px 12px', marginBottom: '8px', borderLeft: `3px solid ${STAGE_TINT[stage.key]}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{stage.label}</h3>
                      <span className="irx-badge">{items.length}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)', marginTop: '2px', marginBottom: 0 }}>{stage.hint}</p>
                    {stageValue > 0 && <p style={{ fontSize: '11px', color: 'var(--text-secondary, #66736e)', marginTop: '2px', marginBottom: 0 }}>${stageValue.toLocaleString()}</p>}
                  </div>
                  {/* Column body */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px' }}>
                    {items.length === 0 ? (
                      <div className="irx-empty">No projects</div>
                    ) : (
                      items.map((p) => (
                        <div key={`${p._kind}-${p.id}`} style={{ borderLeft: `4px solid ${STAGE_TINT[stage.key]}` }}>
                          <ProjectCard project={p} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>}
    </div>
  );
}
