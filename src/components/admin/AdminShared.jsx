import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Film, Image, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Shared primitives for the split admin pages (section header, resource rows,
// and the create/delete mutations that several pages need).
export function AdminSection({ title, icon: SectionIcon, onAdd, addLabel, children, headerExtra }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <SectionIcon className="h-5 w-5 text-primary" /> {title}
        </h2>
        <div className="flex items-center gap-2">
          {headerExtra}
          {onAdd && (
            <Button size="sm" onClick={onAdd} className="gap-1.5">
              <Plus className="h-4 w-4" /> {addLabel}
            </Button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export function useAdminMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['releases-admin'] });
    qc.invalidateQueries({ queryKey: ['videos-admin'] });
    qc.invalidateQueries({ queryKey: ['gallery-admin'] });
    qc.invalidateQueries({ queryKey: ['all-releases'] });
    qc.invalidateQueries({ queryKey: ['all-videos'] });
    qc.invalidateQueries({ queryKey: ['gallery'] });
  };
  const handleDelete = async (type, item) => {
    if (!confirm(`Delete "${item.title || item.name}"?`)) return;
    await base44.entities[type].delete(item.id);
    toast({ title: 'Deleted.' });
    invalidate();
  };
  return { invalidate, handleDelete, toast };
}

function RowShell({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-xl glass glass-hover">
      {children}
    </motion.div>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-1 shrink-0">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

function Thumb({ src, alt, Icon }) {
  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-secondary/60">
      {src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon className="h-5 w-5 text-muted-foreground/40" /></div>}
    </div>
  );
}

export function VideoRow({ video, onEdit, onDelete }) {
  return (
    <RowShell>
      <Thumb src={video.thumbnail} alt={video.title} Icon={Film} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{video.title}</p>
          {video.featured && <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0 fill-yellow-500" />}
        </div>
        <p className="text-xs text-muted-foreground capitalize">{video.type?.replace('_', ' ')}</p>
      </div>
      <RowActions onEdit={() => onEdit(video)} onDelete={() => onDelete(video)} />
    </RowShell>
  );
}

export function GalleryRow({ image, onEdit, onDelete }) {
  return (
    <RowShell>
      <Thumb src={image.image_url} alt={image.title} Icon={Image} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{image.title}</p>
        <p className="text-xs text-muted-foreground capitalize">{image.category?.replace('_', ' ')}</p>
      </div>
      <RowActions onEdit={() => onEdit(image)} onDelete={() => onDelete(image)} />
    </RowShell>
  );
}