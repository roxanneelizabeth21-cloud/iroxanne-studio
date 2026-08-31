import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { setEntityStatus } from '../../shared/metaAds.ts';

// Pauses or resumes a Meta campaign, ad set or ad. Admin only.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const { id, status } = await req.json().catch(() => ({}));
    if (!id) return Response.json({ ok: false, error: 'Missing id.' }, { status: 400 });
    if (status !== 'ACTIVE' && status !== 'PAUSED') {
      return Response.json({ ok: false, error: 'Status must be ACTIVE or PAUSED.' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('meta_ads');
    if (!accessToken) return Response.json({ ok: false, error: 'Meta Ads is not connected.' });

    await setEntityStatus(accessToken, id, status);
    return Response.json({ ok: true, id, status });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Meta would not change that status.' }, { status: 500 });
  }
}