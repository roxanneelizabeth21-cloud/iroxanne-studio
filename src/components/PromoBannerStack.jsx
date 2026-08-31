import { useState, useEffect } from 'react';
import { usePromoBanners } from '@/hooks/usePromoBanners';
import PromoBanner from '@/components/PromoBanner';

// Renders the stack of active promo banners for a page, ordered by sort_order.
// Dismissible banners stay hidden per device — dismissed ids are stored in one
// localStorage array so the dismissal survives reloads and applies across pages.
export default function PromoBannerStack({ pageKey }) {
  const banners = usePromoBanners(pageKey);

  const [dismissed, setDismissed] = useState(() => {
    try {
      const raw = localStorage.getItem('promo_dismissed');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('promo_dismissed', JSON.stringify([...dismissed]));
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, [dismissed]);

  const dismiss = (id) => setDismissed((prev) => {
    const next = new Set(prev);
    next.add(id);
    return next;
  });

  const visible = banners.filter((b) => !dismissed.has(b.id));
  if (!visible.length) return null;

  return (
    <div className="w-full">
      {visible.map((b) => (
        <PromoBanner key={b.id} banner={b} onDismiss={() => dismiss(b.id)} />
      ))}
    </div>
  );
}