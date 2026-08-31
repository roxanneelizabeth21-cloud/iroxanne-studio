import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon, Disc3, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import MediaLibraryPicker from '@/components/marketing/MediaLibraryPicker';
import AiSlidePanel from '@/components/marketing/ads/AiSlidePanel';

const TABS = [
  { id: 'library', label: 'Pick from library', Icon: ImageIcon },
  { id: 'release', label: 'Auto-build from release', Icon: Disc3 },
  { id: 'ai', label: 'Generate with AI', Icon: Sparkles },
];

// The three ways to build carousel slides. All of them append to the same
// ordered slide list, so they can be mixed freely.
export default function SlideBuilder({ release, trackId, releases, onAdd }) {
  const [tab, setTab] = useState('library');

  const { data: releaseImages = [] } = useQuery({
    queryKey: ['gallery-images', release?.id],
    queryFn: () => base44.entities.GalleryImage.filter({ release_id: release.id }, '-created_date', 20),
    enabled: tab === 'release' && !!release?.id,
  });

  const autoBuild = () => {
    const urls = [release?.cover_image_url, ...releaseImages.map((g) => g.image_url)].filter(Boolean);
    const unique = [...new Set(urls)].slice(0, 10);
    if (!unique.length) {
      toast({ title: 'Nothing to build from', description: 'This release has no cover art or filed images yet.' });
      return;
    }
    onAdd(unique.map((url, i) => ({
      image_url: url,
      headline: i === 0 ? release?.title || '' : '',
      description: '',
      source: 'release',
    })));
    toast({ title: `${unique.length} slides added`, description: 'Reorder, retitle or remove any of them below.' });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={tab === t.id ? 'default' : 'outline'}
            onClick={() => setTab(t.id)}
            className="gap-1.5"
          >
            <t.Icon className="h-3.5 w-3.5" /> {t.label}
          </Button>
        ))}
      </div>

      {tab === 'library' && (
        <MediaLibraryPicker
          source="gallery"
          releases={releases}
          onAttach={(raw, url) => {
            onAdd([{ image_url: url, headline: raw?.title || '', description: '', source: 'library' }]);
            toast({ title: 'Slide added' });
          }}
          onCancel={() => setTab('release')}
        />
      )}

      {tab === 'release' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Cover art first, then every image filed under {release?.title || 'this release'} — you can reorder or remove them after.
          </p>
          <Button type="button" size="sm" onClick={autoBuild} disabled={!release} className="gap-1.5">
            <Disc3 className="h-3.5 w-3.5" /> Build slides from this release
          </Button>
        </div>
      )}

      {tab === 'ai' && <AiSlidePanel releaseId={release?.id} trackId={trackId} onAdd={onAdd} />}
    </div>
  );
}