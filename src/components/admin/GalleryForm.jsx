import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MediaUploader from './MediaUploader';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = [
  { value: 'promo', label: 'Promo' },
  { value: 'live', label: 'Live' },
  { value: 'behind_the_scenes', label: 'Behind the Scenes' },
  { value: 'press', label: 'Press' },
  { value: 'personal', label: 'Personal' },
];

export default function GalleryForm({ image, onSave, onCancel }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '', image_url: '', category: 'promo',
    ...image,
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: 'Title is required', variant: 'destructive' }); return; }
    if (!form.image_url) { toast({ title: 'Please upload an image', variant: 'destructive' }); return; }
    setSaving(true);
    if (image?.id) {
      await base44.entities.GalleryImage.update(image.id, form);
    } else {
      await base44.entities.GalleryImage.create(form);
    }
    setSaving(false);
    toast({ title: image?.id ? 'Image updated!' : 'Image added!' });
    onSave?.();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Image *</label>
        <MediaUploader type="image" currentUrl={form.image_url} onUpload={(url) => set('image_url', url)} placeholder="Upload gallery photo" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title *</label>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Image title" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</label>
          <Select value={form.category} onValueChange={(v) => set('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : image?.id ? 'Update Image' : 'Add Image'}
        </Button>
        {onCancel && <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
      </div>
    </div>
  );
}