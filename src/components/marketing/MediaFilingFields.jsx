import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, FolderOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MEDIA_CATEGORIES } from '@/lib/mediaCategories';

// Lets the owner file one media asset into a project collection and give it an
// asset kind, so campaigns can pull a project's assets.
export default function MediaFilingFields({ asset, portfolioItems = [] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [collection, setCollection] = useState(asset.project_id || '');
  const [category, setCategory] = useState(asset.media_category || '');

  const save = async (patch) => {
    setSaving(true);
    try {
      if (asset.kind === 'video') await base44.entities.ClipAsset.update(asset.recordId, patch.video);
      else await base44.entities.GalleryImage.update(asset.recordId, patch.image);
      qc.invalidateQueries({ queryKey: ['gallery-images'] });
      qc.invalidateQueries({ queryKey: ['clip-assets'] });
      toast({ title: 'Media filed' });
    } catch (e) {
      toast({ title: 'Could not file this media', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border-[0.5px] border-border bg-card/60 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <FolderOpen className="h-3.5 w-3.5" /> Filing {saving && <Loader2 className="h-3 w-3 animate-spin" />}
      </p>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="media-collection">Project</label>
        <select
          id="media-collection"
          value={collection}
          onChange={(e) => {
            setCollection(e.target.value);
            save({ image: { portfolio_item_id: e.target.value }, video: { portfolio_item_id: e.target.value } });
          }}
        >
          <option value="">Unfiled</option>
          {portfolioItems.map((r) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="media-kind">Type of asset</label>
        <select
          id="media-kind"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            save({ image: { media_category: e.target.value }, video: { media_category: e.target.value } });
          }}
        >
          <option value="">Not set</option>
          {MEDIA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}