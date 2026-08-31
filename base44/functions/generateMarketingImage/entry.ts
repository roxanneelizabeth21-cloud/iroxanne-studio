import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { listShopifyProducts } from '../../shared/shopifyProduct.ts';

// Generates a real marketing image with Base44's built-in image integration,
// saves it into the existing GalleryImage library with its visual direction,
// and attaches it to the selected draft post's media reference.
// Never approves, schedules or publishes anything.

const ASPECT_BY_FORMAT = {
  'Reel': '9:16',
  'Story': '9:16',
  'Short': '9:16',
  'Video': '9:16',
  'Feed Post': '4:5',
  'Community Post': '1:1',
};

const ASPECT_GUIDE = {
  '9:16': 'Compose as a tall vertical 9:16 frame. Keep the subject and any text inside the central vertical band, with generous empty space in the top 15% and bottom 20% so platform interface overlays never cover important detail.',
  '4:5': 'Compose as a portrait 4:5 frame. Subject weighted slightly above centre, breathing room at the edges, nothing critical within the outer 8% margin.',
  '1:1': 'Compose as a balanced square 1:1 frame with the focal point centred and even margins on all sides.',
  '16:9': 'Compose as a wide horizontal 16:9 frame with the focal point off-centre and clear headroom.',
};

const ALLOWED_ASPECTS = ['4:5', '1:1', '9:16', '16:9'];

function line(label, value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) {
    const items = value.filter(Boolean);
    return items.length ? `${label}: ${items.join('; ')}\n` : '';
  }
  const s = String(value).trim();
  return s ? `${label}: ${s}\n` : '';
}

function buildPrompt(input) {
  const {
    prompt, visual_direction: vd = {}, aspect_ratio, platform, format,
    text_overlay, elements_to_preserve, elements_to_avoid, variation_instruction,
    context,
  } = input;

  let p = '';
  p += 'Create a single finished marketing image for a recording artist.\n\n';
  if (prompt) p += `CORE IMAGE BRIEF\n${prompt}\n\n`;

  p += 'VISUAL DIRECTION\n';
  p += line('Visual type', vd.visual_type);
  p += line('Creative concept', vd.creative_concept);
  p += line('Objective', vd.content_objective);
  p += line('Subject', vd.subject);
  p += line('Setting', vd.setting);
  p += line('Composition', vd.composition);
  p += line('Camera angle', vd.camera_angle);
  p += line('Framing', vd.framing);
  p += line('Lighting', vd.lighting);
  p += line('Mood', vd.mood);
  p += line('Colour direction', vd.color_direction);
  p += line('Materials', vd.materials);
  p += line('Textures', vd.textures);
  p += line('Sense of movement', vd.movement);
  p += line('Typography direction', vd.typography_direction);
  p += line('Safe area requirements', vd.safe_area_requirements);
  p += '\n';

  if (context && Object.keys(context).length) {
    p += 'CONTENT CONTEXT (guides the visual — do not render this text into the image)\n';
    p += line('Project', context.project_title);
    p += line('Category', context.category);
    p += line('Service / style', context.genre);
    p += line('Tech used', context.tech_used);
    p += line('Project description', context.project_description);
    p += line('Tagline', context.tagline);
    p += line('Campaign', context.campaign_name);
    p += line('Campaign goal', context.campaign_goal);
    p += line('Post hook', context.hook);
    p += line('Post caption', context.caption);
    p += line('Call to action', context.cta);
    p += line('Audience', context.audience);
    p += line('Brand image rules', context.image_style_notes);
    p += '\n';
  }

  const ar = aspect_ratio && ALLOWED_ASPECTS.includes(aspect_ratio) ? aspect_ratio : (ASPECT_BY_FORMAT[format] || '4:5');
  p += 'PLATFORM AND FRAMING\n';
  p += line('Platform', platform);
  p += line('Format', format);
  p += `Aspect ratio: ${ar}\n${ASPECT_GUIDE[ar]}\n\n`;

  const overlay = text_overlay ?? vd.text_overlay;
  p += 'TEXT IN IMAGE\n';
  if (overlay && String(overlay).trim()) {
    p += `Render exactly this text, spelling, punctuation and capitalisation, and nothing else: "${String(overlay).trim()}". Keep it large, cleanly kerned and fully legible. Do not add any other words, dates, prices, URLs, handles, hashtags, watermarks or logos.\n\n`;
  } else {
    p += 'No text of any kind in the image. No words, letters, numbers, captions, watermarks, signatures or logos.\n\n';
  }

  const preserve = elements_to_preserve ?? vd.elements_to_preserve;
  const avoid = elements_to_avoid ?? vd.elements_to_avoid;
  if (preserve) p += line('MUST PRESERVE', preserve) + '\n';
  p += line('MUST AVOID', avoid);
  p += 'Avoid generic stock-inspirational clichés unless the direction above explicitly calls for them: lone back-facing silhouettes, glowing crosses, open Bibles, praying hands, sunrise-over-clouds, empty roads and windswept fields. Avoid distorted anatomy, extra limbs, garbled lettering and fake brand marks.\n';
  if (variation_instruction) p += `\nREVISION FOR THIS VERSION\nKeep everything above intact and change only this: ${variation_instruction}\n`;

  return { finalPrompt: p.trim(), aspect: ar };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const {
      post_id, campaign_id, release_id, track_id, product_id, shopify_product_id, portfolio_item_id,
      visual_direction = {}, prompt, platform, format, aspect_ratio,
      text_overlay, reference_asset_urls, elements_to_preserve, elements_to_avoid,
      regenerate = false, variation_instruction, original_request,
    } = body;

    if (!prompt && !visual_direction.creative_concept) {
      return Response.json({ ok: false, error: 'A prompt or a visual_direction.creative_concept is required.' }, { status: 400 });
    }
    if (aspect_ratio && !ALLOWED_ASPECTS.includes(aspect_ratio)) {
      return Response.json({ ok: false, error: `aspect_ratio must be one of ${ALLOWED_ASPECTS.join(', ')}` }, { status: 400 });
    }

    // --- Gather the real records so the prompt is grounded in actual content ---
    let post = null;
    if (post_id) {
      post = await base44.entities.MarketingPost.get(post_id).catch(() => null);
      if (!post) return Response.json({ ok: false, error: 'Post not found.' }, { status: 404 });
    }

    const effPlatform = platform || post?.platform || '';
    const effFormat = format || post?.format || '';
    const effCampaignId = campaign_id || post?.campaign_id || '';
    const effPortfolioItemId = portfolio_item_id || post?.portfolio_item_id || '';

    const campaign = effCampaignId ? await base44.entities.Campaign.get(effCampaignId).catch(() => null) : null;
    const portfolioItem = effPortfolioItemId ? await base44.entities.PortfolioItem.get(effPortfolioItemId).catch(() => null) : null;
    const product = product_id ? await base44.entities.MerchProduct.get(product_id).catch(() => null) : null;

    const brand = (await base44.entities.BrandProfile.list().catch(() => []))?.[0] || null;

    const context = {
      project_title: portfolioItem?.title || product?.name,
      category: portfolioItem?.category,
      genre: brand?.genre_blend,
      tech_used: portfolioItem?.tech_used,
      project_description: portfolioItem?.description,
      tagline: portfolioItem?.tagline,
      campaign_name: campaign?.name,
      campaign_goal: campaign?.goal,
      hook: post?.hook,
      caption: post?.caption,
      cta: post?.cta,
      audience: brand?.audience_description,
      image_style_notes: brand?.image_style_notes,
    };

    // When a merch product is the subject, its real product image is ALWAYS used as a
    // visual reference so the printed design stays identical across every piece of a series.
    let productImage = '';
    let productName = product?.name || '';
    const effShopifyId = shopify_product_id || product?.shopify_product_id || '';
    if (effShopifyId) {
      const live = (await listShopifyProducts().catch(() => []))
        .find((p) => p.shopify_product_id === String(effShopifyId).trim());
      if (live) {
        productImage = live.image_url;
        productName = productName || live.title;
      }
    }
    if (!productImage && product?.image_url && /^https?:\/\//.test(product.image_url)) {
      productImage = product.image_url;
    }
    const productPreserve = productImage
      ? `The attached reference image is the real ${productName} product photo. Reproduce the printed artwork on the garment exactly as shown — identical wording, spelling, lettering shapes, layout, proportions and colours. Do not redraw, restyle, translate, re-letter, crop or add to the design. Everything else in the frame (model, pose, setting, lighting) is yours to compose.`
      : '';

    const { finalPrompt, aspect } = buildPrompt({
      prompt: prompt || post?.image_prompt,
      visual_direction, aspect_ratio, platform: effPlatform, format: effFormat,
      text_overlay,
      elements_to_preserve: [productPreserve, elements_to_preserve ?? visual_direction.elements_to_preserve]
        .flat().filter(Boolean),
      elements_to_avoid,
      variation_instruction: regenerate ? variation_instruction : undefined,
      context,
    });

    // --- Generate the actual image ---
    const passedRefs = Array.isArray(reference_asset_urls) ? reference_asset_urls.filter(Boolean) : [];
    // Product photo goes first so it dominates as the design reference.
    const refs = [...new Set([productImage, ...passedRefs].filter(Boolean))];
    const gen = await base44.integrations.Core.GenerateImage(
      refs.length ? { prompt: finalPrompt, existing_image_urls: refs } : { prompt: finalPrompt }
    );
    const image_url = gen?.url || gen?.data?.url;
    if (!image_url || typeof image_url !== 'string' || !/^https?:\/\//.test(image_url)) {
      return Response.json({ ok: false, error: 'Image generation did not return a usable image. Nothing was saved or attached.' }, { status: 502 });
    }

    // --- Preserve the previous version, if any ---
    let previous_version_id = '';
    let previous_image_url = '';
    if (post) {
      previous_image_url = post.media_file_url || '';
      if (previous_image_url) {
        const prior = await base44.entities.GalleryImage.filter({ post_id: post.id, image_url: previous_image_url }).catch(() => []);
        previous_version_id = prior?.[0]?.id || '';
      }
    }

    // --- Save into the existing Gallery library ---
    const media = await base44.entities.GalleryImage.create({
      title: `${context.project_title || 'iRoxanne Studio'} — ${visual_direction.visual_type || 'marketing image'}${aspect ? ` (${aspect})` : ''}`,
      image_url,
      category: 'promo',
      source: 'ai_generated',
      generation_prompt: finalPrompt,
      original_request: original_request || '',
      visual_direction: { ...visual_direction, aspect_ratio: aspect, platform: effPlatform, format: effFormat },
      platform: effPlatform,
      format: effFormat,
      aspect_ratio: aspect,
      post_id: post?.id || '',
      campaign_id: effCampaignId,
      release_id: '',
      track_id: '',
      product_id: product_id || '',
      generation_status: 'generated',
      generated_at: new Date().toISOString(),
      variation_instruction: regenerate ? (variation_instruction || '') : '',
      previous_version_id,
      description: visual_direction.reason_for_match || '',
    });

    // --- Attach to the draft post without touching its approval/publish state ---
    let attached = false;
    if (post) {
      const keepStatus = post.status === 'Posted' ? post.status : (post.status || 'Draft');
      await base44.entities.MarketingPost.update(post.id, {
        media_file_url: image_url,
        media_clip_id: '',
        status: keepStatus === 'Ready' ? 'Pending Review' : keepStatus,
      });
      attached = true;
    }

    return Response.json({
      ok: true,
      media_id: media.id,
      image_url,
      post_id: post?.id || null,
      campaign_id: effCampaignId || null,
      visual_direction: { ...visual_direction, aspect_ratio: aspect },
      format: effFormat || null,
      aspect_ratio: aspect,
      previous_image_url: previous_image_url || null,
      previous_version_id: previous_version_id || null,
      status: 'generated',
      message: attached
        ? 'Image generated, saved to the Gallery and attached to the post. The post still needs your approval.'
        : 'Image generated and saved to the Gallery. No post was attached.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Image generation failed.' }, { status: 500 });
  }
}