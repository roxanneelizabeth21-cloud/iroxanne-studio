import React from 'react';
export default function WorkflowSection({title, children, open=false}) {
 return <details className="irx-workflow-section" open={open}><summary>{title}</summary><div className="space-y-5 pt-4">{children}</div></details>;
}
export function MoreActions({children}) {
 return <details className="irx-more-actions"><summary>More actions</summary><div className="flex flex-wrap items-center gap-2 pt-3">{children}</div></details>;
}
