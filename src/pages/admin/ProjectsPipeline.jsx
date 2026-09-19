import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FolderKanban, AlertCircle } from 'lucide-react';
import ProjectCard from '@/components/admin/ProjectCard';
import { sortByUrgency, countNeedingAction } from '@/lib/pipelineSteps';

import IntakeManager from '@/components/admin/IntakeManager';
import { Button } from '@/components/ui/button';

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
  inquiry: 'border-l-blue-400',
  proposal: 'border-l-violet-400',
  contract: 'border-l-amber-400',
  deposit: 'border-l-yellow-500',
  intake: 'border-l-teal-400',
  build: 'border-l-primary',
  handoff: 'border-l-orange-400',
  paid: 'border-l-green-500',
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-primary" /> Projects
          </h1>
          <p className="text-sm text-muted-foreground">Request → optional call → proposal → agreement → deposit → content intake → build → final payment → handoff approval → complete. Each card shows your next step.</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <div className="text-2xl font-bold font-display text-primary">{actionCount}</div>
            <div className="text-xs text-muted-foreground">need you today</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display">{projects.filter(p=>p._stage!=='paid').length}</div>
            <div className="text-xs text-muted-foreground">active projects</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display">${totalValue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">pipeline value</div>
          </div>
        </div>
      </div>

      <details className="rounded-xl border border-border p-4 text-sm"><summary className="font-semibold cursor-pointer">How to move a client through the studio</summary><ol className="list-decimal pl-5 space-y-2 mt-3"><li>Open the inquiry, review their goal and requested add-ons, and record consultation notes.</li><li>Prepare the proposal with the $650 website where appropriate, individually priced additions, deliverables, and payment terms. Send after reviewing.</li><li>After acceptance, open the linked agreement, check its scope, and send it for signature.</li><li>Review the generated invoice. Request the agreed deposit. If invoice creation failed, use Prepare missing invoice.</li><li>Send the linked content intake; review the submitted answers and mark them reviewed.</li><li>Build and review the agreed work. Quote extra scope separately. Collect the remaining balance according to the agreement.</li><li>Complete the delivery checklist, share the handoff link, resolve any requested changes, obtain acceptance, and mark the project complete.</li></ol><p className="mt-3 text-muted-foreground">A saved link is not an email delivery confirmation. Use each Send action and check its result. Marketing and paid ongoing support remain separate from project delivery.</p></details>
      <nav aria-label="Project workspace" className="flex gap-2 border-b border-border pb-4"><Button variant={view==='intakes'?'default':'outline'} onClick={()=>setView('intakes')} aria-pressed={view==='intakes'}>Client intakes</Button><Button variant={view==='pipeline'?'default':'outline'} onClick={()=>setView('pipeline')} aria-pressed={view==='pipeline'}>Project pipeline</Button></nav>
      {view==='intakes' && <IntakeManager/>}
      {view==='pipeline' && <>
      {errors.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> Some data failed to load. The pipeline is hidden to avoid showing incorrect next steps. Refresh to retry.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : errors.length ? null : (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
          {STAGES.map((stage) => {
            const items = byStage[stage.key] || [];
            const stageValue = items.reduce((sum, p) => {
              const v = p.price_total ?? p.amount_total;
              return v != null ? sum + Number(v) : sum;
            }, 0);
            return (
              <div key={stage.key} className="flex-shrink-0 w-72 flex flex-col">
                <div className="glass rounded-xl px-3 py-2.5 mb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{stage.label}</h3>
                    <span className="text-xs font-bold text-muted-foreground bg-secondary/60 rounded-full px-2 py-0.5">{items.length}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{stage.hint}</p>
                  {stageValue > 0 && <p className="text-[11px] text-muted-foreground mt-0.5">${stageValue.toLocaleString()}</p>}
                </div>
                <div className="flex-1 space-y-2 min-h-[120px]">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
                      No projects
                    </div>
                  ) : (
                    items.map((p) => (
                      <div key={`${p._kind}-${p.id}`} className={STAGE_TINT[stage.key] ? `border-l-4 ${STAGE_TINT[stage.key]}` : ''}>
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