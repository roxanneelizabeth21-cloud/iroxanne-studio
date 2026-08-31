import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { AdminSection, VideoRow, useAdminMutations } from '@/components/admin/AdminShared';
import VideoForm from '@/components/admin/VideoForm';

export default function VideosAdminPage() {
  const [editing, setEditing] = useState(null);
  const { data: videos = [] } = useQuery({ queryKey: ['videos-admin'], queryFn: () => base44.entities.Video.list('-created_date') });
  const { invalidate, handleDelete } = useAdminMutations();
  const closeForm = () => { setEditing(null); invalidate(); };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Videos</h1>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold mb-5">{editing.item ? 'Edit Video' : 'New Video'}</h3>
            <VideoForm video={editing.item} onSave={closeForm} onCancel={() => setEditing(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AdminSection title="Videos" icon={Film} onAdd={() => setEditing({ item: null })} addLabel="New Video">
        <div className="space-y-2">
          {videos.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No videos yet.</div>}
          {videos.map((v) => (
            <VideoRow key={v.id} video={v} onEdit={(item) => setEditing({ item })} onDelete={(item) => handleDelete('Video', item)} />
          ))}
        </div>
      </AdminSection>
    </div>
  );
}