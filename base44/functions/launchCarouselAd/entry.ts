import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { createCarouselAd } from '../../shared/metaAds.ts';
import { getStoredPageConnection } from '../../shared/facebookPages.ts';

// Creates a paid carousel ad in Meta Ads from a track highlight, and records it
// as a CarouselAd. Created PAUSED unless the admin explicitly asks to activate,
// so nothing spends without a deliberate choice. Admin only.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const {
      name, portfolio_item_id, project_title, ad_account_id, page_id,
      primary_text, destination_url, cta_type, daily_budget_usd,
      countries, age_min, age_max, slides, activate = false,
    } = body;

    const cards = Array.isArray(slides) ? slides.filter((s) => s && s.image_url) : [];
    if (!name) return Response.json({ ok: false, error: 'Give the ad a name.' }, { status: 400 });
    if (!ad_account_id) return Response.json({ ok: false, error: 'Choose an ad account.' }, { status: 400 });
    if (cards.length < 2) return Response.json({ ok: false, error: 'A carousel needs at least 2 slides.' }, { status: 400 });
    if (cards.length > 10) return Response.json({ ok: false, error: 'A carousel can hold at most 10 slides.' }, { status: 400 });
    if (!destination_url) return Response.json({ ok: false, error: 'Add the link the slides should open.' }, { status: 400 });
    if (!(Number(daily_budget_usd) > 0)) return Response.json({ ok: false, error: 'Set a daily budget above 0.' }, { status: 400 });

    const stored = await getStoredPageConnection(base44);
    const pageId = page_id || stored?.page_id;
    if (!pageId) return Response.json({ ok: false, error: 'No Facebook Page is connected for the ad to run from.' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('meta_ads');
    if (!accessToken) return Response.json({ ok: false, error: 'Meta Ads is not connected.' }, { status: 400 });

    const record = {
      name,
      portfolio_item_id: portfolio_item_id || '',
      project_title: project_title || '',
      ad_account_id: String(ad_account_id).replace(/^act_/, ''),
      page_id: pageId,
      primary_text: primary_text || '',
      destination_url,
      cta_type: cta_type || 'LISTEN_NOW',
      daily_budget_usd: Number(daily_budget_usd),
      countries: Array.isArray(countries) && countries.length ? countries : ['US'],
      age_min: Number(age_min) || 18,
      age_max: Number(age_max) || 65,
      slides: cards.map((s) => ({
        image_url: s.image_url,
        headline: s.headline || '',
        description: s.description || '',
        source: s.source || 'library',
      })),
    };

    let result;
    try {
      result = await createCarouselAd(accessToken, {
        adAccountId: record.ad_account_id,
        pageId,
        name,
        primaryText: record.primary_text,
        destinationUrl: destination_url,
        ctaType: record.cta_type,
        dailyBudgetUsd: record.daily_budget_usd,
        countries: record.countries,
        ageMin: record.age_min,
        ageMax: record.age_max,
        slides: record.slides,
        activate: !!activate,
      });
    } catch (metaError) {
      await base44.entities.CarouselAd.create({
        ...record,
        delivery_status: 'Failed',
        launch_error: metaError.message,
      });
      return Response.json({ ok: false, error: metaError.message }, { status: 502 });
    }

    const saved = await base44.entities.CarouselAd.create({
      ...record,
      campaign_id: result.campaignId,
      adset_id: result.adsetId,
      creative_id: result.creativeId,
      ad_id: result.adId,
      delivery_status: result.status === 'ACTIVE' ? 'Active' : 'Paused',
      launched_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      id: saved.id,
      ad_id: result.adId,
      delivery_status: saved.delivery_status,
      message: result.status === 'ACTIVE'
        ? 'Carousel ad created and set live in Meta.'
        : 'Carousel ad created in Meta, paused. Review it in Ads Manager, then set it live.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Launching the carousel ad failed.' }, { status: 500 });
  }
}