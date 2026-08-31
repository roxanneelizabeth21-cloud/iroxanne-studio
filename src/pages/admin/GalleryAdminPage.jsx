import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { AdminSection, GalleryRow, useAdminMutations } from '@/components/admin/AdminShared';
import GalleryForm from '@/components/admin/GalleryForm';

export default function GalleryAdminPage() {
  const [editing, setEditing] = useState(null);
  const { data: images = [] } = useQuery({ queryKey: ['gallery-admin'], queryFn: () => base44.entities.GalleryImage.list('-created_date') });
  const { invalidate, handleDelete } = useAdminMutations();
  const closeForm = () => { setEditing(null); invalidate(); };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Gallery</h1>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold mb-5">{editing.item ? 'Edit Photo' : 'Add Photo'}</h3>
            <GalleryForm image={editing.item} onSave={closeForm} onCancel={() => setEditing(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AdminSection title="Gallery" icon={ImageIcon} onAdd={() => setEditing({ item: null })} addLabel="Add Photo">
        <div className="space-y-2">
          {images.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No photos yet.</div>}
          {images.map((img) => (
            <GalleryRow key={img.id} image={img} onEdit={(item) => setEditing({ item })} onDelete={(item) => handleDelete('GalleryImage', item)} />
          ))}
        </div>
      </AdminSection>
    </div>
  );
}