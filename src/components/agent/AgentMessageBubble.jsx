import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, CheckCircle2, XCircle, ChevronRight, Wrench } from 'lucide-react';

const RUNNING = ['pending', 'running', 'in_progress'];

function parseResults(results) {
  if (!results) return null;
  if (typeof results === 'object') return results;
  try { return JSON.parse(results); } catch { return results; }
}

function ToolCall({ toolCall }) {
  const [open, setOpen] = useState(false);
  const dp = toolCall.display_projection || {};
  const parsed = parseResults(toolCall.results);
  const running = RUNNING.includes(toolCall.status);
  const failed =
    ['failed', 'error'].includes(toolCall.status) ||
    (typeof toolCall.results === 'string' && /error|failed/i.test(toolCall.results)) ||
    (parsed && typeof parsed === 'object' && parsed.success === false);

  const label = running
    ? dp.active_label || `Running ${toolCall.name}`
    : failed
      ? dp.error_label || `${toolCall.name} failed`
      : dp.label || toolCall.name;

  const hidden = dp.hide_details && dp.details_redacted;
  const Icon = running ? Loader2 : failed ? XCircle : CheckCircle2;

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => !hidden && setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/40 px-2 py-1 ${failed ? 'text-destructive' : 'text-muted-foreground'}`}
      >
        <Icon className={`h-3.5 w-3.5 ${running ? 'animate-spin' : ''}`} />
        <span className="font-medium">{label}</span>
        {!hidden && <ChevronRight className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`} />}
      </button>
      {open && !hidden && (
        <div className="mt-1 space-y-1 rounded-md bg-secondary/30 p-2 font-mono text-[11px]">
          <div className="text-muted-foreground">Parameters:</div>
          <pre className="whitespace-pre-wrap break-all">{toolCall.arguments_string || '{}'}</pre>
          {parsed != null && (
            <>
              <div className="text-muted-foreground">Result:</div>
              <pre className="whitespace-pre-wrap break-all">
                {typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentMessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card border border-border/60'}`}>
        {message.content && (isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none text-sm [&_p]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5">
            {message.content}
          </ReactMarkdown>
        ))}
        {!message.content && !message.tool_calls?.length && (
          <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {message.tool_calls?.map((tc, i) => <ToolCall key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}