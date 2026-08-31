import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import MediaUploader from '@/components/admin/MediaUploader';
import PromoBanner from '@/components/PromoBanner';

const PAGE_OPTIONS = [
  { key: 'all', label: 'All pages' },
  { key: 'home', label: 'Home' },
  { key: 'music', label: 'Music' },
  { key: 'shop', label: 'Shop' },
  { key: 'release', label: 'Release' },
];

const STYLE_OPTIONS = [
  { value: 'dark', label: 'Dark — near-black surface' },
  { value: 'gold', label: 'Gold — champagne gold gradient' },
  { value: 'teal', label: 'Teal — deep teal gradient' },
  { value: 'custom', label: 'Custom — pick a color' },
];

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function PromoBannerForm({ initial, onSave, onCancel }) {
  const [b, setB] = useState(() => ({
    title: '',
    is_active: false,
    target_pages: 'shop',
    headline: '',
    subtext: '',
    cta_text: '',
    cta_url: '',
    image_url: '',
    background_style: 'dark',
    background_color: '#0D0D0D',
    dismissible: true,
    start_date: '',
    end_date: '',
    sort_order: 0,
    ...initial,
  }));

  const set = (k, v) => setB((p) => ({ ...p, [k]: v }));

  const selectedPages = String(b.target_pages || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const togglePage = (key) => {
    let next;
    if (selectedPages.includes(key)) {
      next = selectedPages.filter((k) => k !== key);
    } else if (key === 'all') {
      next = ['all'];
    } else {
      next = [...selectedPages.filter((k) => k !== 'all'), key];
    }
    set('target_pages', next.length ? next.join(',') : '');
  };

  const submit = (e) => {
    e.preventDefault();
    onSave(b);
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-5">
        <Field label="Title (internal)">
          <Input value={b.title} onChange={(e) => set('title', e.target.value)} placeholder="Hymns pre-save banner" required />
        </Field>

        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
          <div>
            <Label>Active</Label>
            <p className="text-xs text-muted-foreground">Show this banner on the site</p>
          </div>
          <Switch checked={!!b.is_active} onCheckedChange={(v) => set('is_active', v)} />
        </div>

        <Field label="Target pages" hint="Which pages the banner appears on. 'All pages' overrides individual selections.">
          <div className="flex flex-wrap gap-2">
            {PAGE_OPTIONS.map((p) => {
              const active = selectedPages.includes(p.key);
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePage(p.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border/50 hover:border-primary/40'}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Headline">
          <Input value={b.headline} onChange={(e) => set('headline', e.target.value)} placeholder="Coming September 18" />
        </Field>

        <Field label="Subtext">
          <Input value={b.subtext} onChange={(e) => set('subtext', e.target.value)} placeholder="Those Old Hymns: Reimagined, Vol. 1 — pre-save the album." />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="CTA text">
            <Input value={b.cta_text} onChange={(e) => set('cta_text', e.target.value)} placeholder="Pre-Save →" />
          </Field>
          <Field label="CTA URL">
            <Input value={b.cta_url} onChange={(e) => set('cta_url', e.target.value)} placeholder="/release/those-old-hymns" />
          </Field>
        </div>

        <Field label="Image (optional)" hint="Thumbnail shown on the left. Leave empty for no image.">
          <MediaUploader
            type="image"
            currentUrl={b.image_url || null}
            onUpload={(url) => set('image_url', url)}
            placeholder="Click or drag to upload a thumbnail"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Background style">
            <select value={b.background_style} onChange={(e) => set('background_style', e.target.value)}>
              {STYLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Sort order">
            <Input type="number" value={b.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value))} />
          </Field>
        </div>

        {b.background_style === 'custom' && (
          <Field label="Custom background color" hint="Used only when background style is 'Custom'.">
            <div className="flex items-center gap-3">
              <input type="color" value={b.background_color || '#0D0D0D'} onChange={(e) => set('background_color', e.target.value)} className="h-9 w-12 rounded border border-border/50 bg-transparent cursor-pointer" />
              <Input value={b.background_color || ''} onChange={(e) => set('background_color', e.target.value)} placeholder="#0D0D0D" />
            </div>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date (optional)" hint="Hidden before this date">
            <Input type="date" value={b.start_date || ''} onChange={(e) => set('start_date', e.target.value)} />
          </Field>
          <Field label="End date (optional)" hint="Hidden after this date">
            <Input type="date" value={b.end_date || ''} onChange={(e) => set('end_date', e.target.value)} />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
          <div>
            <Label>Dismissible</Label>
            <p className="text-xs text-muted-foreground">Visitors can close it; dismissal is remembered per device</p>
          </div>
          <Switch checked={!!b.dismissible} onCheckedChange={(v) => set('dismissible', v)} />
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Preview</Label>
          <div className="mt-2 rounded-xl overflow-hidden border border-border/50">
            <PromoBanner banner={b} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Live preview using the current (unsaved) values.</p>
        </div>

        <div className="flex gap-2">
          <Button type="submit">Save Banner</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </form>
  );
}