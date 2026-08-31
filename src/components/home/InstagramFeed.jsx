import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Instagram } from 'lucide-react';
import StageSection from '@/components/home/StageSection';

export default function InstagramFeed({ fluid }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['instagram-feed'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getInstagramFeed', {});
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const posts = Array.isArray(data?.posts) ? data.posts : [];

  if (isLoading) {
    return (
      <StageSection fluid={fluid} title="On Instagram">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      </StageSection>
    );
  }

  // Silently omit the section if the feed can't be loaded (no connection yet,
  // token revoked, etc.) rather than showing visitors an error block.
  if (isError || posts.length === 0) return null;

  return (
    <StageSection
      fluid={fluid} title="On Instagram"
      action={
        data?.profile_url ? (
          <a
            href={data.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            @{data.username || 'roxsan'}
          </a>
        ) : null
      }
    >
      <div className="grid grid-cols-3 gap-2">
        {posts.map((post) => {
          const thumb = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
          return (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-xl bg-secondary/20 border border-primary/15"
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={post.caption ? post.caption.slice(0, 80) : 'Instagram post'}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Instagram className="h-8 w-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                {post.caption && (
                  <p className="text-xs text-white/90 line-clamp-3 drop-shadow">
                    {post.caption}
                  </p>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </StageSection>
  );
}