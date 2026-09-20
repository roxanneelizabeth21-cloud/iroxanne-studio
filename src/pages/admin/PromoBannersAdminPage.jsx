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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <button
          onClick={() => setEditing(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-secondary, #66736e)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to banners
        </button>

        <div className="irx-page-header">
          <div className="irx-eyebrow">Business Manager</div>
          <h1>{editing === 'new' ? 'New' : 'Edit'} Promo Banner</h1>
        </div>

        <div className="irx-card" style={{ padding: '20px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Promo Banners</h1>
        <p>Create and manage promotional banners for your website.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Button onClick={() => setEditing('new')} className="gap-2">
          <Plus style={{ width: 16, height: 16 }} /> New Banner
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: 'var(--text-secondary, #66736e)' }} />
        </div>
      ) : banners.length === 0 ? (
        <div className="irx-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary, #66736e)' }}>
          No promo banners yet. Click "New Banner" to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="irx-section-head">All Banners</div>
          {banners.map((b) => {
            const pages = pagesList(b.target_pages);
            return (
              <div key={b.id} className="irx-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Row: title + badges + controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                      <h3 style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                        {b.title || 'Untitled'}
                      </h3>
                      {b.is_active ? (
                        <span className="irx-badge irx-accent-green">Active</span>
                      ) : (
                        <span className="irx-badge irx-accent-rose">Inactive</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary, #66736e)' }}>Active</span>
                        <Switch checked={!!b.is_active} onCheckedChange={() => toggleActive(b)} />
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(b)}>
                        <Pencil style={{ width: 14, height: 14 }} /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(b)}>
                        <Trash2 style={{ width: 16, height: 16 }} />
                      </Button>
                    </div>
                  </div>

                  {/* Subtitle: headline + date range */}
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary, #66736e)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.headline || 'No headline'} — {dateRange(b)}
                  </p>

                  {/* Page tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {pages.length === 0 ? (
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary, #66736e)', fontStyle: 'italic' }}>No pages selected</span>
                    ) : (
                      pages.map((p) => (
                        <span key={p} className="irx-badge">
                          {PAGE_LABELS[p] || p}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
