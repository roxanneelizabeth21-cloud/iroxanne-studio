import { useEffect, useState } from 'react';
import ColorThief from 'colorthief';
import { rgbToHex } from '@/lib/colorUtils';

// Extracts the dominant color (hex) from an image URL using ColorThief.
// Returns { dominant, loading }. dominant is null until the image loads and
// the color is read; it stays null on error (caller falls back to a static theme).
export function useDominantColor(imgUrl) {
  const [dominant, setDominant] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imgUrl) return;
    let cancelled = false;
    setLoading(true);
    setDominant(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const [r, g, b] = new ColorThief().getColor(img);
        if (!cancelled) setDominant(rgbToHex(r, g, b));
      } catch {
        // CORS or read failure — leave dominant null; caller uses fallback theme
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    img.onerror = () => {
      if (!cancelled) setLoading(false);
    };
    img.src = imgUrl;

    return () => {
      cancelled = true;
    };
  }, [imgUrl]);

  return { dominant, loading };
}