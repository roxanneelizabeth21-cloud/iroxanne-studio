import { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Download, Loader2, Plus, Trash2, Film } from 'lucide-react';
import { renderCardReel } from '@/lib/renderCardReel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import CardCanvas, { PALETTES, LAYOUTS, CARD_W, CARD_H } from '@/components/marketing/cards/CardCanvas';
import JadeCardPanel from '@/components/marketing/cards/JadeCardPanel';

// Starter set, taken from the studio's own pages rather than invented. The rule
// these follow: say the thing the reader is already thinking, then answer it in
// one line. One idea per card.
const STARTERS = [
  { layout: 'statement', palette: 'forest', headline: 'You have the idea.\nI’ll help you bring\nit to life.', body: 'Custom apps and websites for real people, real goals, real impact.', headlineSize: 84 },
  { layout: 'checklist', palette: 'cream', headline: 'You don’t need…', items: ['A business name', 'A finished plan', 'A list of features'], body: 'You just need\na starting point.' },
  { layout: 'photo', palette: 'ink', headline: 'Big ideas\nSmall ideas\nGood ideas\nall belong here.', body: '', imageUrl: '' },
  { layout: 'list', palette: 'sage', headline: 'Built for\nwhat matters.', items: ['Start a business', 'Bring people together', 'Support a cause', 'Make everyday things easier'], body: 'Different ideas.\nA common thread.\nA better way forward.' },
  { layout: 'statement', palette: 'blush', headline: 'Let’s talk about\nwhat you’re\nimagining.', body: 'A conversation today could be the start of something tomorrow.', headlineSize: 78 },
];

export default function CardStudio() {
  const { toast } = useToast();
  const [cards, setCards] = useState(STARTERS);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reel, setReel] = useState(null);
  const stageRef = useRef(null);

  const card = cards[active] || STARTERS[0];
  const patch = (changes) => setCards((cs) => cs.map((c, i) => (i === active ? { ...c, ...changes } : c)));

  const download = async () => {
    if (!stageRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(stageRef.current, { width: CARD_W, height: CARD_H, scale: 1, useCORS: true, backgroundColor: null, logging: false });
      const link = document.createElement('a');
      link.download = `iroxanne-card-${active + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: 'Card downloaded', description: '1080 x 1350, ready for Facebook and Instagram.' });
    } catch (e) {
      toast({ title: 'Could not export the card', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  // Turn the whole board into one vertical reel. Each card is rendered to a PNG
  // first, exactly as the download does, so the reel matches what you see.
  const makeReel = async () => {
    if (!stageRef.current) return;
    setReel({ pct: 0, stage: 'Rendering cards' });
    const keep = active;
    try {
      const urls = [];
      for (let i = 0; i < cards.length; i++) {
        setActive(i);
        // let the canvas repaint with the newly selected card
        await new Promise((r) => setTimeout(r, 120));
        const canvas = await html2canvas(stageRef.current, { width: CARD_W, height: CARD_H, scale: 1, useCORS: true, backgroundColor: null, logging: false });
        urls.push(canvas.toDataURL('image/png'));
        setReel({ pct: Math.round(((i + 1) / cards.length) * 30), stage: 'Rendering cards' });
      }
      setActive(keep);

      const { blob, mime } = await renderCardReel(urls, {
        secondsPerCard: 2.6,
        onProgress: ({ pct }) => setReel({ pct: 30 + Math.round(pct * 0.7), stage: 'Building the reel' }),
      });

      const link = document.createElement('a');
      link.download = `iroxanne-reel.${mime.includes('mp4') ? 'mp4' : 'webm'}`;
      link.href = URL.createObjectURL(blob);
      link.click();
      toast({ title: 'Reel downloaded', description: `${cards.length} cards, about ${Math.round(cards.length * 2.6)} seconds, 1080 x 1920.` });
    } catch (e) {
      setActive(keep);
      toast({ title: 'Could not build the reel', description: e.message, variant: 'destructive' });
    } finally {
      setReel(null);
    }
  };

  const addCard = () => {
    setCards((cs) => [...cs, { layout: 'statement', palette: 'cream', headline: 'Your line here.', body: '' }]);
    setActive(cards.length);
  };

  const removeCard = () => {
    if (cards.length <= 1) return;
    setCards((cs) => cs.filter((_, i) => i !== active));
    setActive((a) => Math.max(0, a - 1));
  };

  const setItem = (idx, value) => patch({ items: (card.items || []).map((it, i) => (i === idx ? value : it)) });

  // Jade's sets land at the end of the board and the first one opens, so her
  // work is on screen rather than something you have to go looking for.
  const addFromJade = useCallback((incoming) => {
    setCards((cs) => {
      const next = [...cs, ...incoming.map((c) => ({ palette: 'cream', layout: 'statement', ...c }))];
      setActive(cs.length);
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold">Card studio</h1>
        <p className="text-sm text-muted-foreground">
          One idea per card, big type, your wordmark identical every time. Type a line, pick a colour, download at 1080 x 1350.
        </p>
      </div>

      {/* Card selector */}
      <div className="flex flex-wrap gap-1.5">
        {cards.map((c, i) => (
          <button
            key={i} onClick={() => setActive(i)}
            className={`rounded-full px-3 py-1 text-xs ${i === active ? 'bg-primary text-primary-foreground font-semibold' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'}`}
          >
            {i + 1}. {(c.headline || 'Untitled').split('\n')[0].slice(0, 22)}
          </button>
        ))}
        <button onClick={addCard} className="rounded-full bg-secondary/60 px-2.5 py-1 text-xs hover:text-foreground" title="Add a card">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
        {/* Controls */}
        <div className="space-y-4">
          <JadeCardPanel onCards={addFromJade} currentCount={cards.length} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Layout</Label>
              <select
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={card.layout} onChange={(e) => patch({ layout: e.target.value })}
              >
                {Object.entries(LAYOUTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <select
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={card.palette} onChange={(e) => patch({ palette: e.target.value })}
              >
                {Object.entries(PALETTES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Headline</Label>
            <Textarea rows={3} value={card.headline || ''} onChange={(e) => patch({ headline: e.target.value })} />
            <p className="text-xs text-muted-foreground">Press Enter to control where lines break.</p>
          </div>

          {['checklist', 'list'].includes(card.layout) && (
            <div className="space-y-1.5">
              <Label>{card.layout === 'checklist' ? 'What they don’t need' : 'Who it’s for'}</Label>
              {(card.items || []).map((it, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input value={it} onChange={(e) => setItem(i, e.target.value)} />
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive"
                    onClick={() => patch({ items: card.items.filter((_, j) => j !== i) })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-1"
                onClick={() => patch({ items: [...(card.items || []), ''] })}>
                <Plus className="h-3.5 w-3.5" /> Add line
              </Button>
            </div>
          )}

          {card.layout === 'photo' && (
            <div className="space-y-1.5">
              <Label>Photo URL</Label>
              <Input value={card.imageUrl || ''} onChange={(e) => patch({ imageUrl: e.target.value })} placeholder="https://…" />
              <p className="text-xs text-muted-foreground">Any image from your media library. Must allow cross-origin loading to export.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{card.layout === 'checklist' || card.layout === 'photo' ? 'Handwritten line' : 'Supporting line'}</Label>
            <Textarea rows={2} value={card.body || ''} onChange={(e) => patch({ body: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Headline size: {card.headlineSize || 92}px</Label>
            <input type="range" min="52" max="120" step="2" className="w-full"
              value={card.headlineSize || 92} onChange={(e) => patch({ headlineSize: Number(e.target.value) })} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={download} disabled={busy || !!reel} className="gap-1.5 flex-1">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PNG
            </Button>
            <Button variant="outline" onClick={removeCard} disabled={cards.length <= 1 || !!reel} className="shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-xl border border-border/60 p-3 space-y-2">
            <Button variant="outline" onClick={makeReel} disabled={!!reel || busy} className="w-full gap-1.5">
              {reel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              {reel ? `${reel.stage}… ${reel.pct}%` : `Make a reel from all ${cards.length} cards`}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Vertical 1080 x 1920, about {Math.round(cards.length * 2.6)} seconds. Cards play in the order above, so reorder by editing before exporting. Keep this tab visible while it renders.
            </p>
          </div>
        </div>

        {/* Preview. The card renders at full size and is scaled down visually, so
            what downloads is exactly what is on screen. */}
        <div className="flex justify-center">
          <div style={{ width: CARD_W * 0.34, height: CARD_H * 0.34 }} className="rounded-xl overflow-hidden shadow-lg shrink-0">
            <div style={{ transform: 'scale(0.34)', transformOrigin: 'top left' }}>
              <CardCanvas card={card} innerRef={stageRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
