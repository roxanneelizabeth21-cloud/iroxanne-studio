import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { copyText } from '@/lib/marketing';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

function SlotCopy({ getText }) {
  const [done, setDone] = useState(false);
  const handle = async () => {
    const ok = await copyText(getText());
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={handle} className="gap-1.5 h-7 px-2">
      {done ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {done ? 'Copied' : 'Copy'}
    </Button>
  );
}

const prettify = (s) => String(s || '').replace(/_/g, ' ');

export default function TemplateSlots({ template, slotValues, onChange }) {
  if (!template) return null;
  const sv = slotValues || {};
  const slots = Array.isArray(template.slots) ? template.slots : [];

  return (
    <div className="space-y-3 glass rounded-xl p-3">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div>
          <p className="text-sm font-medium">{template.name}</p>
          <p className="text-xs text-muted-foreground">
            {template.content_type} · {template.target_length_seconds || '?'}s
            {template.capcut_notes ? ` · ${template.capcut_notes}` : ''}
          </p>
        </div>
      </div>
      {slots.length === 0 ? (
        <p className="text-xs text-muted-foreground">This template has no slots defined.</p>
      ) : (
        slots.map((s, i) => (
          <div key={`${s.slot_name}-${i}`} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className={FL}>{prettify(s.slot_name)} <span className="text-muted-foreground/60 normal-case">· {s.type}</span></label>
              <SlotCopy getText={() => sv[s.slot_name] || ''} />
            </div>
            {s.type === 'text' && (s.slot_name === 'lyric_lines' || s.slot_name === 'key_points' || s.slot_name === 'talking_points') ? (
              <Textarea value={sv[s.slot_name] || ''} onChange={(e) => onChange(s.slot_name, e.target.value)} rows={2} placeholder={s.instructions || ''} />
            ) : (
              <Input value={sv[s.slot_name] || ''} onChange={(e) => onChange(s.slot_name, e.target.value)} placeholder={s.instructions || ''} />
            )}
            {s.instructions && <p className="text-[10px] text-muted-foreground/70">{s.instructions}</p>}
          </div>
        ))
      )}
    </div>
  );
}