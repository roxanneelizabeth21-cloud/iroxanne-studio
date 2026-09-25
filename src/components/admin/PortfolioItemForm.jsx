import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import MediaUploader from '@/components/admin/MediaUploader';

const CATEGORIES = [
  'Booking System', 'Marketing Tool', 'E-commerce',
  'Client Portal', 'Internal Tool', 'Other',
];

const EMPTY = {
  title: '', tagline: '', slug: '', client_name: '', client_shareable: false,
  category: 'Other', description: '', tech_used: [], cover_image_url: '',
  project_url: '', date_built: '', featured: false, sort_order: 0,
};

export default function PortfolioItemForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => {
    const i = initial || {};
    return {
      ...EMPTY,
      ...i,
      tech_used: Array.isArray(i.tech_used) ? i.tech_used : [],
      date_built: i.date_built || '',
      sort_order: i.sort_order ?? 0,
    };
  });
  const [techText, setTechText] = useState((form.tech_used || []).join(', '));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    onSave({
      ...form,
      tech_used: techText.split(',').map((t) => t.trim()).filter(Boolean),
      sort_order: Number(form.sort_order) || 0,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="MyEventFlow" required />
        </div>
        <div className="space-y-1.5">
          <Label>Tagline</Label>
          <Input value={form.tagline || ''} onChange={(e) => set('tagline', e.target.value)} placeholder="One-line summary" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input value={form.slug || ''} onChange={(e) => set('slug', e.target.value)} placeholder="myeventflow" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea rows={4} value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="What the app does and the problem it solves" />
      </div>

      <div className="space-y-1.5">
        <Label>Cover image</Label>
        <MediaUploader
          currentUrl={form.cover_image_url}
          onUpload={(url) => set('cover_image_url', url)}
          placeholder="Click or drag to upload cover screenshot"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Project URL</Label>
          <Input value={form.project_url || ''} onChange={(e) => set('project_url', e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-1.5">
          <Label>Date built</Label>
          <Input type="date" value={form.date_built || ''} onChange={(e) => set('date_built', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Client name</Label>
        <Input value={form.client_name || ''} onChange={(e) => set('client_name', e.target.value)} placeholder="Client name (optional)" />
      </div>

      <div className="space-y-1.5">
        <Label>Tech used (comma separated)</Label>
        <Input value={techText} onChange={(e) => setTechText(e.target.value)} placeholder="Base44, Square, Resend" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Homepage display order (lower first)</Label>
          <Input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
        </div>
        <div className="flex flex-col justify-end gap-4 pt-1">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={!!form.featured} onCheckedChange={(v) => set('featured', !!v)} /> Show on homepage
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={!!form.client_shareable} onCheckedChange={(v) => set('client_shareable', !!v)} /> Client name shareable
          </label>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">The homepage shows up to three checked apps, ordered by display order. Uncheck an app to hide its preview without deleting it.</p>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </Button>
      </div>
    </form>
  );
}