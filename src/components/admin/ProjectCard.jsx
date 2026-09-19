import { Link } from 'react-router-dom';
import { FileText, Receipt, UserCircle, ArrowRight, Clock, AlertCircle, Check } from 'lucide-react';
import { projectNextStep, TONE_STYLES } from '@/lib/pipelineSteps';

const TONE_ICONS = {
  action: ArrowRight,
  waiting: Clock,
  attention: AlertCircle,
  done: Check,
};

// Where the card takes you depends on what needs doing, not just what kind of
// record it is — so the click always lands on the page where the next action lives.
const ACTION_HREF = {
  proposal: '/admin/proposals',
  contract: '/admin/contracts',
  invoice: '/admin/invoices',
  handoff: '/admin/contracts',
  intake: '/admin/projects',
};

/**
 * A single project card in the pipeline board. `project` is a normalized object
 * produced by buildPipeline() in ProjectsPipeline — either a Lead, Proposal, or Contract
 * with _kind / _stage / _intake / _invoice annotations.
 */
export default function ProjectCard({ project }) {
  const kind = project._kind;
  const kindLabel = kind === 'contract' ? 'Contract' : kind === 'proposal' ? 'Proposal' : 'Lead';
  const clientName = project.client_name || project.name || 'Unknown client';
  const title = project.project_title || project.quick_pitch || 'Untitled project';
  const value = project.price_total ?? project.amount_total;

  const step = projectNextStep(project);
  const StepIcon = TONE_ICONS[step.tone] || Clock;

  const destination = ACTION_HREF[step.action] ||
    (kind === 'contract' ? '/admin/contracts' : '/admin/proposals');
  const contractId = kind === 'contract' ? project.id : project.contract_id;
  const href = step.action === 'intake' && contractId
    ? `/admin/projects?view=intakes&contract=${encodeURIComponent(contractId)}`
    : destination === '/admin/contracts' && contractId
    ? `${destination}?contract=${encodeURIComponent(contractId)}`
    : destination === '/admin/invoices' && contractId
    ? `${destination}?contract=${encodeURIComponent(contractId)}`
    : destination;

  const Icon = kind === 'contract' ? FileText : kind === 'proposal' ? FileText : UserCircle;

  return (
    <Link
      to={href}
      className="block glass rounded-xl p-3.5 hover:border-primary/40 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3 w-3" /> {kindLabel}
        </span>
        {project._invoice && (
          <Receipt className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
      <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground truncate mb-2">{clientName}</p>

      {/* The one thing to do next. */}
      <div className="flex items-start gap-1.5 mb-2 pb-2 border-b border-border/50">
        <StepIcon className={`h-3.5 w-3.5 shrink-0 mt-px ${TONE_STYLES[step.tone] || ''}`} />
        <span className={`text-xs leading-snug ${TONE_STYLES[step.tone] || ''} ${
          step.tone === 'action' || step.tone === 'attention' ? 'font-medium' : ''
        }`}>
          {step.text}
        </span>
      </div>

      <div className="flex items-center justify-between">
        {value != null ? (
          <span className="text-sm font-semibold text-foreground">${Number(value).toLocaleString()}</span>
        ) : (
          <span className="text-xs text-muted-foreground">No estimate</span>
        )}
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
