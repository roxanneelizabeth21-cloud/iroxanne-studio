import { ImageIcon, Video, AlertTriangle, Crop, Loader2, FileWarning } from 'lucide-react';
import { mediaState } from '@/lib/postValidation';

const TONES = {
  ok: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  warn: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  bad: 'bg-destructive/15 text-destructive',
};

const ICONS = {
  image: ImageIcon,
  video: Video,
  missing: AlertTriangle,
  failed: FileWarning,
  needs_crop: Crop,
  processing: Loader2,
  unsupported: FileWarning,
};

// Media state indicator — always text + icon, never colour alone.
export default function MediaStatusBadge({ post, clips = [], compact = false }) {
  const state = mediaState(post, clips);
  const Icon = ICONS[state.key] || AlertTriangle;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${TONES[state.tone]}`}
      title={state.label}
      aria-label={state.label}
    >
      <Icon className={`h-2.5 w-2.5 ${state.key === 'processing' ? 'animate-spin' : ''}`} aria-hidden="true" />
      {compact ? <span className="sr-only">{state.label}</span> : state.label}
    </span>
  );
}