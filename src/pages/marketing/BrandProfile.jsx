import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Save, Loader2, Plus, Trash2, Bell, Share2 } from 'lucide-react';
import { SOCIAL_PLATFORMS, isHttpsUrl } from '@/lib/socialPlatforms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_STYLE_PRESETS } from '@/lib/marketing';
import CanvaConnectCard from '@/components/marketing/CanvaConnectCard';
import GenerationSettingsCard from '@/components/marketing/GenerationSettingsCard';
import HowThisWorks from '@/components/marketing/HowThisWorks';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';
const HELP = 'text-xs text-muted-foreground/80';

// Sensible seeds for the first (and only) record.
const DEFAULTS = {
  artist_name: 'iRoxanne Studio',
  voice_description: '',
  genre_blend: '',
  audience_description: '',
  faith_integration_notes: '',
  writing_rules: 'No long em dashes\nNo corporate marketing speak\nWarm, conversational, direct',
  banned_words_phrases: '',
  example_captions: '',
  default_streaming_links: '',
  hashtag_bank: '',
  image_style_notes: 'No faces visible. No text or logos in image. Branding added separately in Canva.',
  image_style_presets: DEFAULT_STYLE_PRESETS,
  notify_email: '',
  notify_daily_posts: true,
  notify_weekly_digest: true,
  notify_release_countdown: true,
  notify_filming_nudge: true,
  notify_send_time: '08:00',
  posts_per_campaign_week: 4,
  posts_per_evergreen_week: 3,
  mix_loop_pct: 60,
  mix_authentic_pct: 25,
  mix_cta_pct: 15,
};

const FIELDS = [
  { key: 'artist_name', label: 'Studio name', type: 'input', help: 'Used throughout generated copy — always spelled exactly this way.' },
  { key: 'voice_description', label: 'Voice / tone', type: 'textarea', help: 'How the studio speaks to its audience. Shapes every caption.' },
  { key: 'genre_blend', label: 'What you build / for whom', type: 'textarea', help: 'What the studio builds and for whom — influences themes and references.' },
  { key: 'audience_description', label: 'Audience', type: 'textarea', help: 'Who the audience is — helps the AI pitch tone correctly.' },
  { key: 'faith_integration_notes', label: 'Positioning notes', type: 'textarea', help: 'When and how to emphasize the personal, real-person, not-an-agency angle.' },
  { key: 'writing_rules', label: 'Writing rules', type: 'textarea', help: 'Hard rules, one per line. These OVERRIDE generic content rules where they conflict.', rows: 4 },
  { key: 'banned_words_phrases', label: 'Banned words / phrases', type: 'textarea', help: 'Words or phrases the AI must never use.' },
  { key: 'example_captions', label: 'Example captions', type: 'textarea', help: 'Captions you love — used as style reference for the AI.', rows: 4 },
  { key: 'default_streaming_links', label: 'Default links', type: 'textarea', help: 'Standard links the AI can reference (portfolio URL, consult-booking URL, etc.).' },
  { key: 'hashtag_bank', label: 'Hashtag bank', type: 'textarea', help: 'Preferred hashtags by platform.' },
  { key: 'image_style_notes', label: 'Image style notes', type: 'textarea', help: 'Rules for AI image prompts (no faces, no text/logos…).' },
];

export default function BrandProfile() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [saving, setSaving] = useState(false);
  const inited = useRef(false);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['brand-profile'],
    queryFn: () => base44.entities.BrandProfile.list(),
  });

  // Single-record management: edit the existing record, or seed a default on first load.
  useEffect(() => {
    if (isLoading || inited.current) return;
    inited.current = true;
    if (list.length > 0) {
      const r = list[0];
      setRecordId(r.id);
      setForm({ ...DEFAULTS, ...r });
    } else {
      (async () => {
        try {
          const created = await base44.entities.BrandProfile.create({ ...DEFAULTS });
          setRecordId(created.id);
          setForm({ ...DEFAULTS, ...created });
          qc.invalidateQueries({ queryKey: ['brand-profile'] });
        } catch (e) {
          toast({ title: 'Failed to initialize profile', description: e.message, variant: 'destructive' });
        }
      })();
    }
  }, [isLoading, list.length]);

  if (!form) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const presets = Array.isArray(form.image_style_presets) ? form.image_style_presets : [];
  const setPreset = (i, k, v) => setForm((f) => ({ ...f, image_style_presets: (f.image_style_presets || []).map((p, idx) => (idx === i ? { ...p, [k]: v } : p)) }));
  const addPreset = () => setForm((f) => ({ ...f, image_style_presets: [...(f.image_style_presets || []), { name: '', prompt_suffix: '' }] }));
  const removePreset = (i) => setForm((f) => ({ ...f, image_style_presets: (f.image_style_presets || []).filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!recordId) return;
    const badLink = SOCIAL_PLATFORMS.find((p) => (form[p.profileField] || '').trim() && !isHttpsUrl(form[p.profileField]));
    if (badLink) {
      toast({ title: `${badLink.label} link must be a full https:// URL`, variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.BrandProfile.update(recordId, form);
      qc.invalidateQueries({ queryKey: ['brand-profile'] });
      toast({ title: 'Brand profile saved' });
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <HowThisWorks
        steps={[
          'Describe the voice, audience and rules once — every generated caption follows them.',
          'Add image style presets so generated pictures keep a consistent look.',
          'Paste in your public profile links for the sharing buttons on the calendar.',
          'Set the reminder email address and choose which nudges you want.',
        ]}
        note="These rules override the generic writing rules whenever they disagree, so be as specific as you like. Remember to press Save profile at the bottom."
      />

      <div className="glass rounded-2xl p-5 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label className={FL}>{f.label}</label>
            {f.type === 'textarea' ? (
              <Textarea value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} rows={f.rows || 3} />
            ) : (
              <Input value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />
            )}
            <p className={HELP}>{f.help}</p>
          </div>
        ))}
        {/* Image style presets */}
        <div className="pt-3 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <label className={FL}>Image style presets</label>
            <Button type="button" variant="outline" size="sm" onClick={addPreset} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add preset</Button>
          </div>
          <p className={HELP}>Appended to an image prompt when selected in a post or set as a campaign default.</p>
          {presets.map((p, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input value={p.name} onChange={(e) => setPreset(i, 'name', e.target.value)} placeholder="Preset name" className="flex-1" />
              <Input value={p.prompt_suffix} onChange={(e) => setPreset(i, 'prompt_suffix', e.target.value)} placeholder="prompt suffix" className="flex-[2]" />
              <button type="button" onClick={() => removePreset(i)} className="p-2 rounded-lg hover:bg-secondary/50 text-destructive shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      <GenerationSettingsCard form={form} set={set} />

        {/* Social accounts */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Share2 className="h-5 w-5 text-primary" /> Social accounts</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Public profile links used by the sharing actions on the calendar. A profile link is not an account connection — Instagram and Facebook publish through their Meta connection, while TikTok and YouTube are manual only.
            </p>
          </div>
          {SOCIAL_PLATFORMS.map((p) => {
            const value = form[p.profileField] || '';
            const valid = !value.trim() || isHttpsUrl(value);
            return (
              <div key={p.id} className="space-y-1.5">
                <label className={`${FL} flex items-center gap-1.5`} htmlFor={`sp-${p.id}`}>
                  <p.Icon className="h-3.5 w-3.5" aria-hidden="true" /> {p.label} {p.id === 'youtube' ? 'channel URL' : p.id === 'facebook' ? 'Page URL' : 'profile URL'}
                </label>
                <Input id={`sp-${p.id}`} value={value} onChange={(e) => set(p.profileField, e.target.value)} placeholder="https://…" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${value.trim() && valid ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                    {value.trim() && valid ? 'Profile Link Added' : 'Profile Link Missing'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {p.canPublish ? 'Publishing runs through the Meta connection, not this link.' : 'Manual sharing only — no publishing integration.'}
                  </span>
                </div>
                {!valid && <p className="text-xs text-destructive">Use a full https:// link.</p>}
              </div>
            );
          })}
        </div>

        <CanvaConnectCard />

        {/* Notification settings */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notification settings</h3>
            <p className="text-sm text-muted-foreground mt-1">Reminder & digest emails are sent to the address below. Only registered app users can receive email.</p>
          </div>
          <div className="space-y-1.5">
            <label className={FL}>Reminder email address</label>
            <Input value={form.notify_email || ''} onChange={(e) => set('notify_email', e.target.value)} placeholder="you@example.com" />
            <p className={HELP}>Must be a registered app user. Leave blank to disable all emails.</p>
          </div>
          <div className="space-y-1.5">
            <label className={FL}>Daily posts-due email time</label>
            <Input type="time" value={form.notify_send_time || '08:00'} onChange={(e) => set('notify_send_time', e.target.value)} />
            <p className={HELP}>Sent only on days when posts are due (your local time).</p>
          </div>
          <div className="space-y-2">
            {[
              { key: 'notify_daily_posts', label: 'Daily posts-due reminder' },
              { key: 'notify_weekly_digest', label: 'Weekly digest (Sunday evening)' },
              { key: 'notify_release_countdown', label: 'Launch countdown (14/7/3/1 days)' },
              { key: 'notify_filming_nudge', label: 'Monthly filming nudge' },
            ].map((t) => (
              <label key={t.key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={form[t.key] !== false} onChange={(e) => set(t.key, e.target.checked)} className="accent-primary" />
                {t.label}
              </label>
            ))}
          </div>
        </div>

      <Button onClick={save} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save profile
      </Button>
    </div>
  );
}