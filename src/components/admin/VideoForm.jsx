import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MediaUploader from './MediaUploader';
import { useToast } from '@/components/ui/use-toast';

const VIDEO_TYPES = [
  { value: 'music_video', label: 'Music Video' },
  { value: 'lyric_video', label: 'Lyric Video' },
  { value: 'reel', label: 'Reel / Short' },
  { value: 'behind_the_scenes', label: 'Behind the Scenes' },
  { value: 'live', label: 'Live Performance' },
];

export default function VideoForm({ video, onSave, onCancel }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '', description: '', youtube_url: '', type: 'music_video',
    thumbnail: '', optional_video_file: '', featured: false,
    ...video,
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: 'Title is required', variant: 'destructive' }); return; }
    setSaving(true);
    if (video?.id) {
      await base44.entities.Video.update(video.id, form);
    } else {
      await base44.entities.Video.create(form);
    }
    setSaving(false);
    toast({ title: video?.id ? 'Video updated!' : 'Video created!' });
    onSave?.();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title *</label>
        <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Video title" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
          <Select value={form.type} onValueChange={(v) => set('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {VIDEO_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">YouTube URL</label>
          <Input value={form.youtube_url} onChange={(e) => set('youtube_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
        <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Short description..." />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Thumbnail Image</label>
        <MediaUploader type="image" currentUrl={form.thumbnail} onUpload={(url) => set('thumbnail', url)} placeholder="Upload thumbnail" />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Optional MP4 Video File</label>
        <MediaUploader type="video" currentUrl={form.optional_video_file} onUpload={(url) => set('optional_video_file', url)} placeholder="Upload MP4 video (optional)" />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div
          onClick={() => set('featured', !form.featured)}
          className={`w-10 h-5 rounded-full relative transition-colors ${form.featured ? 'bg-primary' : 'bg-secondary'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.featured ? 'translate-x-5' : ''}`} />
        </div>
        <span className="text-sm flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-yellow-500" /> Featured Video</span>
      </label>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : video?.id ? 'Update Video' : 'Create Video'}
        </Button>
        {onCancel && <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
      </div>
    </div>
  );
}