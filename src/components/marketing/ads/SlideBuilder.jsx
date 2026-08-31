import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon, Images, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import MediaLibraryPicker from '@/components/marketing/MediaLibraryPicker';
import AiSlidePanel from '@/components/marketing/ads/AiSlidePanel';

const TABS = [
  { id: 'library', label: 'Pick from library', Icon: ImageIcon },
  { id: 'release', label: 'Auto-build from project', Icon: Images },
  { id: 'ai', label: 'Generate with AI', Icon: Sparkles },
];

// The three ways to build carousel slides. All of them append to the same
// ordered slide list, so they can be mixed freely.
export default function SlideBuilder({ project, portfolioItems, onAdd }) {
  const [tab, setTab] = useState('library');

  const { data: projectImages = [] } = useQuery({
    queryKey: ['gallery-images', project?.id],
    queryFn: () => base44.entities.GalleryImage.filter({ portfolio_item_id: project.id }, '-created_date', 20),
    enabled: tab === 'release' && !!project?.id,
  });

  const autoBuild = () => {
    const urls = [project?.cover_image_url, ...(project?.screenshots || []), ...projectImages.map((g) => g.image_url)].filter(Boolean);
    const unique = [...new Set(urls)].slice(0, 10);
    if (!unique.length) {
      toast({ title: 'Nothing to build from', description: 'This project has no cover image or filed screenshots yet.' });
      return;
    }
    onAdd(unique.map((url, i) => ({
      image_url: url,
      headline: i === 0 ? project?.title || '' : '',
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
          portfolioItems={portfolioItems}
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
            Cover image first, then every screenshot filed under {project?.title || 'this project'} — you can reorder or remove them after.
          </p>
          <Button type="button" size="sm" onClick={autoBuild} disabled={!project} className="gap-1.5">
            <Images className="h-3.5 w-3.5" /> Build slides from this project
          </Button>
        </div>
      )}

      {tab === 'ai' && <AiSlidePanel projectId={project?.id} onAdd={onAdd} />}
    </div>
  );
}