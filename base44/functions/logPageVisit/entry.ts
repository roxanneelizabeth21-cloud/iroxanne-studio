import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

// Admin-authenticated page visit logger. Public visitor tracking uses Base44's
// built-in analytics SDK so anonymous callers cannot insert fake PageVisit rows.
export default async function (req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const current_page = typeof body.current_page === 'string' ? body.current_page.trim().slice(0, 500) : '';
    if (!current_page || !current_page.startsWith('/')) {
      return Response.json({ ok: false, error: 'Valid page path required' }, { status: 400 });
    }

    const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.replace(/[\r\n<>]/g, '').trim().slice(0, max) : '');
    const ua = req.headers.get('user-agent') || '';
    const headerRef = str(req.headers.get('referer') || body.referrer_url, 500);
    const utm_source = str(body.utm_source, 100);
    const utm_medium = str(body.utm_medium, 100);
    const utm_campaign = str(body.utm_campaign, 100);
    const classified = classifyRef(headerRef);
    const { device_type, browser } = detectUA(ua);

    await base44.entities.PageVisit.create({
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
      timestamp: new Date().toISOString(),
      visitor_id: str(body.visitor_id, 64),
      session_id: str(body.session_id, 64),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}