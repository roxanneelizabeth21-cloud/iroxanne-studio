import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

// Generates one square slide per highlight line, color-matched to the project's
// screenshot palette. Each generated image is saved to the Media Library too.
export default function AiSlidePanel({ projectId, onAdd }) {
  const [lines, setLines] = useState('');
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    const list = lines.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 8);
    if (!list.length) {
      toast({ title: 'Add at least one line', description: 'One highlight line per row.' });
      return;
    }
    setBusy(true);
    const made = [];
    for (const line of list) {
      const res = await base44.functions.invoke('generateMarketingImage', {
        portfolio_item_id: projectId || '',
        platform: 'Instagram',
        format: 'Feed Post',
        aspect_ratio: '1:1',
        text_overlay: line,
        prompt: `A carousel slide for a paid ad highlighting this project. Feature the line as the only text, set against a clean, modern scene that matches the app's brand and screenshot palette.`,
        original_request: 'Meta Ads carousel slide',
      }).catch((e) => ({ data: { ok: false, error: e.message } }));
      if (res?.data?.ok && res.data.image_url) {
        made.push({ image_url: res.data.image_url, headline: line.slice(0, 40), description: '', source: 'ai' });
      } else {
        toast({ title: 'One slide failed', description: res?.data?.error || 'Image generation failed.', variant: 'destructive' });
      }
    }
    setBusy(false);
    if (made.length) {
      onAdd(made);
      toast({ title: `${made.length} slide${made.length > 1 ? 's' : ''} added` });
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={lines}
        onChange={(e) => setLines(e.target.value)}
        rows={4}
        placeholder={'One line per slide, e.g.\nBookings made simple\nSee how it works'}
      />
      <Button type="button" size="sm" onClick={generate} disabled={busy} className="gap-1.5">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {busy ? 'Generating slides…' : 'Generate slides'}
      </Button>
      <p className="text-[11px] text-muted-foreground">Up to 8 lines at a time. Each slide is saved to your Media Library as well.</p>
    </div>
  );
}