import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

/**
 * Wraps an admin control with a short, plain-language explanation of what it
 * does. Borrowed from the Creatively His admin — every button that sends
 * something to a client should say so before it's pressed.
 */
export default function Hint({ text, children }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="max-w-[250px] text-xs leading-snug">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Standalone "?" icon for explaining a section header or a field. */
export function HintIcon({ text }) {
  return (
    <Hint text={text}>
      <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground shrink-0">
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </Hint>
  );
}
