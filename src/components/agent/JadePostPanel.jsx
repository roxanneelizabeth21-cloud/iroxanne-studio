import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AgentMessageBubble from '@/components/agent/AgentMessageBubble';
import VoiceInputButton from '@/components/agent/VoiceInputButton';
import JadeAvatar from '@/components/agent/JadeAvatar';
import { resolveMedia } from '@/lib/postValidation';

const AGENT = 'social_media_marketer';
const CONTEXT_MARK = '[POST CONTEXT]';

/**
 * What Jade is told about the post when the panel opens. Plain text so the agent
 * can read it; filtered out of the visible transcript so Roxanne never sees it.
 *
 * The screenshot URLs matter most here: without them Jade invents a scene, which
 * is exactly the failure that made the graphics generic.
 */
export function buildPostContext(post, { portfolioTitle, screenshots = [], media }) {
  const lines = [
    CONTEXT_MARK,
    `post_id: ${post.id}`,
    `subject: ${portfolioTitle || '(no portfolio project chosen yet)'}`,
    post.portfolio_item_id ? `portfolio_item_id: ${post.portfolio_item_id}` : '',
    screenshots.length
      ? `real screenshots on file for this app (${screenshots.length}). Use these as reference_asset_urls and never redraw or approximate the interface:\n${screenshots.map((s) => `  - ${s.title || 'screen'}: ${s.image_url}`).join('\n')}`
      : 'real screenshots on file: none. Use the cover image or a type-led card; do not invent an app screen.',
    `platforms: ${(post.publish_targets || []).join(', ') || post.platform || ''}`,
    `format: ${post.format || ''}${post.requested_aspect_ratio ? ` (${post.requested_aspect_ratio})` : ''}`,
    `media: ${media?.url ? `${media.type || 'image'} attached` : 'none attached'}`,
    `status: ${post.status || 'Draft'}${post.scheduled_date ? ` · scheduled ${post.scheduled_date} ${post.scheduled_time || ''}` : ' · not scheduled'}`,
    `hook: ${post.hook || ''}`,
    `caption: ${post.caption || ''}`,
    `hashtags: ${post.hashtags || ''}`,
    `cta: ${post.cta || ''}`,
    post.admin_notes ? `owner notes / prior feedback: ${post.admin_notes}` : '',
    '',
    'Roxanne opened you inside this post. Greet her as Jade in one line and give ONE specific suggestion for this post. Edit only this post when asked. Never approve, schedule or publish from here.',
  ];
  return lines.filter((l) => l !== '').join('\n');
}

export default function JadePostPanel({ post, portfolioTitle, screenshots = [], clips = [] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const seeded = useRef(false);
  const lastAgentCount = useRef(0);
  const scroller = useRef(null);

  const { data: brand } = useQuery({
    queryKey: ['brand-profile'],
    queryFn: async () => (await base44.entities.BrandProfile.list('-updated_date', 1))[0] || null,
    staleTime: 600000,
  });

  // The seed block is instruction, not conversation. Keep it out of the view.
  const visible = messages.filter((m) => !(m.role === 'user' && String(m.content || '').startsWith(CONTEXT_MARK)));

  // One conversation per post, so returning to the post returns to the thread.
  const open = useCallback(async (fresh = false) => {
    if (!post?.id) return;
    setLoading(true);
    try {
      let conv = null;
      if (!fresh) {
        const existing = await base44.agents.listConversations({
          q: { agent_name: AGENT }, sort: '-updated_date', limit: 50,
        }).catch(() => []);
        conv = (existing || []).find((c) => c.metadata?.post_id === post.id) || null;
      }
      if (!conv) {
        conv = await base44.agents.createConversation({
          agent_name: AGENT,
          metadata: {
            name: `Jade · ${portfolioTitle || 'post'}`,
            description: `In-post chat for MarketingPost ${post.id}`,
            post_id: post.id,
          },
        });
        seeded.current = false;
      }
      setConversation(conv);
      setMessages(conv.messages || []);
      lastAgentCount.current = (conv.messages || []).filter((m) => m.role === 'assistant').length;
    } catch {
      toast({ title: 'Could not open Jade for this post', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [post?.id, portfolioTitle, toast]);

  useEffect(() => { open(); }, [open]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  // Seed the context once per fresh thread.
  useEffect(() => {
    if (!conversation?.id || seeded.current) return;
    if ((conversation.messages || []).length > 0) { seeded.current = true; return; }
    seeded.current = true;
    const media = resolveMedia(post, clips);
    base44.agents.addMessage(conversation, {
      role: 'user',
      content: buildPostContext(post, { portfolioTitle, screenshots, media }),
    }).catch(() => { seeded.current = false; });
  }, [conversation, post, portfolioTitle, screenshots, clips]);

  // Jade edits the post through her tools; refresh the editor when she replies.
  useEffect(() => {
    const count = messages.filter((m) => m.role === 'assistant' && m.content).length;
    if (count > lastAgentCount.current) {
      lastAgentCount.current = count;
      qc.invalidateQueries({ queryKey: ['marketing-post', post?.id] });
    }
  }, [messages, qc, post?.id]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [visible.length]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || !conversation || sending) return;
    setSending(true);
    setInput('');
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content });
    } catch {
      toast({ title: 'Message not sent', variant: 'destructive' });
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const quick = screenshots.length
    ? ['Make the hook shorter', 'Use a real screenshot for the graphic', 'Rewrite this for Instagram']
    : ['Make the hook shorter', 'Rewrite this for Instagram', 'Suggest a stronger angle'];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <JadeAvatar src={brand?.agent_avatar_url} size={36} />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">Jade</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {loading ? 'Opening…' : 'Knows this post. Ask her to change it.'}
          </p>
        </div>
        <Button
          variant="ghost" size="icon" className="ml-auto h-8 w-8"
          onClick={() => open(true)} disabled={loading || sending}
          title="Start a fresh conversation for this post" aria-label="Restart conversation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div ref={scroller} className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
        {loading && <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
        {!loading && visible.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">
            Jade is reading this post. She can rewrite the hook or caption, or build the graphic from a real screenshot.
          </p>
        )}
        {visible.map((m, i) => <AgentMessageBubble key={m.id || i} message={m} />)}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {quick.map((q) => (
          <button
            key={q} type="button" onClick={() => send(q)} disabled={!conversation || sending}
            className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-1.5">
        <Textarea
          rows={2} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask Jade to change this post…"
          disabled={!conversation || sending}
          className="min-h-0 resize-none text-sm"
        />
        <VoiceInputButton onResult={(t) => setInput((v) => (v ? `${v} ${t}` : t))} disabled={!conversation || sending} />
        <Button onClick={() => send()} disabled={!input.trim() || sending || !conversation} size="icon" aria-label="Send to Jade">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Jade drafts and edits. She never approves, schedules or publishes.</p>
    </div>
  );
}
