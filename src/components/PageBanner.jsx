import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function PageBanner({ icon: Icon, badge, title, subtitle, pageKey }) {
  const { data: banners = [] } = useQuery({
    queryKey: ['page-banners'],
    queryFn: () => base44.entities.PageBannerImage.list(),
    enabled: !!pageKey,
  });

  const banner = pageKey ? banners.find((b) => b.page_key === pageKey) : null;
  const image = banner?.image_url;

  if (!image) {
    // Slim text header fallback when no hero image is configured.
    return (
      <section className="w-full max-w-6xl mx-auto px-4 pt-8 pb-2">
        <div className="flex items-center gap-2 mb-3">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          {badge && (
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-sm sm:text-base text-muted-foreground">
            {subtitle}
          </p>
        )}
      </section>
    );
  }

  // Full-width hero banner with the configured image.
  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0">
        <img src={image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/55" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 flex flex-col items-start">
        <div className="flex items-center gap-2 mb-3">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          {badge && (
            <span className="text-xs font-medium uppercase tracking-wider text-primary/90">
              {badge}
            </span>
          )}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white text-glow">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-base sm:text-lg text-white/85">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}