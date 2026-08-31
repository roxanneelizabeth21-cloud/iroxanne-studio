import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Link2, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AdminSection, MusicReleaseRow, useAdminMutations } from '@/components/admin/AdminShared';
import MusicReleaseForm from '@/components/admin/MusicReleaseForm';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

// Music admin: a single scrollable list of releases. Editing one opens a
// focused slide-over panel (one release at a time) so the list never shifts
// and there's no layout gap between successive edits.
export default function MusicAdminPage() {
  const [editingLanding, setEditingLanding] = useState(null);
  const { data: landingPages = [] } = useQuery({ queryKey: ['music-releases-admin'], queryFn: () => base44.entities.MusicRelease.list('-created_date') });
  const { invalidate, handleDelete } = useAdminMutations();
  const closeLandingForm = () => { setEditingLanding(null); invalidate(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Music</h1>
        <Link to="/admin/music-links"><Button variant="outline" size="sm" className="gap-1.5"><Link2 className="h-3.5 w-3.5" /> Platform Links</Button></Link>
      </div>

      <AdminSection title="Releases" icon={Globe} onAdd={() => setEditingLanding({ item: null })} addLabel="New Release">
        <div className="space-y-2">
          {landingPages.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No releases yet. Add your first!</div>}
          {landingPages.map((r) => (
            <MusicReleaseRow key={r.id} release={r} onEdit={(item) => setEditingLanding({ item })} onDelete={(item) => handleDelete('MusicRelease', item)} />
          ))}
        </div>
      </AdminSection>

      <Sheet open={!!editingLanding} onOpenChange={(open) => { if (!open) setEditingLanding(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col gap-0">
          <SheetHeader className="p-6 border-b border-border">
            <SheetTitle className="font-display">{editingLanding?.item ? 'Edit Release' : 'New Release'}</SheetTitle>
            <SheetDescription>Public landing page at /release/&lt;slug&gt;. Manage streaming links in Platform Links, and tracks below.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {editingLanding && (
              <MusicReleaseForm key={editingLanding.item?.id || 'new'} release={editingLanding.item} onSave={closeLandingForm} onCancel={() => setEditingLanding(null)} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}