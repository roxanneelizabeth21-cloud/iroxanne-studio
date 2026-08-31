import { Check, Cloud, AlertTriangle } from 'lucide-react';

const time = (d) => d?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Quiet autosave indicator for the Create Post header — no toasts for normal saves.
export default function SaveStatus({ status, savedAt }) {
  if (status === 'idle') return null;

  const map = {
    pending: { Icon: Cloud, text: 'Saving…', cls: 'text-muted-foreground' },
    saving: { Icon: Cloud, text: 'Saving…', cls: 'text-muted-foreground' },
    saved: { Icon: Check, text: savedAt ? `Saved ${time(savedAt)}` : 'Saved', cls: 'text-emerald-600 dark:text-emerald-400' },
    error: { Icon: AlertTriangle, text: 'Save failed', cls: 'text-destructive' },
  };
  const { Icon, text, cls } = map[status] || map.saved;

  return (
    <p className={`flex items-center gap-1.5 text-[11px] ${cls}`} aria-live="polite">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {text}
    </p>
  );
}