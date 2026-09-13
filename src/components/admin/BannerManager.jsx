import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MediaUploader from '@/components/admin/MediaUploader';
import { useToast } from '@/components/ui/use-toast';

// Pages this app actually serves. The previous list (Music, Videos, Gallery,
// Store, Press Kit) was inherited from the music app and none of those routes
// exist here.
const PAGES = [
  { key: 'home', label: 'Home' },
  { key: 'about', label: 'About' },
  { key: 'quote', label: 'Get a Quote' },
  { key: 'contact', label: 'Contact' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'terms', label: 'Terms' },
];

export default function BannerManager() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: banners = [] } = useQuery({
    queryKey: ['page-banners'],
    queryFn: () => base44.entities.PageBannerImage.list(),
  });

  const getBanner = (key) => banners.find((b) => b.page_key === key);

  const saveBanner = async (key, imageUrl) => {
    const existing = getBanner(key);
    if (existing) {
      if (imageUrl) {
        await base44.entities.PageBannerImage.update(existing.id, { image_url: imageUrl });
      } else {
        await base44.entities.PageBannerImage.delete(existing.id);
      }
    } else if (imageUrl) {
      await base44.entities.PageBannerImage.create({ page_key: key, image_url: imageUrl });
    }
    qc.invalidateQueries({ queryKey: ['page-banners'] });
    toast({ title: 'Banner updated.' });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Upload a custom banner image for each page. If no image is set, the default branded gradient is used.
        Recommended size: 1920×400px or wider.
      </p>
      {PAGES.map((page) => {
        const banner = getBanner(page.key);
        return (
          <div key={page.key} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" /> {page.label}
              </h3>
              {banner?.image_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 gap-1 text-muted-foreground"
                  onClick={() => saveBanner(page.key, '')}
                >
                  <RotateCcw className="h-3 w-3" /> Reset to default
                </Button>
              )}
            </div>
            <MediaUploader
              type="image"
              currentUrl={banner?.image_url}
              onUpload={(url) => saveBanner(page.key, url)}
              placeholder="Click or drag to upload banner image"
            />
          </div>
        );
      })}
    </div>
  );
}