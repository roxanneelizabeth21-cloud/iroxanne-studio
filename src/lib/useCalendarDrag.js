import { useEffect, useRef, useState } from 'react';

// Pointer-based dragging for the content calendar.
//
// The calendar used to rely only on the browser's native HTML5 drag events,
// which never fire for touch input — so dragging a card did nothing on a
// tablet or phone. This hook drives the same reschedule flow from pointer
// events (mouse, pen and touch alike), using a dedicated drag handle so normal
// scrolling and tapping still work.
//
// Drop zones are any element carrying a data-date="YYYY-MM-DD" attribute.
export default function useCalendarDrag(onDropOnDate) {
  const [dragId, setDragId] = useState(null);
  const [overKey, setOverKey] = useState(null);
  const active = useRef({ id: null, over: null });

  useEffect(() => {
    if (!dragId) return;

    const finish = (commit) => {
      const { id, over } = active.current;
      active.current = { id: null, over: null };
      setDragId(null);
      setOverKey(null);
      if (commit && id && over) onDropOnDate(id, over);
    };

    const onMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const zone = el && el.closest ? el.closest('[data-date]') : null;
      const key = zone ? zone.getAttribute('data-date') : null;
      active.current.over = key;
      setOverKey(key);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', () => finish(true), { once: true });
    window.addEventListener('pointercancel', () => finish(false), { once: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [dragId, onDropOnDate]);

  // Spread onto the drag handle of a card / chip / queue row.
  const handleProps = (post) => ({
    onPointerDown: (e) => {
      if (typeof e.button === 'number' && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      active.current = { id: post.id, over: null };
      setDragId(post.id);
    },
    style: { touchAction: 'none' },
  });

  return { dragId, overKey, setDragId, setOverKey, handleProps };
}