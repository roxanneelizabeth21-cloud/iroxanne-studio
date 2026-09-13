import React from 'react';
import { ArrowRight, Check, Clock, AlertCircle } from 'lucide-react';
import { TONE_STYLES } from '@/lib/pipelineSteps';

const TONE_ICONS = {
  action: ArrowRight,
  waiting: Clock,
  attention: AlertCircle,
  done: Check,
};

/**
 * One client, one line, one next action. The `step` comes from pipelineSteps.js
 * so the answer to "what do I do with this" is never a translation exercise.
 */
export default function PipelineRow({ title, subtitle, step, children }) {
  const Icon = TONE_ICONS[step.tone] || Clock;
  return (
    <div className="rounded-xl bg-secondary/40 p-3.5 space-y-2.5">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className={`flex items-center gap-1.5 text-xs ${TONE_STYLES[step.tone] || ''}`}>
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {step.text}
        </p>
        {children && <div className="flex gap-1.5 items-center shrink-0">{children}</div>}
      </div>
    </div>
  );
}

/** Empty-state copy that tells you where the work comes from, not just that there's none. */
export function PipelineEmpty({ children }) {
  return <p className="text-sm text-muted-foreground py-2">{children}</p>;
}
