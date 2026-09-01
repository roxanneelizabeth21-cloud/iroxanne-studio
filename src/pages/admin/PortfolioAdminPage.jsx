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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">Projects shown on the home page "Our work" grid.</p>
        </div>
        <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add project</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !items?.length ? (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground">No portfolio projects yet. Click "Add project".</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="glass rounded-2xl p-3 flex gap-3">
              <div className="h-16 w-20 shrink-0 rounded-lg overflow-hidden bg-secondary">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  {item.featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                </div>
                {item.tagline && <p className="text-xs text-muted-foreground truncate">{item.tagline}</p>}
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{item.category}</span>
                  <span>•</span>
                  <span>Order {item.sort_order ?? 0}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(item)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeletingId(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
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