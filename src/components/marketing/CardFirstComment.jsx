import { useState } from 'react';
import { MessageSquare, Copy, Check, AlertTriangle } from 'lucide-react';
import { firstComment, needsManualFacebookComment, instagramCommentFailed } from '@/lib/platformSchedule';

// Calendar-card preview of the first comment(s) waiting to go out, plus the
// flags that mean a comment needs pasting by hand.
function CommentBlock({ label, text }) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        <MessageSquare className="h-2.5 w-2.5" aria-hidden="true" /> {label} first comment
      </p>
      <p className="text-[10px] leading-snug whitespace-pre-line line-clamp-3 text-foreground">{text}</p>
    </div>
  );
}

function CopyFlag({ text, children }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="w-full flex items-start gap-1 rounded-lg bg-amber-500/10 px-2 py-1.5 text-left text-[10px] text-amber-700 dark:text-amber-400"
    >
      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{children}</span>
      {copied ? <Check className="h-3 w-3 shrink-0" aria-hidden="true" /> : <Copy className="h-3 w-3 shrink-0" aria-hidden="true" />}
    </button>
  );
}

export default function CardFirstComment({ post }) {
  const ig = firstComment(post, 'Instagram');
  const fb = firstComment(post, 'Facebook');
  const manualFb = needsManualFacebookComment(post);
  const igFailed = instagramCommentFailed(post);
  if (!ig && !fb) return null;

  return (
    <div className="space-y-1">
      {ig && <CommentBlock label="Instagram" text={ig} />}
      {fb && <CommentBlock label="Facebook" text={fb} />}
      {manualFb && fb && <CopyFlag text={fb}>Paste this Facebook first comment — tap to copy</CopyFlag>}
      {igFailed && ig && <CopyFlag text={ig}>Instagram comment didn't post — tap to copy and add it</CopyFlag>}
    </div>
  );
}