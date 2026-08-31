import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Section 5: one calm entry point into the marketing agent. The prompt is
// handed to the existing Strategist page — no duplicate chat implementation.
export default function HubAmplify({ suggestions = [] }) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');

  const go = (text) => {
    const q = (text || '').trim();
    navigate(q ? `/marketing/strategist?prompt=${encodeURIComponent(q)}` : '/marketing/strategist');
  };

  return (
    <div className="rounded-2xl border-[0.5px] border-border bg-card/60 p-5 space-y-3">
      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => { e.preventDefault(); go(prompt); }}
      >
        <label htmlFor="amplify-prompt" className="sr-only">Ask the Strategist</label>
        <Input
          id="amplify-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask for a plan, a caption, or an idea"
        />
        <Button type="submit" className="gap-1.5 shrink-0">
          <Bot className="h-4 w-4" aria-hidden="true" /> Ask the Strategist
        </Button>
      </form>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => go(s)}
              className="text-xs rounded-full border-[0.5px] border-border bg-background px-3 py-1.5 hover:border-primary/40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={() => go('')} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        Open the Strategist <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}