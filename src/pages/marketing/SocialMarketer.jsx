import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Plus, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AgentMessageBubble from '@/components/agent/AgentMessageBubble';
import VoiceInputButton from '@/components/agent/VoiceInputButton';
import useSpokenReplies from '@/hooks/useSpokenReplies';

const AGENT = 'social_media_marketer';
const STARTERS = [
  // Business operating cycle
  'Give me a business status digest: new quote requests, proposals awaiting my review, contracts and invoices overdue for action, and the next thing I should do.',
  'Read the marked test quote request and prepare a proposal draft in test mode. Leave the price for me to set. Show me the review link and the next action.',
  'Which client records are overdue for an owner action right now? Prepare a follow-up draft for the most urgent one — do not send it.',
  // Marketing operating cycle
  'Draft my first Facebook post as a warm welcome: tell the story of my passion for helping people bring their dreams to life through iRoxanne Studio. Gently invite friends to like the page and follow along, without sales pressure. Save for review.',
  'What’s been performing best this month based on the metrics we have?',
  'Create two complete Facebook drafts with finished, distinct plum/cream/gold graphics: one helps someone imagine their idea becoming useful, and one gently welcomes referrals from friends. Speak to nontechnical people in my personal voice. Save for review.',
];

export default function SocialMarketer() {
  const [conversation, setConversation] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const boot = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(() => new URLSearchParams(window.location.search).has('weekly') ? 'Create four weekly stories for Facebook and Instagram, with tailored captions and finished graphics for each. Save drafts for my review; do not publish. Use my personal, sophisticated, people-first direction.' : '');
  const [sending, setSending] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const bottomRef = useRef(null);
  const { speaking, stop: stopSpeaking } = useSpokenReplies(messages, voiceOn);

  const openConversation = async (id) => {
    setLoading(true); setError('');
    try {
      const conv = await base44.agents.getConversation(id);
      if (!conv || conv.agent_name !== AGENT) throw new Error('This conversation could not be opened.');
      setConversation(conv); setMessages(conv.messages || []);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const start = async () => {
    setLoading(true); setError('');
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT,
        metadata: { name: 'iRoxanne Studio strategy', description: 'Four weekly stories for Facebook and Instagram. Personal approval required.' }
      });
      setConversation(conv); setMessages(conv.messages || []);
      setHistory(items => [conv, ...items]);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // Reuse the latest conversation. React StrictMode must not create two chats.
    if (!boot.current) boot.current = base44.agents.listConversations({
      q: { agent_name: AGENT }, sort: '-updated_date', limit: 50
    }).then(async rows => {
      setHistory(rows || []);
      if (rows?.length) await openConversation(rows[0].id);
      else await start();
    }).catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || !conversation || sending) return;
    setInput('');
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content });
    } catch(e) {
      setInput(content); setError('Message was not sent: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] min-h-[26rem]">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h2 className="font-display text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Sam
          </h2>
          <p className="text-xs text-muted-foreground">Business & marketing operator — quotes, proposals, follow-ups, and content for your review.</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={voiceOn ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { if (voiceOn) stopSpeaking(); setVoiceOn(!voiceOn); }}
            className="gap-1.5"
          >
            {voiceOn ? <Volume2 className={`h-4 w-4 ${speaking ? 'text-primary' : ''}`} /> : <VolumeX className="h-4 w-4" />}
            {voiceOn ? (speaking ? 'Speaking' : 'Voice on') : 'Voice off'}
          </Button>
          <Button variant="ghost" size="sm" onClick={start} disabled={loading || sending} className="gap-1.5">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
      </div>

      <label className="text-sm mb-3">Conversation history
        <select className="mt-1 w-full rounded-lg border border-border bg-background text-foreground p-2" value={conversation?.id || ''} disabled={loading || sending} onChange={e => openConversation(e.target.value)}>
          <option value="" disabled>Select a conversation</option>
          {history.map(c => <option key={c.id} value={c.id}>{c.metadata?.name || 'Strategy conversation'} — {c.created_date ? new Date(c.created_date).toLocaleDateString() : c.id.slice(-6)}</option>)}
        </select>
      </label>
      {error && <p role="alert" className="text-sm text-destructive mb-2">{error}</p>}
      <div className="flex-1 overflow-y-auto space-y-3 rounded-xl border border-border/50 bg-secondary/20 p-4">
        {loading && (
          <div className="flex justify-center pt-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        )}
        {conversation && messages.length === 0 && (
          <div className="space-y-2 pt-6">
            <p className="text-center text-sm text-muted-foreground">Try one of these:</p>
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-left text-sm hover:border-primary/40"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => <AgentMessageBubble key={i} message={m} />)}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 pt-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask for post ideas, a campaign plan, or a performance read… or tap the mic and talk"
          rows={2}
          className="resize-none"
        />
        <VoiceInputButton
          disabled={!conversation || sending || speaking}
          onStart={stopSpeaking}
          onText={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))}
        />
        <Button onClick={() => send()} disabled={!input.trim() || sending || !conversation} size="icon" aria-label="Send message">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}