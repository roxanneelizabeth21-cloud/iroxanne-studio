// Device-aware share helpers for the Ready-to-Post drawer.
// No OAuth, no Meta Graph API — uses the browser's native Web Share API on
// mobile when it can share files, and falls back to download + copy on desktop.

export function supportsFileShare() {
  return typeof navigator !== 'undefined'
    && typeof navigator.canShare === 'function'
    && typeof navigator.share === 'function';
}

// Whether this device can share a video file via the native share sheet.
export function canShareVideoFile() {
  if (!supportsFileShare()) return false;
  try {
    const f = new File(['x'], 't.mp4', { type: 'video/mp4' });
    return navigator.canShare({ files: [f] });
  } catch {
    return false;
  }
}

export function isTouchDevice() {
  return typeof window !== 'undefined'
    && ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);
}

// Facebook sharer URL. The page URL must carry the right Open Graph tags for
// the Facebook crawler (which does not run client-side JS) to render a preview.
export function facebookShareUrl(pageUrl, caption) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl || '')}&quote=${encodeURIComponent(caption || '')}`;
}

// Download a remote file to the device by streaming it through a blob URL.
export async function downloadFile(url, filename) {
  if (!url) return false;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename || 'iroxanne-post';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
    return true;
  } catch {
    return false;
  }
}

// Fetch a remote video and return a File suitable for navigator.share({ files }).
export async function fetchVideoFile(url, filename) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new File([blob], filename || 'iroxanne-post.mp4', { type: blob.type || 'video/mp4' });
}

// Open the native mobile share sheet with a video file + caption.
export async function nativeShareVideo(videoUrl, filename, text, title) {
  const file = await fetchVideoFile(videoUrl, filename);
  await navigator.share({ files: [file], text, title });
}