import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sparkles, PenLine, Undo2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { SOCIAL_PLATFORMS, entityValue } from '@/lib/socialPlatforms';
import { generationNote, formatForAspect } from '@/lib/createPost';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

const TWEAKS = [
  ['Make More Personal', 'Rewrite it more personally, in first person, warmer.'],
  ['Make Shorter', 'Rewrite it noticeably shorter and tighter.'],
  ['Make More Conversational', 'Rewrite it in a relaxed, conversational voice.'],
  ['Try a Different Angle', 'Take a genuinely different angle on the same project and goal.'],
];

// Step 3 — platform choice, generated or hand-written copy, and the real CTA link.
export default function StepCopy({ draft, patch, post, patchPost, linkOptions, projectTitle }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState('');
  const [mode, setMode] = useState(post.caption ? 'edit' : '');
  const [undoState, setUndoState] = useState(null);
  const [adaptFor, setAdaptFor] = useState('');

  // Changing platforms saves the new choice immediately and keeps every other
  // part of the draft — music, media, visual direction and copy all stay.
  const togglePlatform = (id) => {
    const next = draft.platformIds.includes(id)
      ? draft.platformIds.filter((p) => p !== id)
      : [...draft.platformIds, id];
    if (!next.length) return;
    patch({ platformIds: next });
    if (String(post.caption || '').trim()) {
      setAdaptFor(next.map((p) => entityValue(p)).join(' and '));
    }
  };

  const wantsVertical = draft.platformIds.some((p) => ['tiktok', 'youtube'].includes(p));
  const aspect = post.requested_aspect_ratio || draft.aspect;

  const generate = async (only) => {
    setBusy(only || 'all');
    try {
      const primary = entityValue(draft.platformIds[0]) || 'Instagram';
      const note = `${generationNote(draft, draft.link)}${only ? ` Return a fresh ${only} only; the rest of the post is already approved.` : ''}${
        draft.platformIds.length > 1 ? ` This same copy will be used on ${draft.platformIds.map((p) => entityValue(p)).join(' and ')}.` : ''
      }`;
      const res = await base44.functions.invoke('quickCreate', {
        portfolio_item_id: draft.portfolioItemId,
        platform: primary,
        note,
      });
      const data = res?.data ?? res;
      if (data?.error) throw new Error(data.error);
      const gen = data.post || {};
      setUndoState({ hook: post.hook, caption: post.caption, cta: post.cta, hashtags: post.hashtags });
      const patchFields = only
        ? { [only]: gen[only] || '' }
        : {
          hook: gen.hook || '',
          caption: gen.caption || '',
          cta: gen.cta || '',
          hashtags: gen.hashtags || '',
          image_prompt: gen.image_prompt || post.image_prompt || '',
          content_bucket: gen.content_bucket || post.content_bucket || '',
          original_ai_caption: post.original_ai_caption || gen.caption || '',
        };
      await patchPost({ ...patchFields, format: post.format || formatForAspect(draft.aspect) });
      setMode('edit');
      toast({ title: only ? `New ${only} ready` : 'Copy created' });
    } catch (e) {
      toast({ title: 'Could not create the copy', description: e?.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const tweak = async (instruction) => {
    setBusy('tweak');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Rewrite this social caption for iRoxanne Studio, about "${projectTitle}". ${instruction}
Keep it truthful: never invent results, metrics, quotes, testimonials, prices or links. Keep any existing link exactly as written.

Current caption:
${post.caption || ''}

Return only the rewritten caption text.`,
      });
      const text = typeof res === 'string' ? res : (res?.caption || '');
      if (!text.trim()) throw new Error('Nothing was returned');
      setUndoState({ hook: post.hook, caption: post.caption, cta: post.cta, hashtags: post.hashtags });
      await patchPost({ caption: text.trim() });
    } catch (e) {
      toast({ title: 'Rewrite failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const undo = async () => {
    if (!undoState) return;
    await patchPost(undoState);
    setUndoState(null);
    toast({ title: 'Reverted the last change' });
  };

  const field = (label, key, rows) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className={FL} htmlFor={`cp-${key}`}>{label}</label>
        <Button type="button" size="sm" variant="ghost" onClick={() => generate(key)} disabled={!!busy} className="gap-1 h-7 text-xs">
          {busy === key ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Regenerate
        </Button>
      </div>
      {rows ? (
        <Textarea id={`cp-${key}`} rows={rows} value={post[key] || ''} onChange={(e) => patchPost({ [key]: e.target.value }, true)} />
      ) : (
        <Input id={`cp-${key}`} value={post[key] || ''} onChange={(e) => patchPost({ [key]: e.target.value }, true)} />
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">Create your post</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose where it goes, then generate the words or write them yourself.</p>
      </div>

      <div className="space-y-2">
        <span className={FL} id="cp-platform-label">Where should this go?</span>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="cp-platform-label">
          {SOCIAL_PLATFORMS.map((p) => {
            const on = draft.platformIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/60 hover:border-primary/40'}`}
              >
                <p.Icon className="h-4 w-4" aria-hidden="true" /> {p.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Instagram and Facebook publish from here. TikTok and YouTube have no publishing connection — you post those yourself with the share tools in the last step.
        </p>
        {wantsVertical && aspect !== '9:16' && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Your media is {aspect}. TikTok and YouTube look best at 9:16 — nothing was removed, you can change the format on the Media step if you want.
          </p>
        )}
        {adaptFor && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-2" role="status">
            <p className="text-sm">Would you like to adapt the copy for {adaptFor}?</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setAdaptFor('')}>Keep Current Copy</Button>
              <Button type="button" size="sm" onClick={() => { setAdaptFor(''); generate(''); }} disabled={!!busy} className="gap-1.5">
                {busy === 'all' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Adapt Copy
              </Button>
            </div>
          </div>
        )}
      </div>

      {draft.reviewRecommended && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Review recommended — you changed an earlier answer, so check this copy still fits. Nothing was deleted.
        </p>
      )}

      {!mode && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => generate('')} disabled={!!busy} className="gap-2">
            {busy === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate Copy
          </Button>
          <Button type="button" variant="outline" onClick={() => setMode('edit')} className="gap-2">
            <PenLine className="h-4 w-4" /> Write My Own
          </Button>
        </div>
      )}

      {mode === 'edit' && (
        <div className="space-y-4">
          {field('Hook', 'hook')}
          {field('Caption', 'caption', 6)}
          {field('Call to action', 'cta')}
          {field('Hashtags', 'hashtags', 2)}

          <div className="space-y-1.5">
            <span className={FL}>Adjust the caption</span>
            <div className="flex flex-wrap gap-2">
              {TWEAKS.map(([label, instruction]) => (
                <Button key={label} type="button" size="sm" variant="outline" onClick={() => tweak(instruction)} disabled={!!busy} className="text-xs">
                  {busy === 'tweak' ? <Loader2 className="h-3 w-3 animate-spin" /> : null} {label}
                </Button>
              ))}
              {undoState && (
                <Button type="button" size="sm" variant="ghost" onClick={undo} className="text-xs gap-1">
                  <Undo2 className="h-3 w-3" /> Undo last change
                </Button>
              )}
            </div>
          </div>

          {draft.platformIds.includes('youtube') && (
            <p className="text-xs text-muted-foreground">
              For YouTube the hook is used as the title and the caption as the description. Nothing is uploaded to YouTube from here.
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label className={FL} htmlFor="cp-link">Call-to-action link</label>
        {linkOptions.length ? (
          <>
            <select id="cp-link" value={draft.link} onChange={(e) => patch({ link: e.target.value })}>
              <option value="">No link</option>
              {linkOptions.map((l) => <option key={l.url} value={l.url}>{l.label}</option>)}
            </select>
            {draft.link && <p className="text-xs text-muted-foreground break-all">{draft.link}</p>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No campaign link is currently saved. You can continue without one.</p>
        )}
      </div>

      {mode === 'edit' && !String(post.caption || '').trim() && (
        <p className="text-xs text-muted-foreground">Add a caption to continue.</p>
      )}
    </div>
  );
}