import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// The finished shot list, ready to follow (or paste into CapCut/Canva notes).
export default function ReelBriefCard({ brief }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold">Your assembly brief</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            navigator.clipboard.writeText(brief);
            toast({ title: 'Brief copied' });
          }}
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </Button>
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">{brief}</pre>
    </div>
  );
}