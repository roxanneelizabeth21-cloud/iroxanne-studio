import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Upload, Pencil, Trash2, Loader2, Music, FileAudio, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SongProfileForm from '@/components/marketing/SongProfileForm';
import BulkImportSongs from '@/components/marketing/BulkImportSongs';
import BulkUploadAudio from '@/components/marketing/BulkUploadAudio';
import AudioPreviewButton from '@/components/marketing/AudioPreviewButton';
import ReplaceAudioButton from '@/components/marketing/ReplaceAudioButton';
import { RELEASE_STATUSES, formatDate } from '@/lib/marketing';

const STATUS_STYLES = {
  Unreleased: 'bg-muted text-muted-foreground',
  Upcoming: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  Released: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

// SongProfiles — the song knowledge base. List, add/edit single songs, and bulk import.
export default function SongProfiles() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | { id, ...profile } | 'new'
  const [bulkOpen, setBulkOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [albumFilter, setAlbumFilter] = useState('all');

  const { data: profiles = [], isLoading } = useQuery({ queryKey: ['song-profiles'], queryFn: () => base44.entities.SongProfile.list('-created_date') });
  const { data: releases = [] } = useQuery({ queryKey: ['music-releases-admin'], queryFn: () => base44.entities.MusicRelease.list() });

  const isNew = editing === 'new';
  const editProfile = editing && editing !== 'new' ? editing : null;

  // Lookup so we can read a linked release's type when filtering by Single/Album.
  const releaseById = Object.fromEntries(releases.map((r) => [r.id, r]));
  const typeOf = (p) => (p.song_id && releaseById[p.song_id] ? releaseById[p.song_id].release_type : '');

  // Every release now has song profiles, so show all of them grouped by type.
  const releasesInType = releases.filter((r) => typeFilter === 'all' || r.release_type === typeFilter);
  const afterTypeFilter = typeFilter === 'all'
    ? profiles
    : profiles.filter((p) => typeOf(p) === typeFilter);
  const filteredProfiles = (albumFilter === 'all'
    ? afterTypeFilter
    : albumFilter === 'unassigned'
      ? afterTypeFilter.filter((p) => !p.song_id)
      : afterTypeFilter.filter((p) => p.song_id === albumFilter)
  ).slice().sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));

  const save = async (payload) => {
    try {
      if (editProfile) {
        await base44.entities.SongProfile.update(editProfile.id, payload);
        toast({ title: 'Song updated' });
      } else {
        await base44.entities.SongProfile.create(payload);
        toast({ title: 'Song added' });
      }
      qc.invalidateQueries({ queryKey: ['song-profiles'] });
      setEditing(null);
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  const del = async (p) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    try {
      await base44.entities.SongProfile.delete(p.id);
      qc.invalidateQueries({ queryKey: ['song-profiles'] });
      toast({ title: 'Song deleted' });
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const toggleEvergreen = async (p) => {
    try {
      await base44.entities.SongProfile.update(p.id, { evergreen_on: !p.evergreen_on });
      qc.invalidateQueries({ queryKey: ['song-profiles'] });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2"><Music className="h-5 w-5 text-primary" /> Song Library</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setAlbumFilter('all'); }} className="w-auto min-w-[120px]" aria-label="Filter by type">
            <option value="all">All ({profiles.length})</option>
            <option value="Single">Singles ({profiles.filter((p) => typeOf(p) === 'Single').length})</option>
            <option value="Album">Albums ({profiles.filter((p) => typeOf(p) === 'Album').length})</option>
          </select>
          <select value={albumFilter} onChange={(e) => setAlbumFilter(e.target.value)} className="w-auto min-w-[160px]" aria-label="Filter by release">
            <option value="all">{typeFilter === 'all' ? 'All releases' : 'All ' + (typeFilter === 'Single' ? 'singles' : 'albums')} ({afterTypeFilter.length})</option>
            <option value="unassigned">Unassigned ({afterTypeFilter.filter((p) => !p.song_id).length})</option>
            {releasesInType.map((r) => {
              const count = profiles.filter((p) => p.song_id === r.id).length;
              return <option key={r.id} value={r.id}>{r.title} ({count})</option>;
            })}
          </select>
          <Button variant="outline" size="sm" onClick={() => { setAudioOpen((v) => !v); setEditing(null); setBulkOpen(false); }} className="gap-1.5"><FileAudio className="h-3.5 w-3.5" /> Upload audio</Button>
          <Button variant="outline" size="sm" onClick={() => { setBulkOpen((v) => !v); setEditing(null); setAudioOpen(false); }} className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Bulk import</Button>
          <Button size="sm" onClick={() => { setEditing('new'); setBulkOpen(false); setAudioOpen(false); }} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add song</Button>
        </div>
      </div>

      {bulkOpen && (
        <div className="glass rounded-2xl p-5">
          <BulkImportSongs onDone={() => setBulkOpen(false)} />
        </div>
      )}

      {audioOpen && (
        <div className="glass rounded-2xl p-5">
          <BulkUploadAudio onDone={() => setAudioOpen(false)} />
        </div>
      )}

      {isNew && (
        <div className="glass rounded-2xl p-5">
          <SongProfileForm releases={releases} onSave={save} onCancel={() => setEditing(null)} />
        </div>
      )}

      {editProfile && (
        <div className="glass rounded-2xl p-5">
          <SongProfileForm profile={editProfile} releases={releases} onSave={save} onCancel={() => setEditing(null)} />
        </div>
      )}

      {profiles.length === 0 && !bulkOpen && !editing ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No songs yet. <button onClick={() => setBulkOpen(true)} className="text-primary hover:underline">Bulk import your catalog</button> or add one at a time.
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No songs in this album. <button onClick={() => setAlbumFilter('all')} className="text-primary hover:underline">Show all</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProfiles.map((p) => {
            const hasLyrics = !!(p.lyrics && p.lyrics.trim());
            return (
            <div key={p.id} className={`glass rounded-xl p-4 transition-opacity ${hasLyrics ? '' : 'opacity-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate flex items-center gap-2">
                    <Music className="h-3.5 w-3.5 text-primary shrink-0" /> {p.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {Array.isArray(p.themes) && p.themes.length ? p.themes.join(' · ') : 'no themes'} · {hasLyrics ? `${String(p.lyrics).split('\n').length} lines` : 'no lyrics'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${p.audio_file ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`} title={p.audio_file ? 'Audio uploaded' : 'No audio uploaded'}>
                    <FileAudio className="h-3 w-3" /> {p.audio_file ? 'Audio' : 'No audio'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${hasLyrics ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`} title={hasLyrics ? 'Lyrics added' : 'No lyrics yet'}>
                    <FileText className="h-3 w-3" /> {hasLyrics ? 'Lyrics' : 'No lyrics'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[p.release_status] || STATUS_STYLES.Unreleased}`}>{p.release_status}</span>
                  {p.release_date && <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(p.release_date)}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {p.audio_file && <AudioPreviewButton src={p.audio_file} />}
                <ReplaceAudioButton profileId={p.id} onDone={() => qc.invalidateQueries({ queryKey: ['song-profiles'] })} />
                <Button variant="outline" size="sm" onClick={() => { setEditing(p); setBulkOpen(false); }} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="outline" size="sm" onClick={() => toggleEvergreen(p)} className="gap-1.5">
                  {p.evergreen_on !== false ? 'Evergreen: on' : 'Evergreen: off'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => del(p)} className="gap-1.5 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}