// Shared plumbing for the small contextual back arrow in the Marketing page header.
//
// A page (Create Post) can register a guard that must finish successfully before
// the arrow is allowed to navigate — that is how the in-progress Draft gets
// saved before the owner leaves.

let guard = null;

export function registerMarketingBackGuard(fn) {
  guard = fn;
  return () => { if (guard === fn) guard = null; };
}

export async function runMarketingBackGuard() {
  if (!guard) return { ok: true };
  try {
    return (await guard()) || { ok: true };
  } catch (e) {
    return { ok: false, message: e?.message || '' };
  }
}

export const MARKETING_HOME = '/marketing';

// True when going back would leave the app entirely (or land nowhere useful).
// history.state.idx is maintained by React Router: 0 means this entry is the
// first one in this tab, so there is no safe in-app page behind it.
export function hasSafeInAppHistory() {
  const idx = window.history.state?.idx;
  if (typeof idx === 'number') return idx > 0;
  return window.history.length > 1;
}