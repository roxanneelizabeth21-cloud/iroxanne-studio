import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { resolveIcon } from '@/lib/platformConfig';

// Accepts a YouTube URL (watch, youtu.be share link, embed) OR the full
// embed <iframe> code YouTube provides, and returns a clean /embed/<id> URL
// for our own iframe. Returns null when no YouTube ID can be found.
function normalizeYouTubeEmbed(value) {
  if (!value || typeof value !== 'string') return null;
  let raw = value.trim();

  // If the admin pasted the full embed code, pull out the src="..." URL first.
  const srcMatch = raw.match(/src=["']([^"']+)["']/i);
  if (srcMatch) raw = srcMatch[1];

  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') {
      id = u.pathname.slice(1) || null;
    } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      if (u.pathname.startsWith('/embed/')) {
        id = u.pathname.slice('/embed/'.length);
      } else if (u.pathname === '/watch') {
        id = u.searchParams.get('v');
      } else if (u.pathname.startsWith('/shorts/')) {
        id = u.pathname.slice('/shorts/'.length);
      }
    }
    if (!id) return null;
    // strip trailing query/path noise from the id
    id = id.split('/')[0].split('?')[0];
    // Use youtube-nocookie.com — the regular youtube.com host throws
    // "Error 153 / Video player configuration error" on many embed contexts.
    return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch {
    return null;
  }
}

export function useReleasePlatformLinks(slug) {
  const { data: release, isLoading: releaseLoading } = useQuery({
    queryKey: ['music-release', slug],
    queryFn: async () => {
      const results = await base44.entities.MusicRelease.filter({ slug, is_active: true });
      return results[0] || null;
    },
  });

  const releaseId = release?.id;
  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ['music-platform-links-public', releaseId],
    queryFn: () => base44.entities.MusicPlatformLink.filter({ release_id: releaseId, is_visible: true }, 'sort_order'),
    enabled: !!releaseId,
  });

  const platforms = links
    .filter((l) => l.url && l.url.trim() !== '')
    .map((l) => ({
      name: l.platform_name,
      subtext: l.display_label,
      Icon: resolveIcon(l.icon_name),
      platformType: l.platform_type,
      url: l.url,
    }));

  const youtubePlatform = platforms.find((p) => p.name === 'YouTube');
  const youtubeUrl = youtubePlatform?.url || null;
  const youtubeEmbedUrl = normalizeYouTubeEmbed(release?.youtube_embed_url);

  return {
    release,
    platforms,
    youtubeEmbedUrl,
    youtubeUrl,
    isLoading: releaseLoading || (!!releaseId && linksLoading),
  };
}