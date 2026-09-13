import { useMemo, useState } from 'react';
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
  { key: 'intake', label: 'Intake', hint: 'Form in progress' },
  { key: 'build', label: 'In Build', hint: 'Active work' },
  { key: 'handoff', label: 'Handoff', hint: 'Delivered, awaiting acceptance' },
  { key: 'paid', label: 'Paid', hint: 'Completed & paid' },
];

const STAGE_TINT = {
  inquiry: 'border-l-blue-400',
  proposal: 'border-l-violet-400',
  contract: 'border-l-amber-400',
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
  intakes.forEach((i) => { if (i.contract_id) intakesByContract.set(i.contract_id, i); });
  const invoicesByContract = new Map();
  invoices.forEach((inv) => { if (inv.contract_id) invoicesByContract.set(inv.contract_id, inv); });

  const usedLeadIds = new Set();
  const usedProposalIds = new Set();
  const projects = [];

  contracts.forEach((c) => {
    const intake = intakesByContract.get(c.id);
    const invoice = invoicesByContract.get(c.id);
    let stage = 'contract';
    if (c.status === 'completed' && invoice && invoice.status === 'paid') stage = 'paid';
    else if (c.handoff_status === 'accepted' || c.delivered_at) stage = 'handoff';
    else if (c.status === 'active') stage = 'build';
    else if (intake && ['pending', 'sent', 'in_progress', 'submitted'].includes(intake.status)) stage = 'intake';
    else if (['signed', 'deposit_paid'].includes(c.status)) stage = 'contract';
    else if (c.status === 'sent') stage = 'contract';
    if (c.lead_id) usedLeadIds.add(c.lead_id);
    if (c.proposal_id) usedProposalIds.add(c.proposal_id);
    projects.push({ ...c, _kind: 'contract', _stage: stage, _intake: intake, _invoice: invoice });
  });

  proposals.forEach((p) => {
    if (usedProposalIds.has(p.id)) return;
    if (p.contract_id) return;
    if (['declined', 'expired'].includes(p.status)) return;
    const stage = p.status === 'accepted' ? 'contract' : 'proposal';
    if (p.lead_id) usedLeadIds.add(p.lead_id);
    projects.push({ ...p, _kind: 'proposal', _stage: stage });
  });

  leads.forEach((l) => {
    if (usedLeadIds.has(l.id)) return;
    if (['lost', 'archived'].includes(l.status)) return;
    const stage = l.status === 'proposal_sent' ? 'proposal' : 'inquiry';
    projects.push({ ...l, _kind: 'lead', _stage: stage });
  });

  return projects;
}

export default function ProjectsPipeline() {
  const [view,setView]=useState('intakes');
  const { data: leads = [], isLoading: lLoading, error: lErr } = useQuery({ queryKey: ['pipeline-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 100) });
  const { data: proposals = [], isLoading: pLoading, error: pErr } = useQuery({ queryKey: ['pipeline-proposals'], queryFn: () => base44.entities.Proposal.list('-created_date', 100) });
  const { data: contracts = [], isLoading: cLoading, error: cErr } = useQuery({ queryKey: ['pipeline-contracts'], queryFn: () => base44.entities.Contract.list('-created_date', 100) });
  const { data: intakes = [], isLoading: iLoading, error: iErr } = useQuery({ queryKey: ['pipeline-intakes'], queryFn: () => base44.entities.ClientIntake.list('-created_date', 100) });
  const { data: invoices = [], isLoading: invLoading, error: invErr } = useQuery({ queryKey: ['pipeline-invoices'], queryFn: () => base44.entities.Invoice.list('-created_date', 100) });

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
          <p className="text-sm text-muted-foreground">Start here. Every card tells you the one thing to do next.</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <div className="text-2xl font-bold font-display text-primary">{actionCount}</div>
            <div className="text-xs text-muted-foreground">need you today</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display">{projects.length}</div>
            <div className="text-xs text-muted-foreground">active projects</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-display">${totalValue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">pipeline value</div>
          </div>
        </div>
      </div>

      <nav aria-label="Project workspace" className="flex gap-2 border-b border-border pb-4"><Button variant={view==='intakes'?'default':'outline'} onClick={()=>setView('intakes')} aria-pressed={view==='intakes'}>Client intakes</Button><Button variant={view==='pipeline'?'default':'outline'} onClick={()=>setView('pipeline')} aria-pressed={view==='pipeline'}>Project pipeline</Button></nav>
      {view==='intakes' && <IntakeManager/>}
      {view==='pipeline' && <>
      {errors.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> Some data failed to load. Refresh to retry.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
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