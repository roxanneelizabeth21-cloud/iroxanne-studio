import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const PAGES = [
  { key: 'page_music_enabled', label: 'Music', path: '/music' },
  { key: 'page_videos_enabled', label: 'Videos', path: '/videos' },
  { key: 'page_about_enabled', label: 'About', path: '/about' },
  { key: 'page_gallery_enabled', label: 'Gallery', path: '/gallery' },
  { key: 'page_store_enabled', label: 'Store', path: '/store' },
  { key: 'page_contact_enabled', label: 'Contact', path: '/contact' },
  { key: 'page_press_enabled', label: 'Press Kit', path: '/press' },
];

const DEFAULTS = Object.fromEntries(PAGES.map((p) => [p.key, true]));

export default function PagesForm() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [values, setValues] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  const { data: records = [] } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => base44.entities.SiteSettings.list(),
  });

  useEffect(() => {
    if (records[0]) setValues({ ...DEFAULTS, ...records[0] });
  }, [records]);

  const handleSave = async () => {
    setSaving(true);
    if (records[0]) {
      await base44.entities.SiteSettings.update(records[0].id, values);
    } else {
      await base44.entities.SiteSettings.create(values);
    }
    qc.invalidateQueries({ queryKey: ['site-settings'] });
    toast({ title: 'Page visibility saved.' });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Toggle pages on or off. Disabled pages will be hidden from the navigation menu.</p>
      <div className="space-y-4">
        {PAGES.map((page) => (
          <div key={page.key} className="flex items-center justify-between p-4 rounded-xl glass">
            <div>
              <Label className="text-sm font-medium">{page.label}</Label>
              <p className="text-xs text-muted-foreground">{page.path}</p>
            </div>
            <Switch
              checked={values[page.key] !== false}
              onCheckedChange={(checked) => setValues((v) => ({ ...v, [page.key]: checked }))}
            />
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  );
}