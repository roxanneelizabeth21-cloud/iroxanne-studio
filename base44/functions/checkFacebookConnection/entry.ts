import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { diagnoseFacebook } from '../../shared/facebookPages.ts';

// Admin-only: reports whether Facebook publishing is genuinely usable.
// A finished OAuth flow is not enough — the Page must be returned by
// /me/accounts with a content-creation task. No token is ever returned.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let accessToken = '';
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('facebook_pages');
      accessToken = conn?.accessToken || '';
    } catch (e) {
      console.warn('Facebook connection lookup failed:', e.message);
    }

    const result = await diagnoseFacebook(accessToken, base44);
    console.log('Facebook diagnosis:', JSON.stringify({ reason: result.reason, graph_status: result.graph_status, pages: result.pages?.length ?? 0 }));
    return Response.json(result);
  } catch (error) {
    return Response.json({ ok: false, reason: 'error', message: error.message }, { status: 500 });
  }
}