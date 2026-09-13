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
  'Draft my first Facebook post as a warm welcome: tell the story of my passion for helping people bring their dreams to life through iRoxanne Studio. Gently invite friends to like the page and follow along, without sales pressure. Save for review.',
  'What’s been performing best this month based on the metrics we have?',
  'Create two complete Facebook drafts with finished, distinct plum/cream/gold graphics: one helps someone imagine their idea becoming useful, and one gently welcomes referrals from friends. Speak to nontechnical people in my personal voice. Save for review.',
];

export default function SocialMarketer() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const bottomRef = useRef(null);
  const { speaking, stop: stopSpeaking } = useSpokenReplies(messages, voiceOn);

  const start = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: AGENT,
      metadata: { name: 'iRoxanne Studio strategy', description: 'Custom app builds and personal build guidance. Warm Facebook storytelling, two posts weekly, drafts for review.' },
    });
    setConversation(conv);
    setMessages(conv.messages || []);
  };

  useEffect(() => { start(); }, []);

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
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] min-h-[26rem]">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h2 className="font-display text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Social Strategist
          </h2>
          <p className="text-xs text-muted-foreground">Personal stories, possibilities and thoughtful referrals — with finished graphics.</p>
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
          <Button variant="ghost" size="sm" onClick={start} className="gap-1.5">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 rounded-xl border border-border/50 bg-secondary/20 p-4">
        {!conversation && (
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