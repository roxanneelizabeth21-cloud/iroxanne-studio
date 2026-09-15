import { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AgentMessageBubble from '@/components/agent/AgentMessageBubble';
import VoiceInputButton from '@/components/agent/VoiceInputButton';
import JadeAvatar from '@/components/agent/JadeAvatar';

const AGENT = 'social_media_marketer';
const MARK = '[CARD STUDIO]';

// Jade writes the words; the template renders them identically every time.
// She replies with a fenced JSON block, which this panel parses and hands back
// to the studio. Anything she says outside the block is shown as normal chat.
const BRIEF = `${MARK}
You are writing copy for the iRoxanne Studio card maker. These are single-idea social cards: big type on a colour field, the studio wordmark at the bottom. No app screenshots, no photographs unless the layout is "photo".

The rule for every card: say the thing the reader is already thinking, then answer it in one line. Speak to the reader about themselves, never about what Roxanne can do. "You don't need a business name, a finished plan, a list of features. You just need a starting point." is right. "I build custom apps around your life." is wrong, because it is a competence claim and it is about her, not them.

One idea per card. Short lines. Use \\n to control where lines break, because these are set large.

Layouts:
  statement  headline + optional supporting line. The workhorse.
  checklist  headline + items that get struck through + a handwritten closing line. Use for what the reader thinks they need and does not.
  list       headline + bulleted items + optional closing. Use for who this is for.
  photo      headline set in small spaced capitals over an image, + optional handwritten line. Use for the moment before someone starts.

Palettes: forest, cream, blush, sage, ink.

When Roxanne asks for cards, reply with one short sentence and then a JSON block exactly like this, fenced with three backticks and the word json:

\`\`\`json
{"cards":[{"layout":"statement","palette":"forest","headline":"You have the idea.\\nI'll help you bring\\nit to life.","body":"Custom apps and websites for real people, real goals, real impact."},{"layout":"checklist","palette":"cream","headline":"You don't need…","items":["A business name","A finished plan","A list of features"],"body":"You just need\\na starting point."}]}
\`\`\`

Include only the keys a layout uses. Never invent a logo or describe an image; the template handles all of that. Do not call any tools for this: these cards are not MarketingPost records unless Roxanne asks you to save one.`;

export function extractCards(text) {
  const match = String(text || '').match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    const cards = Array.isArray(parsed) ? parsed : parsed.cards;
    if (!Array.isArray(cards) || cards.length === 0) return null;
    return cards.filter((c) => c && typeof c.headline === 'string');
  } catch {
    return null;
  }
}

export default function JadeCardPanel({ onCards, currentCount }) {
  const { toast } = useToast();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const seeded = useRef(false);
  const handled = useRef(new Set());
  const scroller = useRef(null);

  const visible = messages.filter((m) => !(m.role === 'user' && String(m.content || '').startsWith(MARK)));

  const open = useCallback(async (fresh = false) => {
    setLoading(true);
    try {
      let conv = null;
      if (!fresh) {
        const existing = await base44.agents.listConversations({ q: { agent_name: AGENT }, sort: '-updated_date', limit: 50 }).catch(() => []);
        conv = (existing || []).find((c) => c.metadata?.surface === 'card_studio') || null;
      }
      if (!conv) {
        conv = await base44.agents.createConversation({
          agent_name: AGENT,
          metadata: { name: 'Jade · Card studio', description: 'Writes copy for the marketing card maker', surface: 'card_studio' },
        });
        seeded.current = false;
      }
      setConversation(conv);
      setMessages(conv.messages || []);
      (conv.messages || []).forEach((m) => m.id && handled.current.add(m.id));
    } catch {
      toast({ title: 'Could not open Jade', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { open(); }, [open]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (d) => setMessages(d.messages || []));
    return () => unsub();
  }, [conversation?.id]);

  useEffect(() => {
    if (!conversation?.id || seeded.current) return;
    if ((conversation.messages || []).length > 0) { seeded.current = true; return; }
    seeded.current = true;
    base44.agents.addMessage(conversation, { role: 'user', content: BRIEF })
      .catch(() => { seeded.current = false; });
  }, [conversation]);

  // Pull cards out of any new reply and hand them to the studio.
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== 'assistant' || !m.content) continue;
      const key = m.id || m.content.slice(0, 40);
      if (handled.current.has(key)) continue;
      const cards = extractCards(m.content);
      handled.current.add(key);
      if (cards?.length) {
        onCards(cards);
        toast({ title: `${cards.length} card${cards.length > 1 ? 's' : ''} from Jade`, description: 'Added below. Edit anything you like.' });
      }
    }
  }, [messages, onCards, toast]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [visible.length]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || !conversation || sending) return;
    setSending(true); setInput('');
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content });
    } catch {
      toast({ title: 'Message not sent', variant: 'destructive' });
      setInput(content);
    } finally { setSending(false); }
  };

  const quick = [
    'Write 5 cards for someone who has an idea but does not feel ready',
    'Five more, different angle',
    'One card about not needing a finished plan',
  ];

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <JadeAvatar size={34} />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">Jade writes the cards</p>
          <p className="text-[11px] text-muted-foreground">
            {loading ? 'Opening…' : `Ask for a set. ${currentCount} on the board.`}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => open(true)}
          disabled={loading || sending} title="Start fresh" aria-label="Start a fresh conversation">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div ref={scroller} className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
        {loading && <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
        {!loading && visible.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">
            Ask her for a set of cards. She writes the words, the template keeps them consistent.
          </p>
        )}
        {visible.map((m, i) => <AgentMessageBubble key={m.id || i} message={m} />)}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {quick.map((q) => (
          <button key={q} type="button" onClick={() => send(q)} disabled={!conversation || sending}
            className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-50">
            {q}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-1.5">
        <Textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask Jade for cards…" disabled={!conversation || sending}
          className="min-h-0 resize-none text-sm" />
        <VoiceInputButton onResult={(t) => setInput((v) => (v ? `${v} ${t}` : t))} disabled={!conversation || sending} />
        <Button onClick={() => send()} disabled={!input.trim() || sending || !conversation} size="icon" aria-label="Send to Jade">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
