import { useRef, useState, useEffect } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

/**
 * Wraps a scrollable screen and provides native-feeling pull-to-refresh
 * for iOS WebViews. Calls `onRefresh` when the user swipes down at the top.
 */
export default function PullToRefresh({ onRefresh, threshold = 70, children }) {
  const containerRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(0);
  const active = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onStart = (e) => {
      if (window.scrollY > 0 || refreshingRef.current) return;
      active.current = true;
      startY.current = e.touches[0].clientY;
    };
    const onMove = (e) => {
      if (!active.current || refreshingRef.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0 && window.scrollY <= 0) {
        if (e.cancelable) e.preventDefault();
        const dist = Math.min(delta * 0.5, 100);
        pullRef.current = dist;
        setPull(dist);
      }
    };
    const onEnd = async () => {
      if (!active.current) return;
      active.current = false;
      if (pullRef.current >= threshold) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPull(60);
        try {
          await onRefreshRef.current?.();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setPull(0);
          pullRef.current = 0;
        }
      } else {
        setPull(0);
        pullRef.current = 0;
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [threshold]);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="overflow-hidden flex items-end justify-center transition-[height] duration-200 ease-out"
        style={{ height: pull }}
      >
        {refreshing ? (
          <Loader2 className="h-6 w-6 mb-2 animate-spin text-primary" />
        ) : pull > 8 ? (
          <ArrowDown
            className="h-5 w-5 mb-2 text-primary transition-transform"
            style={{ transform: `rotate(${Math.min(pull * 2, 180)}deg)` }}
          />
        ) : null}
      </div>
      {children}
    </div>
  );
}