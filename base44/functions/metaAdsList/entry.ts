import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { listAdAccounts, listAdsForAccount } from '../../shared/metaAds.ts';

// Lists every ad in a Meta ad account with its status and results. Admin only.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const { ad_account_id: adAccountId, date_preset: datePreset } = await req.json().catch(() => ({}));

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('meta_ads');
    if (!accessToken) {
      return Response.json({ ok: false, connected: false, error: 'Meta Ads is not connected.' });
    }

    const accounts = await listAdAccounts(accessToken);
    const selected = adAccountId || accounts[0]?.account_id || '';
    if (!selected) {
      return Response.json({ ok: true, connected: true, accounts, ad_account_id: '', ads: [] });
    }

    const ads = await listAdsForAccount(accessToken, selected, datePreset);
    return Response.json({ ok: true, connected: true, accounts, ad_account_id: selected, ads });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Could not load your ads.' }, { status: 500 });
  }
}