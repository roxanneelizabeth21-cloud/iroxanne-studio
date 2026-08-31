import { useEffect, useState } from 'react';
import { drawAlbumCanvas } from '@/lib/drawAlbumCanvas';

// Renders a live color-matched canvas preview at the chosen platform's real size.
export default function useCanvasPreview({ release, color, preset, cta, subtext, services }) {
  const [preview, setPreview] = useState('');
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!release?.cover_image_url || !preset) {
      setPreview('');
      return;
    }
    let cancelled = false;
    setRendering(true);
    drawAlbumCanvas({
      coverUrl: release.cover_image_url,
      title: release.title,
      artist: release.artist_name || 'ROXSAN',
      color,
      ratio: preset.ratio,
      width: preset.w,
      height: preset.h,
      safeBottom: preset.safeBottom,
      cta,
      subtext,
      services,
    })
      .then((canvas) => { if (!cancelled) setPreview(canvas.toDataURL('image/png')); })
      .catch(() => { if (!cancelled) setPreview(''); })
      .finally(() => { if (!cancelled) setRendering(false); });
    return () => { cancelled = true; };
  }, [release, color, preset, cta, subtext, services]);

  return { preview, rendering };
}