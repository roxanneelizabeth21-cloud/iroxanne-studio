import { Link } from 'react-router-dom';
import { FileText, Receipt, UserCircle, ArrowRight } from 'lucide-react';

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

  const href =
    kind === 'contract' ? '/admin/contracts'
    : kind === 'proposal' ? '/admin/proposals'
    : '/admin/proposals';

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