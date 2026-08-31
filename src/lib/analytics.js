// Analytics helper functions for the iRoxanne Studio visitor tracking system.

// --- Tracking helpers (client-side, used by PageVisitTracker) ---

export function getOrCreateId(key, storage) {
  try {
    let id = storage.getItem(key);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2) + Date.now().toString(36);
      storage.setItem(key, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

export function parseUTMParams(search) {
  const params = new URLSearchParams(search);
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
  };
}

export function classifyReferrer(referrer) {
  if (!referrer || !referrer.trim()) {
    return { source: 'Direct / None', medium: 'None' };
  }
  let host;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return { source: 'Direct / None', medium: 'None' };
  }
  if (host.includes('l.instagram.com') || host.includes('instagram.com')) return { source: 'Instagram', medium: 'Social' };
  if (host.includes('l.facebook.com') || host.includes('facebook.com')) return { source: 'Facebook', medium: 'Social' };
  if (host.includes('tiktok.com')) return { source: 'TikTok', medium: 'Social' };
  if (host.includes('youtu.be') || host.includes('youtube.com')) return { source: 'YouTube', medium: 'Social' };
  if (host.includes('google.com')) return { source: 'Google', medium: 'Search' };
  if (host.includes('bing.com')) return { source: 'Bing', medium: 'Search' };
  if (host.includes('x.com') || host.includes('twitter.com')) return { source: 'X / Twitter', medium: 'Social' };
  if (host.includes('mail.google.com') || host.includes('outlook.live.com')) return { source: 'Email', medium: 'Email' };
  return { source: host.replace(/^www\./, ''), medium: 'Referral' };
}

export function detectDeviceType(ua) {
  if (!ua) return 'Unknown';
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

export function detectBrowser(ua) {
  if (!ua) return 'Unknown';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua)) return 'Opera';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua)) return 'Safari';
  return 'Unknown';
}

// --- Dashboard helpers (admin-side) ---

export function summarizeVisits(visits) {
  const perSource = {};
  const perLandingPage = {};
  const visitors = new Set();
  for (const v of visits) {
    if (v.visitor_id) visitors.add(v.visitor_id);
    const source = v.source || 'Direct / None';
    perSource[source] = (perSource[source] || 0) + 1;
    const landing = v.landing_page || v.current_page || '(unknown)';
    perLandingPage[landing] = (perLandingPage[landing] || 0) + 1;
  }
  return {
    total: visits.length,
    uniqueVisitors: visitors.size,
    topSources: Object.entries(perSource).sort((a, b) => b[1] - a[1]),
    topLandingPages: Object.entries(perLandingPage).sort((a, b) => b[1] - a[1]),
  };
}

export function formatPageLabel(path) {
  if (!path) return '(unknown)';
  if (path === '/') return 'Home';
  return path;
}

// Basic email format validation (RFC-5322 simplified) — used by fan-capture forms.
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}