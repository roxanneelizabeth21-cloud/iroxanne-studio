import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { resolveIcon } from '@/lib/platformConfig';

// Fetches the Tracks and visible MusicPlatformLink records for a single
// MusicRelease (by id). Used by the Music page and homepage cards so each card
// can show its tracklist + streaming buttons without a parent Release lookup.
//
// Tracks come from the getPublicReleaseTracks backend function, which redacts
// audio_file for upcoming releases so no audio URLs reach the browser until the
// release is out. Admin (TrackManager) reads tracks directly via the SDK.
export function useMusicReleaseChildren(releaseId, { includeHidden = false } = {}) {
  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ['tracks', releaseId, 'public'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getPublicReleaseTracks', { releaseId });
      return res.data;
    },
    enabled: !!releaseId,
  });
  const tracks = tracksData?.tracks || [];

  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ['music-platform-links', releaseId, includeHidden],
    queryFn: () =>
      base44.entities.MusicPlatformLink.filter(
        includeHidden ? { release_id: releaseId } : { release_id: releaseId, is_visible: true },
        'sort_order'
      ),
    enabled: !!releaseId,
  });

  const platforms = links
    .filter((l) => l.url && String(l.url).trim() !== '')
    .map((l) => ({
      name: l.platform_name,
      subtext: l.display_label,
      Icon: resolveIcon(l.icon_name),
      platformType: l.platform_type,
      url: l.url,
    }));

  return { tracks, platforms, isLoading: tracksLoading || linksLoading };
}