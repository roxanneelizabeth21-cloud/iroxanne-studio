import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const enc = new TextEncoder();
const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (text: string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text))));

function classifyRef(ref: string): { source: string; medium: string } {
  if (!ref) return { source: 'Direct / None', medium: 'None' };
  const r = ref.toLowerCase();
  if (r.includes('instagram.com')) return { source: 'Instagram', medium: 'Social' };
  if (r.includes('facebook.com') || r.includes('fb.com')) return { source: 'Facebook', medium: 'Social' };
  if (r.includes('linkedin.com')) return { source: 'LinkedIn', medium: 'Social' };
  if (r.includes('tiktok.com')) return { source: 'TikTok', medium: 'Social' };
  if (r.includes('youtube.com') || r.includes('youtu.be')) return { source: 'YouTube', medium: 'Social' };
  if (r.includes('google.') || r.includes('bing.com') || r.includes('duckduckgo.com')) return { source: 'Search', medium: 'Organic' };
  return { source: 'Referral', medium: 'Referral' };
}

function detectUA(ua: string): { device_type: string; browser: string } {
  const u = ua.toLowerCase();
  const device_type = /ipad|tablet/.test(u) ? 'Tablet' : /mobi|android|iphone/.test(u) ? 'Mobile' : 'Desktop';
  const browser = u.includes('edg/')
    ? 'Edge'
    : u.includes('chrome/') && !u.includes('edg/')
    ? 'Chrome'
    : u.includes('safari/') && !u.includes('chrome/')
    ? 'Safari'
    : u.includes('firefox/')
    ? 'Firefox'
    : 'Other';
  return { device_type, browser };
}

// In-app page visit tracker for iRoxanne Studio with server-side IP-hash throttling
// and header-derived UA/referrer classification to prevent unauthenticated PageVisit flooding.
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const current_page = typeof body.current_page === 'string' ? body.current_page.trim().slice(0, 500) : '';
    if (!current_page || !current_page.startsWith('/')) {
      return Response.json({ ok: false, error: 'Valid current_page path required' }, { status: 400 });
    }

    const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.replace(/[\r\n<>]/g, '').trim().slice(0, max) : '');

    const nowMs = Date.now();
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    const ua = req.headers.get('user-agent') || '';
    const visitor_id = (await sha256(new Date(nowMs).toISOString().slice(0, 10) + ':' + ip + ':' + ua.slice(0, 120))).slice(0, 32);

    // Rate limit per visitor hash and globally using recent PageVisit records
    const recent = await base44.asServiceRole.entities.PageVisit.list('-created_date', 120).catch(() => []);
    const recentWindow = (recent || []).filter((r: any) => nowMs - Date.parse(r.timestamp || r.created_date || '') < 60_000);
    if (recentWindow.length >= 60) {
      return Response.json({ ok: true, throttled: true });
    }
    const visitorRecent = (recent || []).filter(
      (r: any) => r.visitor_id === visitor_id && nowMs - Date.parse(r.timestamp || r.created_date || '') < 600_000
    );
    if (visitorRecent.length >= 15 || visitorRecent.some((r: any) => r.current_page === current_page && nowMs - Date.parse(r.timestamp || r.created_date || '') < 30_000)) {
      return Response.json({ ok: true, throttled: true });
    }

    const headerRef = str(req.headers.get('referer') || body.referrer_url, 500);
    const utm_source = str(body.utm_source, 100);
    const utm_medium = str(body.utm_medium, 100);
    const utm_campaign = str(body.utm_campaign, 100);
    const classified = classifyRef(headerRef);
    const { device_type, browser } = detectUA(ua);

    await base44.asServiceRole.entities.PageVisit.create({
      landing_page: str(body.landing_page, 500) || current_page,
      current_page,
      referrer_url: headerRef,
      source: utm_source || classified.source,
      medium: utm_medium || classified.medium,
      campaign: utm_campaign,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content: str(body.utm_content, 100),
      utm_term: str(body.utm_term, 100),
      device_type,
      browser,
      timestamp: new Date(nowMs).toISOString(),
      visitor_id,
      session_id: str(body.session_id, 64) || visitor_id.slice(0, 16),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
});