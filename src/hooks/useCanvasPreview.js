import { useEffect, useState } from 'react';
import { drawProjectCanvas } from '@/lib/drawProjectCanvas';

// Renders a live color-matched canvas preview at the chosen platform's real size.
export default function useCanvasPreview({ project, color, preset, cta, subtext, services }) {
  const [preview, setPreview] = useState('');
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!project?.cover_image_url || !preset) {
      setPreview('');
      return;
    }
    let cancelled = false;
    setRendering(true);
    drawProjectCanvas({
      coverUrl: project.cover_image_url,
      title: project.title,
      studioName: project.studio_name || 'iRoxanne Studio',
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
  }, [project, color, preset, cta, subtext, services]);

  return { preview, rendering };
}