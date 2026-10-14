import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Plus, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import JadeAvatar from '@/components/agent/JadeAvatar';
import AgentMessageBubble from '@/components/agent/AgentMessageBubble';
import VoiceInputButton from '@/components/agent/VoiceInputButton';
import useSpokenReplies from '@/hooks/useSpokenReplies';

const AGENT = 'social_media_marketer';
const STARTERS = [
  { label: 'Business overview', prompt: 'What needs my attention in the studio today?' },
  { label: 'Create content', prompt: 'Help me create a post for iRoxanne Studio.' },
  { label: 'Plan my week', prompt: 'Help me plan my marketing for this week.' },
];

export default function SocialMarketer({request}) {
  const [conversation, setConversation] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const boot = useRef(null);
  const handledRequest = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const bottomRef = useRef(null);
  const { speaking, stop: stopSpeaking } = useSpokenReplies(messages, voiceOn);

  const openConversation = async (id) => {
    setLoading(true); setError('');
    try {
      const conv = await base44.agents.getConversation(id);
      if (!conv || conv.agent_name !== AGENT) throw new Error('This conversation could not be opened.');
      setConversation(conv); setMessages(conv.messages || []); setInput(''); stopSpeaking();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const start = async () => {
    setLoading(true); setError('');
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT,
        metadata: { name: 'iRoxanne Studio strategy', description: 'Business and marketing conversation with Nova.', surface: 'studio_chat' }
      });
      setConversation(conv); setMessages(conv.messages || []); setInput(''); stopSpeaking();
      setHistory(items => [conv, ...items]);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // Reuse the latest conversation. React StrictMode must not create two chats.
    if (!boot.current) boot.current = base44.agents.listConversations({
      q: { agent_name: AGENT }, sort: '-updated_date', limit: 50
    }).then(async rows => {
      const chats = (rows || []).filter(c => !c.metadata?.post_id && (!c.metadata?.surface || c.metadata.surface === 'studio_chat'));
      setHistory(chats);
      if (chats.length) await openConversation(chats[0].id);
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

  useEffect(() => { if (messages.length) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages]);

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

  useEffect(() => {
    if (!request || handledRequest.current === request.id || !conversation || loading || sending) return;
    handledRequest.current = request.id;
    send(request.text);
  }, [request, conversation, loading, sending]);

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] min-h-[26rem]">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h2 className="font-display text-xl flex items-center gap-2">
            <JadeAvatar size={40} /> Nova
          </h2>
          <p className="text-xs text-muted-foreground">Your studio partner for marketing, clients, email, and calendar.</p>
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

      <details className="mb-3"><summary className="cursor-pointer text-sm text-muted-foreground">Previous conversations · {history.length}</summary>
      <label className="block text-sm mt-2">Open a conversation
        <select className="mt-1 w-full rounded-lg border border-border bg-background text-foreground p-2" value={conversation?.id || ''} disabled={loading || sending} onChange={e => openConversation(e.target.value)}>
          <option value="" disabled>Select a conversation</option>
          {history.map(c => <option key={c.id} value={c.id}>{(c.messages || []).find(m => m.role === 'user' && m.content)?.content?.slice(0, 75) || c.metadata?.name || 'Conversation with Nova'} — {c.created_date ? new Date(c.created_date).toLocaleDateString() : c.id.slice(-6)}</option>)}
        </select>
      </label></details>
      {conversation && messages.length > 0 && <p className="mb-2 text-xs text-muted-foreground">Continuing your conversation. Your earlier messages are above; choose Previous conversations to revisit another chat.</p>}
      {error && <p role="alert" className="text-sm text-destructive mb-2">{error}</p>}
      <div className="flex-1 overflow-y-auto space-y-3 rounded-xl border border-border/50 bg-secondary/20 p-4">
        {loading && (
          <div className="flex justify-center pt-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        )}
        {conversation && messages.length === 0 && (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 py-6 text-center">
            <JadeAvatar size={52} />
            <h3 className="font-display text-2xl">What can I help with?</h3>
            <p className="text-sm text-muted-foreground">Tell me what you’re working on. We’ll take it from there.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {STARTERS.map((s) => (
                <button key={s.label} onClick={() => setInput(s.prompt)} className="rounded-full border border-border bg-card px-3 py-2 text-sm hover:border-primary/50">
                  {s.label}
                </button>
              ))}
            </div>
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
          aria-label="Message Nova"
          placeholder="Message Nova…"
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