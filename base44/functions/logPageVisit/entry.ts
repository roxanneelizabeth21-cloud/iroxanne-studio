import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// In-app page visit tracker for iRoxanne Studio.
// Public endpoint (no auth required) so anonymous visitors are logged.
// Creates a PageVisit record using the service role.
// Stores UTM parameters, classified source/medium/campaign, device/browser, and session attribution.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const current_page = typeof body.current_page === 'string' ? body.current_page.slice(0, 500) : '';
    if (!current_page) {
      return Response.json({ ok: false, error: 'current_page required' }, { status: 400 });
    }

    const str = (v, max = 1000) => typeof v === 'string' ? v.slice(0, max) : '';

    await base44.asServiceRole.entities.PageVisit.create({
      landing_page: str(body.landing_page, 500),
      current_page,
      referrer_url: str(body.referrer_url, 1000),
      source: str(body.source, 200),
      medium: str(body.medium, 200),
      campaign: str(body.campaign, 200),
      utm_source: str(body.utm_source, 200),
      utm_medium: str(body.utm_medium, 200),
      utm_campaign: str(body.utm_campaign, 200),
      utm_content: str(body.utm_content, 200),
      utm_term: str(body.utm_term, 200),
      device_type: str(body.device_type, 50),
      browser: str(body.browser, 50),
      timestamp: new Date().toISOString(),
      visitor_id: str(body.visitor_id, 100),
      session_id: str(body.session_id, 100),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});