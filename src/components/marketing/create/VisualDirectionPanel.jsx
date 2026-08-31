import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Wand2, Sparkles, RefreshCw, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { effectiveGoal, formatForAspect } from '@/lib/createPost';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

const DIRECTION_SCHEMA = {
  type: 'object',
  properties: {
    creative_concept: { type: 'string' },
    mood: { type: 'string' },
    subject: { type: 'string' },
    setting: { type: 'string' },
    composition: { type: 'string' },
    lighting: { type: 'string' },
    color_direction: { type: 'string' },
    text_overlay: { type: 'string' },
    reason_for_match: { type: 'string' },
  },
};

const CHOICES = [
  { key: 'no_person', label: 'No person' },
  { key: 'artwork', label: 'Use approved artwork' },
  { key: 'photo', label: 'Use approved photograph' },
  { key: 'text_free', label: 'Text-free image' },
  { key: 'with_text', label: 'Image with approved text' },
];

// Builds a plain-language Visual Direction from the real project/campaign context,
// then generates a real image through the existing generateMarketingImage function.
export default function VisualDirectionPanel({ draft, post, songContext, aspect, onAttached }) {
  const { toast } = useToast();
  const [direction, setDirection] = useState(null);
  const [own, setOwn] = useState('');
  const [ownMode, setOwnMode] = useState(false);
  const [choices, setChoices] = useState({ text_free: true });
  const [overlay, setOverlay] = useState('');
  const [busy, setBusy] = useState('');
  const [history, setHistory] = useState([]);
  const [revision, setRevision] = useState('');

  const toggle = (k) => setChoices((c) => ({ ...c, [k]: !c[k], ...(k === 'text_free' ? { with_text: false } : k === 'with_text' ? { text_free: false } : {}) }));

  const suggest = async () => {
    setBusy('suggest');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an art director for the app-development studio iRoxanne Studio. Propose ONE visual direction for a single social image.

Project: ${songContext.title || 'untitled'}
Project type: ${songContext.releaseType || ''}
Project status: ${songContext.status || ''}
Themes: ${songContext.themes || ''}
Story: ${songContext.story || ''}
Key details / highlights: ${songContext.keyLines || ''}
Project category / identity: ${songContext.genre || ''}
Campaign: ${songContext.campaignName || ''} ${songContext.campaignGoal || ''}
Post goal: ${effectiveGoal(draft)}
Owner instruction: ${draft.instruction || 'none'}
Aspect ratio: ${aspect}
Brand image rules: ${songContext.imageStyleNotes || ''}

Vary the aesthetic to suit THIS project specifically. Avoid repeating generic stock clichés (generic mockups, flat backgrounds, empty screenshots) unless the project truly calls for it. Never invent quotes or metrics: only use the real details above, and only if a text overlay genuinely helps.
Return concise plain-language values for: creative_concept, mood, subject, setting, composition, lighting, color_direction, text_overlay (empty string when the image should be text-free), reason_for_match.`,
        response_json_schema: DIRECTION_SCHEMA,
      });
      const d = res && typeof res === 'object' ? res : null;
      if (!d?.creative_concept) throw new Error('No direction returned');
      setDirection(d);
      setOverlay(choices.with_text ? (d.text_overlay || '') : '');
      setOwnMode(false);
    } catch (e) {
      toast({ title: 'Could not build a direction', description: e.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const generate = async (variation) => {
    const concept = ownMode ? own.trim() : direction?.creative_concept;
    if (!concept) {
      toast({ title: 'Add a direction first', variant: 'destructive' });
      return;
    }
    setBusy('generate');
    try {
      const avoid = [];
      if (choices.no_person) avoid.push('no people, no faces, no hands');
      const preserve = [];
      if (choices.artwork) preserve.push('the mood and palette of the approved release artwork');
      if (choices.photo) preserve.push('a photographic, real-world treatment');

      const res = await base44.functions.invoke('generateMarketingImage', {
        post_id: post.id,
        campaign_id: draft.campaignId || '',
        release_id: draft.releaseId || '',
        track_id: draft.trackId || '',
        platform: post.platform,
        format: formatForAspect(aspect),
        aspect_ratio: aspect,
        prompt: concept,
        visual_direction: ownMode ? { creative_concept: concept } : direction,
        text_overlay: choices.with_text ? overlay : '',
        elements_to_avoid: avoid.join('; '),
        elements_to_preserve: preserve.join('; '),
        reference_asset_urls: choices.artwork && songContext.artworkUrl ? [songContext.artworkUrl] : [],
        regenerate: !!variation,
        variation_instruction: variation || '',
        original_request: `${effectiveGoal(draft)} — ${draft.instruction || ''}`.trim(),
      });
      const d = res?.data || {};
      if (!d.ok || !d.image_url) throw new Error(d.error || 'Image generation failed');
      setHistory((h) => (post.media_file_url ? [post.media_file_url, ...h] : h));
      onAttached(d.image_url, d.aspect_ratio);
      toast({ title: 'Image generated and saved to your Gallery' });
    } catch (e) {
      toast({ title: 'Generation failed', description: e?.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const row = (label, value) => value ? (
    <div className="text-xs"><span className="text-muted-foreground">{label}: </span>{value}</div>
  ) : null;

  return (
    <div className="rounded-xl border border-border/60 p-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={suggest} disabled={!!busy} className="gap-1.5">
          {busy === 'suggest' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {direction ? 'Change Direction' : 'Suggested direction'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOwnMode((v) => !v)} className="gap-1.5">
          <PenLine className="h-3.5 w-3.5" /> Enter my own direction
        </Button>
      </div>

      {ownMode && (
        <Textarea value={own} onChange={(e) => setOwn(e.target.value)} rows={3} aria-label="Your own visual direction" placeholder="Describe the image you want" />
      )}

      <div className="space-y-1.5">
        <span className={FL}>Image choices</span>
        <div className="flex flex-wrap gap-2">
          {CHOICES.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={!!choices[c.key]}
              onClick={() => toggle(c.key)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs ${choices[c.key] ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/60 hover:border-primary/40'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {choices.with_text && (
          <Textarea value={overlay} onChange={(e) => setOverlay(e.target.value)} rows={2} aria-label="Approved text for the image" placeholder="Exact text to render in the image" />
        )}
      </div>

      {direction && !ownMode && (
        <div className="rounded-lg bg-secondary/40 p-2.5 space-y-1">
          {row('Concept', direction.creative_concept)}
          {row('Mood', direction.mood)}
          {row('Subject', direction.subject)}
          {row('Setting', direction.setting)}
          {row('Composition', direction.composition)}
          {row('Text', choices.with_text ? (overlay || 'text to be added') : 'No text in the image')}
          {row('Why it matches', direction.reason_for_match)}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => generate('')} disabled={!!busy} className="gap-1.5">
          {busy === 'generate' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Generate Image
        </Button>
        {post.media_file_url && (
          <Button type="button" size="sm" variant="outline" onClick={() => generate(revision || 'try a different composition')} disabled={!!busy} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </Button>
        )}
      </div>
      {post.media_file_url && (
        <Textarea value={revision} onChange={(e) => setRevision(e.target.value)} rows={2} aria-label="What to change when regenerating" placeholder="Optional: what should change next time" />
      )}

      {!!history.length && (
        <div className="space-y-1">
          <span className={FL}>Earlier versions</span>
          <div className="flex gap-2 overflow-x-auto">
            {history.map((u) => (
              <img key={u} src={u} alt="Earlier version" className="h-16 w-16 rounded object-cover border border-border/60" />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Every version stays saved in your Gallery.</p>
        </div>
      )}
    </div>
  );
}