import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Film, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ClipShareButton from '@/components/marketing/ClipShareButton';
import ClipThumb, { isVideoFile } from '@/components/marketing/ClipThumb';
import { formatDuration } from '@/lib/marketing';
import { MEDIA_CATEGORIES } from '@/lib/mediaCategories';

// One clip in the library: shows what it is (video or image, project, type)
// and lets that filing be corrected inline.
export default function ClipCard({ clip, projects, onDelete }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const vid = isVideoFile(clip.file);

  const save = async (fields) => {
    setSaving(true);
    try {
      await base44.entities.ClipAsset.update(clip.id, fields);
      qc.invalidateQueries({ queryKey: ['clip-assets'] });
    } catch (e) {
      toast({ title: 'Could not update this clip', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-xl overflow-hidden group">
      <div className="relative aspect-[9/16] bg-secondary">
        <ClipThumb file={clip.file} title={clip.title} />
        <span className="absolute top-1 left-1 flex items-center gap-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded">
          {vid ? <Film className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}
          {vid ? 'Video' : 'Image'}
        </span>
        {clip.duration_seconds ? (
          <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1 rounded">{formatDuration(clip.duration_seconds)}</span>
        ) : null}
        {clip.file && <ClipShareButton clip={clip} isVideo={vid} />}
        <button onClick={() => onDelete(clip)} aria-label={`Delete ${clip.title}`} className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="p-2 space-y-1.5">
        <p className="text-xs font-medium truncate">{clip.title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{clip.orientation} · {clip.source_type}</p>
        <select
          value={clip.portfolio_item_id || ''}
          disabled={saving}
          aria-label="Project"
          onChange={(e) => save({ portfolio_item_id: e.target.value })}
          className="h-7 text-[11px]"
        >
          <option value="">Unfiled project</option>
          {projects.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <select
          value={clip.media_category || ''}
          disabled={saving}
          aria-label="Clip type"
          onChange={(e) => save({ media_category: e.target.value })}
          className="h-7 text-[11px]"
        >
          <option value="">Untyped</option>
          {MEDIA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(clip.moods || []).length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {clip.moods.slice(0, 4).map((m) => <span key={m} className="text-[9px] px-1 rounded bg-secondary text-muted-foreground">{m}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}