import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const normTitle = (s) => (s || '').toLowerCase().trim();

export default function LyricsExportPage() {
  const [building, setBuilding] = useState(false);
  const [scope, setScope] = useState('all'); // 'all' or a release id

  const { data: profiles = [], isLoading: pLoading } = useQuery({ queryKey: ['song-profiles-export'], queryFn: () => base44.entities.SongProfile.list('-created_date', 200) });
  const { data: tracks = [], isLoading: tLoading } = useQuery({ queryKey: ['tracks-export'], queryFn: () => base44.entities.Track.list('-created_date', 500) });
  const { data: releases = [], isLoading: rLoading } = useQuery({ queryKey: ['music-releases-export'], queryFn: () => base44.entities.MusicRelease.list('-created_date', 200) });

  const loading = pLoading || tLoading || rLoading;

  const sortedReleases = useMemo(() => [...releases].sort((a, b) => (a.title || '').localeCompare(b.title || '')), [releases]);

  // Filter profiles + tracks to the selected scope.
  const scopedProfiles = useMemo(() => {
    if (scope === 'all') return profiles;
    return profiles.filter((p) => p.song_id === scope);
  }, [profiles, scope]);

  const scopedTracks = useMemo(() => {
    if (scope === 'all') return tracks;
    return tracks.filter((t) => t.release_id === scope);
  }, [tracks, scope]);

  const scopedRelease = scope === 'all' ? null : releases.find((r) => r.id === scope);

  const buildPlainText = () => {
    const releaseById = (id) => releases.find((r) => r.id === id);
    const sorted = [...scopedProfiles].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    const profileTitles = new Set(sorted.map((p) => normTitle(p.title)));
    const extra = scopedTracks.filter((t) => t.lyrics && t.lyrics.trim() && !profileTitles.has(normTitle(t.title)));

    const heading = scopedRelease ? `ROXSAN — ${scopedRelease.title}` : 'ROXSAN — Complete Song Lyrics';
    let txt = `${heading}\nGenerated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n========================================\n\n`;

    for (const p of sorted) {
      txt += `${(p.title || 'Untitled').toUpperCase()}\n`;
      txt += '----------------------------------------\n';
      txt += p.lyrics && p.lyrics.trim() ? `${p.lyrics.trim()}\n\n` : `(No lyrics saved yet)\n\n`;
      txt += '========================================\n\n';
    }
    if (extra.length) {
      txt += `ADDITIONAL TRACKS WITH LYRICS\n========================================\n\n`;
      for (const t of [...extra].sort((a, b) => (a.title || '').localeCompare(b.title || ''))) {
        const rel = releaseById(t.release_id);
        txt += `${(t.title || 'Untitled').toUpperCase()}${rel ? ` — ${rel.title}` : ''}\n`;
        txt += '----------------------------------------\n';
        txt += `${t.lyrics.trim()}\n\n========================================\n\n`;
      }
    }
    return txt;
  };

  const buildMarkdown = () => {
    const releaseById = (id) => releases.find((r) => r.id === id);
    const sorted = [...scopedProfiles].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const titleHeading = scopedRelease ? `# ROXSAN — ${scopedRelease.title} — Lyrics` : `# ROXSAN — Complete Song Lyrics`;

    let md = `${titleHeading}\n\n_Generated ${today}_\n\n---\n\n`;
    md += scopedRelease ? `` : `## Song Library (${sorted.length} songs)\n\n`;

    for (const p of sorted) {
      md += `### ${p.title || 'Untitled'}\n`;
      if (p.song_id) {
        const rel = releaseById(p.song_id);
        if (rel) md += '**Release:** ' + rel.title + ' (`/release/' + rel.slug + '`)\n\n';
      }
      if (p.release_status) md += `**Status:** ${p.release_status}\n\n`;
      md += p.lyrics && p.lyrics.trim() ? `${p.lyrics.trim()}\n\n` : `*No lyrics saved yet.*\n\n`;
      md += `---\n\n`;
    }

    const profileTitles = new Set(sorted.map((p) => normTitle(p.title)));
    const extra = scopedTracks.filter((t) => t.lyrics && t.lyrics.trim() && !profileTitles.has(normTitle(t.title)));
    if (extra.length) {
      md += `## Additional Tracks with Lyrics\n\n`;
      for (const t of [...extra].sort((a, b) => (a.title || '').localeCompare(b.title || ''))) {
        const rel = releaseById(t.release_id);
        md += `### ${t.title || 'Untitled'}${rel ? ` — ${rel.title}` : ''}\n`;
        if (t.track_number) md += `**Track #${t.track_number}**\n\n`;
        md += `${t.lyrics.trim()}\n\n---\n\n`;
      }
    }

    md += `\n_Summary: ${sorted.length} songs${extra.length ? `, ${extra.length} additional tracks with lyrics` : ''}._\n`;
    return md;
  };

  const handleDownload = (format) => {
    setBuilding(true);
    try {
      const isTxt = format === 'txt';
      const content = isTxt ? buildPlainText() : buildMarkdown();
      const blob = new Blob([content], { type: isTxt ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const slug = scopedRelease ? (scopedRelease.slug || scopedRelease.title || 'release').toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'all-lyrics';
      const a = document.createElement('a');
      a.href = url;
      a.download = `roxsan-${slug}-${new Date().toISOString().split('T')[0]}.${isTxt ? 'txt' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBuilding(false);
    }
  };

  const songCount = scopedProfiles.length;
  const withLyrics = scopedProfiles.filter((p) => p.lyrics && p.lyrics.trim()).length;
  const trackExtras = scopedTracks.filter((t) => t.lyrics && t.lyrics.trim() && !scopedProfiles.some((p) => normTitle(p.title) === normTitle(t.title))).length;
  const hasContent = songCount + trackExtras > 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Lyrics Export</h1>
        <p className="text-sm text-muted-foreground mt-1">Download lyrics for everything or a specific album/single.</p>
      </div>

      <div className="rounded-xl border border-border/50 p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Which lyrics?</label>
          <Select value={scope} onValueChange={setScope} disabled={loading}>
            <SelectTrigger><SelectValue placeholder="Choose a scope" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All releases (everything)</SelectItem>
              {sortedReleases.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm space-y-1">
            <p><strong>{songCount}</strong> songs {scope === 'all' ? 'in the Song Library' : 'on this release'}</p>
            <p><strong>{withLyrics}</strong> have lyrics saved</p>
            {trackExtras > 0 && <p className="text-muted-foreground">Plus {trackExtras} track(s) with lyrics not in the library.</p>}
          </div>
        </div>

        {!hasContent && !loading && (
          <p className="text-sm text-muted-foreground">No lyrics found for this selection yet.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => handleDownload('md')} disabled={loading || building || !hasContent} className="gap-2">
            {loading || building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {loading ? 'Loading…' : building ? 'Building…' : 'Markdown'}
          </Button>
          <Button onClick={() => handleDownload('txt')} disabled={loading || building || !hasContent} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Plain Text
          </Button>
        </div>
      </div>
    </div>
  );
}