import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Local calendar date as YYYY-MM-DD (not UTC) so start/end_date comparisons
// match the admin's intent in their own timezone.
const localToday = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Returns the active, in-date-range banners that target the given page key.
// Dismissal (per-device localStorage) is handled by the rendering component.
export function usePromoBanners(pageKey) {
  const { data: banners = [] } = useQuery({
    queryKey: ['promo-banners'],
    queryFn: () => base44.entities.PromoBanner.list('sort_order'),
    staleTime: 60000,
  });

  const today = localToday();
  return banners.filter((b) => {
    if (!b.is_active) return false;
    const pages = String(b.target_pages || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!pages.includes('all') && !pages.includes(pageKey)) return false;
    if (b.start_date && today < b.start_date) return false;
    if (b.end_date && today > b.end_date) return false;
    return true;
  });
}