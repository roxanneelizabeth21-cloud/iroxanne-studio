import { useState, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Upload, Loader2, ImageIcon, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import MediaAssetDetail from '@/components/marketing/MediaAssetDetail';
import CanvaImportDialog from '@/components/marketing/CanvaImportDialog';
import MediaCollectionGroups from '@/components/marketing/MediaCollectionGroups';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import { MEDIA_CATEGORIES } from '@/lib/mediaCategories';

// Media Library — reusable media in one visual place. Gallery images, uploads and
// generated images come from the existing GalleryImage records; general videos come
// from ClipAsset files (curated short clips still live on the Clips page).
export default function MediaLibrary() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [selected, setSelected] = useState(null);
  const [canvaOpen, setCanvaOpen] = useState(false);
  const [filters, setFilters] = useState({ q: '', type: '', campaign: '', project: '', category: '' });

  const { data: images = [] } = useQuery({ queryKey: ['gallery-images'], queryFn: () => base44.entities.GalleryImage.list('-created_date') });
  const { data: clips = [] } = useQuery({ queryKey: ['clip-assets'], queryFn: () => base44.entities.ClipAsset.list('-created_date') });
  const { data: posts = [] } = useQuery({ queryKey: ['marketing-posts'], queryFn: () => base44.entities.MarketingPost.list('-created_date') });
  const { data: campaigns = [] } = useQuery({ queryKey: ['marketing-campaigns'], queryFn: () => base44.entities.Campaign.list() });
  const { data: portfolioItems = [] } = useQuery({ queryKey: ['portfolio-items'], queryFn: () => base44.entities.PortfolioItem.list('-date_built') });

  const assets = useMemo(() => {
    const imageAssets = images.map((g) => ({
      id: `img-${g.id}`,
      recordId: g.id,
      kind: 'image',
      url: g.image_url,
      title: g.title || 'Untitled image',
      source: g.source === 'ai_generated' ? 'Generated image' : 'Uploaded image',
      campaign_id: g.campaign_id || '',
      project_id: g.portfolio_item_id || g.release_id || '',
      format: g.format || '',
      aspect_ratio: g.aspect_ratio || '',
      generation_prompt: g.generation_prompt || '',
      media_category: g.media_category || '',
      canva_design_id: g.canva_design_id || '',
      created_date: g.created_date,
    }));
    const videoAssets = clips
      .filter((c) => c.file)
      .map((c) => ({
        id: `clip-${c.id}`,
        recordId: c.id,
        kind: 'video',
        url: c.file,
        title: c.title || 'Untitled video',
        source: 'Video clip',
        campaign_id: '',
        project_id: c.portfolio_item_id || c.linked_song_id || '',
        format: c.orientation || '',
        aspect_ratio: c.orientation || '',
        generation_prompt: '',
        media_category: c.media_category || '',
        created_date: c.created_date,
      }));
    return [...imageAssets, ...videoAssets].sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));
  }, [images, clips]);

  const visible = assets.filter((a) => {
    if (filters.type && a.kind !== filters.type) return false;
    if (filters.campaign && a.campaign_id !== filters.campaign) return false;
    if (filters.project && a.project_id !== filters.project) return false;
    if (filters.category && a.media_category !== filters.category) return false;
    if (filters.q && !a.title.toLowerCase().includes(filters.q.toLowerCase())) return false;
    return true;
  });

  const uploadOne = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const title = file.name.replace(/\.[^.]+$/, '');
    // Videos must become ClipAsset records — a video stored as a GalleryImage
    // renders in an <img> tag and shows up as a blank tile.
    const isVideo = (file.type || '').startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name);
    if (isVideo) {
      await base44.entities.ClipAsset.create({ title, file: file_url, source_type: 'My Footage' });
    } else {
      await base44.entities.GalleryImage.create({ title, image_url: file_url, category: 'promo', source: 'upload' });
    }
  };

  const upload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });
    const failed = [];
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadOne(files[i]);
      } catch {
        failed.push(files[i].name);
      }
      setUploadProgress({ done: i + 1, total: files.length });
    }
    qc.invalidateQueries({ queryKey: ['gallery-images'] });
    qc.invalidateQueries({ queryKey: ['clip-assets'] });
    setUploading(false);
    setUploadProgress(null);
    if (fileRef.current) fileRef.current.value = '';
    const ok = files.length - failed.length;
    if (failed.length) {
      toast({ title: `${failed.length} of ${files.length} uploads failed`, description: failed.join(', '), variant: 'destructive' });
    } else {
      toast({ title: ok > 1 ? `${ok} files added to your library` : 'Media added to your library' });
    }
  };

  return (
    <div className="space-y-4">
      <HowThisWorks
        steps={[
          'Upload your graphics and videos here once, and they become reusable on every post.',
          'Bring finished designs across with Import from Canva.',
          'Narrow things down with the search box and the filters below it.',
          'Tap any tile to see where that piece of media has been used and to file it under a project.',
        ]}
        note="Everything is filed under the project it belongs to, so a project's screenshots and promos stay together."
      />

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="Search media by title"
            aria-label="Search media"
            className="pl-8"
          />
        </div>
        <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading && uploadProgress ? `Uploading ${uploadProgress.done} of ${uploadProgress.total}…` : 'Upload Media'}
        </Button>
        <Button variant="outline" onClick={() => setCanvaOpen(true)} className="gap-1.5">
          <Palette className="h-4 w-4" /> Import from Canva
        </Button>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => upload(e.target.files)} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} aria-label="Filter by media type">
          <option value="">All media types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>
        <select value={filters.campaign} onChange={(e) => setFilters({ ...filters, campaign: e.target.value })} aria-label="Filter by campaign">
          <option value="">All campaigns</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })} aria-label="Filter by project">
          <option value="">All projects</option>
          {portfolioItems.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} aria-label="Filter by type of asset">
          <option value="">All asset types</option>
          {MEDIA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border-[0.5px] border-border bg-card/60 p-12 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" aria-hidden="true" />
          <p className="font-medium">No media here yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload a graphic or video, and it becomes reusable across every post.</p>
        </div>
      ) : (
        <MediaCollectionGroups assets={visible} portfolioItems={portfolioItems} onSelect={setSelected} />
      )}

      <CanvaImportDialog
        open={canvaOpen}
        onOpenChange={setCanvaOpen}
        onImported={() => qc.invalidateQueries({ queryKey: ['gallery-images'] })}
      />

      <MediaAssetDetail
        asset={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        posts={posts}
        campaigns={campaigns}
        portfolioItems={portfolioItems}
      />
    </div>
  );
}