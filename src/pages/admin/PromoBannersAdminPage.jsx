import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone, Plus, Pencil, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import PromoBannerForm from '@/components/admin/PromoBannerForm';

// Display labels for stored target_pages keys. Must stay aligned with
// PAGE_OPTIONS in PromoBannerForm.jsx — 'music', 'shop' and 'release' were
// music-app pages that don't exist in the studio app.
const PAGE_LABELS = { all: 'All pages', home: 'Home' };

function pagesList(str) {
  return String(str || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function dateRange(b) {
  const parts = [];
  if (b.start_date) parts.push(b.start_date);
  if (b.end_date) parts.push(`→ ${b.end_date}`);
  return parts.length ? parts.join(' ') : 'No date limit';
}

export default function PromoBannersAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | existing banner

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['promo-banners-admin'],
    queryFn: () => base44.entities.PromoBanner.list('sort_order'),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['promo-banners-admin'] });
    qc.invalidateQueries({ queryKey: ['promo-banners'] });
  };

  const save = async (data) => {
    const { id, ...rest } = data;
    if (id) {
      await base44.entities.PromoBanner.update(id, rest);
      toast({ title: 'Banner updated.' });
    } else {
      await base44.entities.PromoBanner.create(rest);
      toast({ title: 'Banner created.' });
    }
    invalidate();
    setEditing(null);
  };

  const remove = async (b) => {
    if (!confirm(`Delete "${b.title}"?`)) return;
    await base44.entities.PromoBanner.delete(b.id);
    invalidate();
    toast({ title: 'Banner deleted.' });
  };

  const toggleActive = async (b) => {
    await base44.entities.PromoBanner.update(b.id, { is_active: !b.is_active });
    invalidate();
  };

  if (editing) {
    return (
      <div className="space-y-5">
        <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to banners
        </button>
        <h1 className="font-display text-2xl font-bold">
          {editing === 'new' ? 'New' : 'Edit'} Promo Banner
        </h1>
        <div className="glass rounded-2xl p-5 md:p-7">
          <PromoBannerForm
            initial={editing === 'new' ? null : editing}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" /> Promo Banners
        </h1>
        <Button onClick={() => setEditing('new')} className="gap-2">
          <Plus className="h-4 w-4" /> New Banner
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Site-wide promotional banners shown at the top of selected pages, above the page content.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          No promo banners yet. Click "New Banner" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => {
            const pages = pagesList(b.target_pages);
            return (
              <div key={b.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{b.title || 'Untitled'}</h3>
                    {b.is_active ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {b.headline || 'No headline'} — {dateRange(b)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pages.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No pages selected</span>
                    ) : (
                      pages.map((p) => (
                        <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {PAGE_LABELS[p] || p}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Active</span>
                    <Switch checked={!!b.is_active} onCheckedChange={() => toggleActive(b)} />
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(b)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(b)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}