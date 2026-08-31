import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

// Admin editor for the two public legal pages (Privacy Policy, Terms of Use).
// Each page is a LegalPage record keyed by page_key. We fetch (or create on save)
// the record for the currently selected tab and persist title + content + last_updated.
const PAGES = [
  { key: 'privacy', label: 'Privacy Policy', defaultTitle: 'Privacy Policy' },
  { key: 'terms', label: 'Terms of Use', defaultTitle: 'Terms of Use' },
];

export default function LegalPagesAdmin() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeKey, setActiveKey] = useState('privacy');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadedKey, setLoadedKey] = useState(null);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['legal-pages'],
    queryFn: () => base44.entities.LegalPage.list(),
  });

  const active = pages.find((p) => p.page_key === activeKey) || null;

  // Load the active page's content into the form whenever it changes.
  useEffect(() => {
    if (isLoading) return;
    if (active) {
      setTitle(active.title || '');
      setContent(active.content || '');
    } else {
      setTitle(PAGES.find((p) => p.key === activeKey)?.defaultTitle || '');
      setContent('');
    }
    setLoadedKey(activeKey);
  }, [activeKey, isLoading, active?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (active) {
        await base44.entities.LegalPage.update(active.id, {
          title: title.trim(),
          content,
          last_updated: today,
        });
      } else {
        await base44.entities.LegalPage.create({
          page_key: activeKey,
          title: title.trim(),
          content,
          last_updated: today,
        });
      }
      await qc.invalidateQueries({ queryKey: ['legal-pages'] });
      await qc.invalidateQueries({ queryKey: ['legal-page', activeKey] });
      toast({ title: 'Legal page saved.' });
    } catch (err) {
      toast({ title: 'Save failed.', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tab switch between the two pages */}
      <div className="flex gap-2">
        {PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setActiveKey(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeKey === p.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> {p.label}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Page title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Privacy Policy" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Content (Markdown)
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the page content in Markdown…"
            className="min-h-[420px] font-mono text-sm leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            Supports Markdown headings (##), lists, links, and bold text. Published at
            {' '}
            <span className="text-primary font-medium">/{activeKey}</span>.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save {PAGES.find((p) => p.key === activeKey)?.label}
          </Button>
        </div>
      </div>
    </div>
  );
}