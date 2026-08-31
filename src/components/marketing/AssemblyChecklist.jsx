import { useState } from 'react';
import { Copy, Check, Film } from 'lucide-react';
import { copyText } from '@/lib/marketing';

function ItemCopy({ getText }) {
  const [done, setDone] = useState(false);
  const handle = async (e) => {
    e.stopPropagation();
    const ok = await copyText(getText());
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    }
  };
  return (
    <button type="button" onClick={handle} className="p-1 rounded hover:bg-secondary/60 text-muted-foreground shrink-0" aria-label="Copy this item">
      {done ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// AssemblyChecklist — renders a video post's template + filled slots as a per-item
// copyable checklist, plus the full CapCut brief. Shown inline on the Today view.
export default function AssemblyChecklist({ post, template }) {
  const slots = template && Array.isArray(template.slots) ? template.slots : [];
  const sv = post.slot_values && typeof post.slot_values === 'object' ? post.slot_values : {};

  const items = [];
  if (template?.name) items.push({ label: 'Template', value: template.name, copyable: true });
  for (const s of slots) {
    const v = sv[s.slot_name];
    if (v == null || v === '') continue;
    items.push({ label: s.slot_name.replace(/_/g, ' '), value: String(v), copyable: true });
  }
  if (post.video_brief) items.push({ label: 'Full brief', value: post.video_brief, copyable: true, multiline: true });

  if (!items.length) return null;

  return (
    <div className="glass rounded-xl p-3 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Film className="h-3.5 w-3.5" /> Assembly checklist
      </p>
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span className="text-muted-foreground min-w-[80px] shrink-0">{it.label}:</span>
          <span className={it.multiline ? 'whitespace-pre-wrap flex-1' : 'flex-1 break-words'}>{it.value}</span>
          {it.copyable && <ItemCopy getText={() => it.value} />}
        </div>
      ))}
    </div>
  );
}