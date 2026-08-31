import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Continuous autosave for one in-progress MarketingPost.
//
// - Selections queue with no debounce, text editing with a short one.
// - Writes are chained, so a slower earlier save can never land after a newer
//   one, and unsaved fields survive a failed write (newest value wins).
export default function useDraftAutosave(getPostId) {
  const [status, setStatus] = useState('idle'); // idle | pending | saving | saved | error
  const [savedAt, setSavedAt] = useState(null);
  const pending = useRef({});
  const timer = useRef(null);
  const chain = useRef(Promise.resolve(true));

  useEffect(() => () => clearTimeout(timer.current), []);

  const write = useCallback(async () => {
    const id = getPostId();
    const payload = pending.current;
    if (!id || !Object.keys(payload).length) return true;
    pending.current = {};
    setStatus('saving');
    try {
      await base44.entities.MarketingPost.update(id, payload);
      // Anything queued while this write was in flight is newer — keep it queued.
      if (Object.keys(pending.current).length) setStatus('pending');
      else { setStatus('saved'); setSavedAt(new Date()); }
      return true;
    } catch {
      pending.current = { ...payload, ...pending.current };
      setStatus('error');
      return false;
    }
  }, [getPostId]);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = null;
    chain.current = chain.current.then(write, write);
    return chain.current;
  }, [write]);

  const queue = useCallback((fields, debounce = 0) => {
    if (!fields || !Object.keys(fields).length) return;
    pending.current = { ...pending.current, ...fields };
    setStatus('pending');
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, debounce);
  }, [flush]);

  const hasUnsaved = useCallback(() => !!Object.keys(pending.current).length, []);

  return { status, savedAt, queue, flush, hasUnsaved };
}