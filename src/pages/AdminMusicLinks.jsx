import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link2, Plus, Sparkles, Music, ChevronRight, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import PlatformLinkCard from '@/components/admin/PlatformLinkCard';
import { PLATFORM_DEFAULTS } from '@/lib/platformConfig';

export default function AdminMusicLinks() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['music-releases-admin'],
    queryFn: () => base44.entities.MusicRelease.list('-created_date'),
  });

  useEffect(() => {
    if (!selectedId && releases.length > 0) setSelectedId(releases[0].id);
  }, [releases, selectedId]);

  const selected = releases.find((r) => r.id === selectedId);

  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ['music-platform-links-admin', selectedId],
    queryFn: () => base44.entities.MusicPlatformLink.filter({ release_id: selectedId }, 'sort_order'),
    enabled: !!selectedId,
  });

  const invalidateLinks = () => {
    qc.invalidateQueries({ queryKey: ['music-platform-links-admin', selectedId] });
    qc.invalidateQueries({ queryKey: ['music-platform-links-public'] });
  };

  const handleSave = async (updated) => {
    try {
      await base44.entities.MusicPlatformLink.update(updated.id, {
        url: updated.url,
        display_label: updated.display_label,
        sort_order: updated.sort_order,
        is_visible: updated.is_visible,
      });
      toast({ title: 'Saved', description: `${updated.platform_name} updated.` });
      invalidateLinks();
    } catch (e) {
      toast({ title: 'Error saving', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (link) => {
    if (!confirm(`Delete "${link.platform_name}"?`)) return;
    try {
      await base44.entities.MusicPlatformLink.delete(link.id);
      toast({ title: 'Deleted', description: `${link.platform_name} removed.` });
      invalidateLinks();
    } catch (e) {
      toast({ title: 'Error deleting', description: e.message, variant: 'destructive' });
    }
  };

  const handleAddDefaults = async () => {
    const existingTypes = new Set(links.map((l) => l.platform_type));
    const missing = PLATFORM_DEFAULTS.filter((p) => !existingTypes.has(p.platform_type));
    if (missing.length === 0) {
      toast({ title: 'All default platforms already exist.' });
      return;
    }
    try {
      await base44.entities.MusicPlatformLink.bulkCreate(
        missing.map((p) => ({ ...p, release_id: selectedId, url: '', is_visible: false, opens_in_new_tab: true }))
      );
      toast({ title: 'Platforms added', description: `${missing.length} default platform${missing.length > 1 ? 's' : ''} added.` });
      invalidateLinks();
    } catch (e) {
      toast({ title: 'Error adding platforms', description: e.message, variant: 'destructive' });
    }
  };

  const handleAddCustom = async () => {
    try {
      await base44.entities.MusicPlatformLink.create({
        release_id: selectedId,
        platform_name: 'New Platform',
        platform_type: 'other',
        display_label: 'Listen on New Platform',
        url: '',
        is_visible: false,
        sort_order: (links.length || 0) + 1,
        icon_name: 'Play',
        opens_in_new_tab: true,
      });
      toast({ title: 'Platform added', description: 'Edit the new platform below.' });
      invalidateLinks();
    } catch (e) {
      toast({ title: 'Error adding platform', description: e.message, variant: 'destructive' });
    }
  };

  const liveCount = links.filter((l) => l.is_visible && l.url?.trim()).length;
  const hiddenCount = links.filter((l) => !l.is_visible).length;
  const missingCount = links.filter((l) => l.is_visible && !l.url?.trim()).length;

  return (
    <div className="min-h-screen">
      <section className="relative py-12 px-4 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Admin</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Music Platform Links</h1>
          <p className="text-muted-foreground text-sm">Manage where each release can be streamed or watched.</p>
        </motion.div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Release selector */}
          <div className="space-y-2">
            <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Releases</h2>
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
            ) : releases.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1">No releases found.</p>
            ) : (
              releases.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all ${
                    r.id === selectedId ? 'glass border-primary/30' : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-secondary/60">
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={r.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Music className="h-4 w-4 text-muted-foreground/40" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.release_type}</p>
                  </div>
                  {r.id === selectedId && <ChevronRight className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>

          {/* Platform links editor */}
          <div className="space-y-4">
            {selected && (
              <>
                <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{selected.title}</h2>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {liveCount} live</span>
                      <span className="inline-flex items-center gap-1"><EyeOff className="h-3 w-3" /> {hiddenCount} hidden</span>
                      {missingCount > 0 && <span className="inline-flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3 w-3" /> {missingCount} missing URL</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAddDefaults}>
                      <Sparkles className="h-3.5 w-3.5" /> Add Default Platforms
                    </Button>
                    <Button size="sm" className="gap-1.5" onClick={handleAddCustom}>
                      <Plus className="h-3.5 w-3.5" /> Add Platform
                    </Button>
                  </div>
                </div>

                {linksLoading ? (
                  <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                ) : links.length === 0 ? (
                  <div className="glass rounded-2xl p-12 text-center">
                    <Music className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-4">No platform links yet for this release.</p>
                    <Button size="sm" className="gap-1.5" onClick={handleAddDefaults}>
                      <Sparkles className="h-3.5 w-3.5" /> Add Default Platforms
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {links.map((link) => (
                      <PlatformLinkCard key={link.id} link={link} onSave={handleSave} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}