import { Link } from 'react-router-dom';
import { FileText, Receipt, UserCircle, ArrowRight, Clock, AlertCircle, Check } from 'lucide-react';
import { projectNextStep } from '@/lib/pipelineSteps';

const TONE_ICONS = {
  action: ArrowRight,
  waiting: Clock,
  attention: AlertCircle,
  done: Check,
};

// Inline-style replacements for TONE_STYLES (was Tailwind classes in pipelineSteps.js)
const TONE_INLINE = {
  action:    { color: 'var(--primary, #16a34a)' },
  waiting:   { color: 'var(--text-secondary, #66736e)' },
  attention: { color: '#d97706' },
  done:      { color: '#16a34a' },
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
  const toneStyle = TONE_INLINE[step.tone] || {};

  const destination = ACTION_HREF[step.action] ||
    (kind === 'contract' ? '/admin/contracts' : '/admin/proposals');
  const contractId = kind === 'contract' ? project.id : project.contract_id;
  const href = step.action === 'intake' && contractId
    ? `/admin/projects?view=intakes&contract=${encodeURIComponent(contractId)}`
    : destination === '/admin/contracts' && contractId
    ? `${destination}?contract=${encodeURIComponent(contractId)}`
    : destination === '/admin/invoices' && contractId
    ? `${destination}?contract=${encodeURIComponent(contractId)}`
    : destination === '/admin/proposals'
    ? `${destination}?${kind==='lead'?'lead':'proposal'}=${encodeURIComponent(project.id)}`
    : destination;

  const Icon = kind === 'contract' ? FileText : kind === 'proposal' ? FileText : UserCircle;

  return (
    <Link
      to={href}
      className="irx-card"
      style={{ padding: '14px', display: 'block', textDecoration: 'none', transition: 'box-shadow 0.15s, border-color 0.15s' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
        <span
          className="irx-badge"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          <Icon style={{ height: '12px', width: '12px' }} /> {kindLabel}
        </span>
        {project._invoice && (
          <Receipt style={{ height: '12px', width: '12px', color: 'var(--text-secondary, #66736e)' }} />
        )}
      </div>
      <h4 style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.4, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {title}
      </h4>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '8px' }}>
        {clientName}
      </p>

      {/* The one thing to do next. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border, rgba(0,0,0,0.08))' }}>
        <StepIcon style={{ height: '14px', width: '14px', flexShrink: 0, marginTop: '1px', ...toneStyle }} />
        <span style={{
          fontSize: '12px',
          lineHeight: 1.4,
          ...toneStyle,
          ...(step.tone === 'action' || step.tone === 'attention' ? { fontWeight: 500 } : {}),
        }}>
          {step.text}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {value != null ? (
          <span style={{ fontSize: '13px', fontWeight: 600 }}>${Number(value).toLocaleString()}</span>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)' }}>No estimate</span>
        )}
        <ArrowRight style={{ height: '14px', width: '14px', color: 'var(--text-secondary, #66736e)', transition: 'color 0.15s, transform 0.15s' }} />
      </div>
    </Link>
  );
}
