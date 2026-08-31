import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copyText } from '@/lib/marketing';

export const FIELD_LABEL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

export function CopyBtn({ label, getText }) {
  const [done, setDone] = useState(false);
  const handle = async () => {
    const ok = await copyText(getText());
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={handle} className="gap-1.5">
      {done ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? 'Copied' : label}
    </Button>
  );
}