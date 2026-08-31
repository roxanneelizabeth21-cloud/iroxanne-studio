import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const BADGE = {
  Paused: 'bg-secondary text-secondary-foreground',
  Active: 'bg-accent text-accent-foreground',
  Failed: 'bg-destructive/15 text-destructive',
};

// Carousel ads this app created in Meta.
export default function LaunchedAdsList() {
  const { data: ads = [] } = useQuery({
    queryKey: ['carousel-ads'],
    queryFn: () => base44.entities.CarouselAd.list('-created_date', 20),
  });

  if (!ads.length) return null;

  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <h3 className="font-display text-lg font-semibold">Carousel ads you've created</h3>
      <div className="space-y-2">
        {ads.map((ad) => (
          <div key={ad.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-2">
            {ad.slides?.[0]?.image_url && (
              <img src={ad.slides[0].image_url} alt="" className="h-12 w-12 rounded object-cover bg-muted shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{ad.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {(ad.slides || []).length} slides · ${ad.daily_budget_usd}/day · {(ad.countries || []).join(', ')}
                {ad.launch_error ? ` · ${ad.launch_error}` : ''}
              </p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${BADGE[ad.delivery_status] || BADGE.Paused}`}>
              {ad.delivery_status || 'Paused'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}