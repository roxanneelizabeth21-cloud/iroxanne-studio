import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { listAdAccounts } from '../../shared/metaAds.ts';
import { getStoredPageConnection } from '../../shared/facebookPages.ts';

// Lists the Meta ad accounts available for paid carousel ads, plus the Facebook
// Page the ad would run from. Admin only.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('meta_ads');
    if (!accessToken) {
      return Response.json({ ok: false, connected: false, error: 'Meta Ads is not connected.' });
    }

    const all = await listAdAccounts(accessToken);
    // EF Financials is a closed business — never offer it as an ad account.
    const accounts = all.filter((a) => !/ef\s*financials/i.test(a?.name || ''));
    const stored = await getStoredPageConnection(base44);

    return Response.json({
      ok: true,
      connected: true,
      accounts,
      page: stored?.page_id ? { id: stored.page_id, name: stored.page_name || '' } : null,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Could not load your ad accounts.' }, { status: 500 });
  }
}