import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { listAdAccounts, listCampaignsForAccount, listAdsForAccount } from '../../shared/metaAds.ts';

// Lists every campaign in a Meta ad account with its results. Admin only.
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
      return Response.json({ ok: true, connected: true, accounts, ad_account_id: '', campaigns: [] });
    }

    // Pull the ads too so each campaign can show the actual post's thumbnail and preview link.
    const [rawCampaigns, ads] = await Promise.all([
      listCampaignsForAccount(accessToken, selected, datePreset),
      listAdsForAccount(accessToken, selected, datePreset),
    ]);
    const campaigns = rawCampaigns.map((c) => {
      const ad = ads.find((a) => a.campaign_id === c.id) || {};
      return {
        ...c,
        thumbnail_url: ad.thumbnail_url || '',
        preview_url: ad.preview_url || '',
        ad_id: ad.id || '',
        ad_name: ad.name || '',
      };
    });
    return Response.json({ ok: true, connected: true, accounts, ad_account_id: selected, campaigns });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Could not load your campaigns.' }, { status: 500 });
  }
}