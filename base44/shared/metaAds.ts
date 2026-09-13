// Meta Ads (Graph API v25.0) helpers for paid carousel ads.
// Never log or return an access token from here.

const GRAPH = 'https://graph.facebook.com/v25.0';

async function graphRequest(path, accessToken, method, params) {
  const url = `${GRAPH}/${path}`;
  const form = new URLSearchParams();
  form.set('access_token', accessToken);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    form.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  });
  const res = method === 'GET'
    ? await fetch(`${url}?${form.toString()}`)
    : await fetch(url, { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (body?.error) {
    const e = body.error;
    throw new Error(e.error_user_msg || e.message || 'Meta rejected the request.');
  }
  if (!res.ok) throw new Error(`Meta returned status ${res.status}.`);
  return body;
}

export const graphGet = (path, token, params) => graphRequest(path, token, 'GET', params);
export const graphPost = (path, token, params) => graphRequest(path, token, 'POST', params);

// Only these Meta ad accounts belong to the studio; anything else on the
// connected profile (e.g. EF Financials) is never offered anywhere in the app.
const ALLOWED_ACCOUNT_IDS = ['544520262606180', '3518775091612869'];

// Ad accounts the connected profile can advertise on.
export async function listAdAccounts(accessToken) {
  const body = await graphGet('me/adaccounts', accessToken, {
    fields: 'account_id,name,account_status,currency',
    limit: 100,
  });
  return (body.data || [])
    .filter((a) => ALLOWED_ACCOUNT_IDS.includes(String(a.account_id)))
    .map((a) => ({
      account_id: a.account_id,
      name: a.name,
      currency: a.currency,
      active: a.account_status === 1,
    }));
}

// Every ad in one ad account, with its campaign, status and lifetime spend/results.
export async function listAdsForAccount(accessToken, adAccountId, datePreset) {
  const actId = `act_${String(adAccountId).replace(/^act_/, '')}`;
  const body = await graphGet(`${actId}/ads`, accessToken, {
    fields: [
      'id,name,status,effective_status,created_time,preview_shareable_link',
      'campaign{id,name,objective}',
      'adset{id,name,daily_budget}',
      'creative{thumbnail_url,object_story_spec}',
      `insights.date_preset(${datePreset || 'maximum'}){spend,impressions,clicks,ctr,reach}`,
    ].join(','),
    limit: 100,
  });
  return (body.data || []).map((ad) => {
    const ins = ad.insights?.data?.[0] || {};
    return {
      id: ad.id,
      name: ad.name,
      status: ad.effective_status || ad.status,
      created_time: ad.created_time,
      preview_url: ad.preview_shareable_link || '',
      thumbnail_url: ad.creative?.thumbnail_url || '',
      campaign_id: ad.campaign?.id || '',
      campaign_name: ad.campaign?.name || '',
      objective: ad.campaign?.objective || '',
      adset_name: ad.adset?.name || '',
      daily_budget_usd: ad.adset?.daily_budget ? Number(ad.adset.daily_budget) / 100 : null,
      spend: Number(ins.spend || 0),
      impressions: Number(ins.impressions || 0),
      clicks: Number(ins.clicks || 0),
      reach: Number(ins.reach || 0),
      ctr: Number(ins.ctr || 0),
    };
  });
}

// Every campaign in one ad account, with its status, budget and results.
export async function listCampaignsForAccount(accessToken, adAccountId, datePreset) {
  const actId = `act_${String(adAccountId).replace(/^act_/, '')}`;
  const body = await graphGet(`${actId}/campaigns`, accessToken, {
    fields: [
      'id,name,objective,status,effective_status,created_time,start_time,stop_time',
      'daily_budget,lifetime_budget',
      `insights.date_preset(${datePreset || 'maximum'}){spend,impressions,clicks,ctr,reach,cpc}`,
    ].join(','),
    limit: 100,
  });
  return (body.data || []).map((c) => {
    const ins = c.insights?.data?.[0] || {};
    return {
      id: c.id,
      name: c.name,
      objective: c.objective || '',
      status: c.status,
      effective_status: c.effective_status || c.status,
      created_time: c.created_time,
      daily_budget_usd: c.daily_budget ? Number(c.daily_budget) / 100 : null,
      lifetime_budget_usd: c.lifetime_budget ? Number(c.lifetime_budget) / 100 : null,
      spend: Number(ins.spend || 0),
      impressions: Number(ins.impressions || 0),
      clicks: Number(ins.clicks || 0),
      reach: Number(ins.reach || 0),
      ctr: Number(ins.ctr || 0),
      cpc: Number(ins.cpc || 0),
    };
  });
}

// Pauses or resumes any campaign, ad set or ad by its Meta id.
export async function setEntityStatus(accessToken, id, status) {
  await graphPost(String(id), accessToken, { status });
  return { id, status };
}

// Uploads one image into the ad account's image library and returns its hash.
export async function uploadAdImage(accessToken, actId, imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Could not download a slide image (status ${res.status}).`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  const body = await graphPost(`${actId}/adimages`, accessToken, { bytes: btoa(binary) });
  const images = body.images || {};
  const first = Object.values(images)[0];
  if (!first?.hash) throw new Error('Meta did not return an image hash for a slide.');
  return first.hash;
}

// Creates campaign -> ad set -> creative -> ad for a carousel, always PAUSED
// unless activate is explicitly true.
export async function createCarouselAd(accessToken, input) {
  const {
    adAccountId, pageId, instagramActorId, name, primaryText, destinationUrl, ctaType,
    dailyBudgetUsd, countries, ageMin, ageMax, slides, activate,
  } = input;
  const actId = `act_${String(adAccountId).replace(/^act_/, '')}`;
  const status = activate ? 'ACTIVE' : 'PAUSED';

  const campaign = await graphPost(`${actId}/campaigns`, accessToken, {
    name: `${name} — Campaign`,
    objective: 'OUTCOME_TRAFFIC',
    status,
    special_ad_categories: [],
  });

  const adset = await graphPost(`${actId}/adsets`, accessToken, {
    name: `${name} — Ad Set`,
    campaign_id: campaign.id,
    daily_budget: Math.round(Number(dailyBudgetUsd) * 100),
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'LINK_CLICKS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    destination_type: 'WEBSITE',
    targeting: {
      geo_locations: { countries: countries && countries.length ? countries : ['US'] },
      age_min: ageMin || 18,
      age_max: ageMax || 65,
    },
    status,
  });

  const childAttachments = [];
  for (const slide of slides) {
    const image_hash = await uploadAdImage(accessToken, actId, slide.image_url);
    childAttachments.push({
      link: slide.link || destinationUrl,
      image_hash,
      name: slide.headline || '',
      description: slide.description || '',
      call_to_action: { type: ctaType || 'LISTEN_NOW', value: { link: slide.link || destinationUrl } },
    });
  }

  const creative = await graphPost(`${actId}/adcreatives`, accessToken, {
    name: `${name} — Creative`,
    object_story_spec: {
      page_id: pageId,
      ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {}),
      link_data: {
        link: destinationUrl,
        message: primaryText || '',
        multi_share_optimized: true,
        multi_share_end_card: true,
        child_attachments: childAttachments,
      },
    },
    degrees_of_freedom_spec: { creative_features_spec: { standard_enhancements: { enroll_status: 'OPT_OUT' } } },
  });

  const ad = await graphPost(`${actId}/ads`, accessToken, {
    name,
    adset_id: adset.id,
    creative: { creative_id: creative.id },
    status,
  });

  return { campaignId: campaign.id, adsetId: adset.id, creativeId: creative.id, adId: ad.id, status };
}