import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, Loader2 } from 'lucide-react';

const FIELDS = [
  { key: 'artist_story', label: 'Artist Story — Paragraph 1', rows: 4 },
  { key: 'artist_story_2', label: 'Artist Story — Paragraph 2', rows: 4 },
  { key: 'artist_story_3', label: 'Artist Story — Paragraph 3', rows: 4 },
  { key: 'quote', label: 'Featured Quote', rows: 2 },
  { key: 'creative_inspiration_1', label: 'Creative Inspiration — Paragraph 1', rows: 4 },
  { key: 'creative_inspiration_2', label: 'Creative Inspiration — Paragraph 2', rows: 4 },
  { key: 'life_motherhood_1', label: 'Life & Motherhood — Paragraph 1', rows: 4 },
  { key: 'life_motherhood_2', label: 'Life & Motherhood — Paragraph 2', rows: 4 },
];

export default function BioForm() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['artist-bio'],
    queryFn: () => base44.entities.ArtistBio.list(),
  });

  const record = records[0];

  useEffect(() => {
    if (record) setForm(record);
  }, [record]);

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    if (record) {
      await base44.entities.ArtistBio.update(record.id, form);
    } else {
      await base44.entities.ArtistBio.create(form);
    }
    qc.invalidateQueries({ queryKey: ['artist-bio'] });
    toast({ title: 'Bio saved!' });
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {FIELDS.map(({ key, label, rows }) => (
        <div key={key} className="space-y-2">
          <Label className="text-sm font-medium">{label}</Label>
          <Textarea
            rows={rows}
            value={form[key] || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className="resize-none"
          />
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Bio
        </Button>
      </div>
    </div>
  );
}