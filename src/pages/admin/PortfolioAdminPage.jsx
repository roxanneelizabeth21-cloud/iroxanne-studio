import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PortfolioItemForm from '@/components/admin/PortfolioItemForm';

export default function PortfolioAdminPage() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.PortfolioItem.list('sort_order');
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing === 'new') {
        await base44.entities.PortfolioItem.create(data);
      } else {
        await base44.entities.PortfolioItem.update(editing.id, data);
      }
      toast({ title: 'Saved' });
      setEditing(null);
      await load();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await base44.entities.PortfolioItem.delete(deletingId);
      toast({ title: 'Deleted' });
      setDeletingId(null);
      await load();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="irx-eyebrow">Business Manager</div>
          <h1>Portfolio</h1>
          <p>Edit an app and check "Show on homepage" to choose its preview. Up to three checked apps appear, with lower display orders first.</p>
        </div>
        <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add project</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--text-secondary, #66736e)' }} />
        </div>
      ) : !items?.length ? (
        <div className="irx-empty" style={{ textAlign: 'center' }}>No portfolio projects yet. Click "Add project".</div>
      ) : (
        <>
          <div className="irx-section-head">Projects</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {items.map((item) => (
              <div key={item.id} className="irx-card" style={{ display: 'flex', gap: '12px', padding: '12px' }}>
                <div style={{ height: '64px', width: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-secondary, #f0f0f0)' }}>
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt="" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                  ) : null}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                    {item.featured && <Star className="h-3.5 w-3.5" style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />}
                  </div>
                  {item.tagline && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.tagline}</p>
                  )}
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary, #66736e)' }}>
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>Order {item.sort_order ?? 0}</span>
                    <span>{item.featured ? 'Homepage selected' : 'Not on homepage'}</span>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <Button size="sm" variant="outline" onClick={() => setEditing(item)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeletingId(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'New project' : 'Edit project'}</DialogTitle>
            <DialogDescription>{editing === 'new' ? 'Add a portfolio project.' : 'Update this portfolio project.'}</DialogDescription>
          </DialogHeader>
          <PortfolioItemForm
            initial={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>This removes it from the home page. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
