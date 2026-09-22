import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

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
  '4:5': 'Compose as a portrait 4:5 frame. Give the subject real presence, roughly 50 to 65 percent of the area, with margins as deliberate breathing space rather than dead space. Where a supplied app screenshot is used, it is quiet evidence and must stay small and off-centre, never the dominant element. Keep nothing critical within the outer 8 percent.',
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
  p += 'Create a single finished marketing image for the studio.\n\n';
  if (prompt) p += `CORE IMAGE BRIEF\n${prompt}\n\n`;

  p += 'Brand direction: iRoxanne Studio (exact spelling). Create an arresting story-led editorial composition with a strong focal subject, contrast and intentional scale. Plum, cream and gold are accents, not mandatory full-frame backgrounds. Bright natural environments and vivid subject colors are welcome. Avoid repeating the same purple-and-gold illustration. A viewer should understand the possibility shown without reading a caption. No generic laptops, neon technology, fake app UI or invented brand marks. Older technical context must not override this direction.\n';
  // The studio sells app building, not the apps in the picture. A graphic with
  // no words reads as an advert for the client's app instead of for Roxanne.
  p += 'WHAT THIS IMAGE IS SELLING\niRoxanne Studio sells a place to begin. Its customer is someone with a half-formed idea who does not feel ready and may have no business, no plan and no name for the thing. The barrier being removed is that feeling, not cost.\nSo the subject of the image is the beginning, not the finished product: a notebook, a half-thought, a person who has not started, an ordinary moment before anything exists. Do not build the image around a polished app screen. A finished app shows an ending and sets a bar, when the point is to lower one. Where a real app screen is supplied, use it small and off-centre as quiet evidence, never as the hero of the frame.\nNever sell capability or expertise. Words like "I build custom apps" are a competence claim and are wrong for this brand. The tone is first person, warm and quiet, the way one person speaks to another. If text appears, it should invite rather than declare. Set the words iRoxanne Studio small and legible in a corner as a signature, spelled exactly: lowercase i, capital R, capital S, final e.\n';
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
    p += line('Service', context.service);
    // Technology is not the marketing subject.
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
  p += 'Avoid generic stock-inspirational clichés unless the direction above explicitly calls for them: lone back-facing silhouettes, empty roads and windswept fields, generic flat-lay mockups. Avoid distorted anatomy, extra limbs, garbled lettering and fake brand marks.\n';
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
      post_id, campaign_id, portfolio_item_id,
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
      if (['Posted','Partially Published','Publishing'].includes(post.status) || post.publishing_status === 'Publishing') return Response.json({ok:false,error:'Create a new draft to revise a published or publishing post.'},{status:409});
    }

    const effPlatform = platform || post?.platform || '';
    const effFormat = format || post?.format || '';
    const effCampaignId = campaign_id || post?.campaign_id || '';
    const effPortfolioItemId = portfolio_item_id || post?.portfolio_item_id || '';

    const campaign = effCampaignId ? await base44.entities.Campaign.get(effCampaignId).catch(() => null) : null;
    const portfolioItem = effPortfolioItemId ? await base44.entities.PortfolioItem.get(effPortfolioItemId).catch(() => null) : null;

    const brand = (await base44.entities.BrandProfile.list().catch(() => []))?.[0] || null;

    const context = {
      project_title: portfolioItem?.title,
      category: portfolioItem?.category,
      service: brand?.service_description,
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

    const { finalPrompt, aspect } = buildPrompt({
      prompt: prompt || post?.image_prompt,
      visual_direction, aspect_ratio, platform: effPlatform, format: effFormat,
      text_overlay,
      elements_to_preserve: elements_to_preserve ?? visual_direction.elements_to_preserve,
      elements_to_avoid,
      variation_instruction: regenerate ? variation_instruction : undefined,
      context,
    });

    // Plan alternatives against recent work before spending an image generation.
    const recent = await base44.entities.GalleryImage.list('-created_date', 8).catch(() => []);
    const creative = await base44.integrations.Core.InvokeLLM({
      prompt: 'Act as an editorial art director for iRoxanne Studio. Develop three materially different visual treatments of the supplied brief, then choose the strongest. Respect the requested subject, exact approved text and references; do not change requested content. Different means different compositions and visual storytelling, not three color variations. Each needs a specific focal subject, contrast, readable hierarchy and a reason a nontechnical person would care. No generic technology devices, filler decor or compulsory purple backdrop. Do not fabricate actual app screens, people, testimonials or results. Previous directions to avoid repeating: ' + JSON.stringify(recent.map(x => x.visual_direction?.creative_concept || x.description || x.title)) + '\nBRIEF: ' + finalPrompt,
      response_json_schema: {type:'object',properties:{
        concepts:{type:'array',minItems:3,maxItems:3,items:{type:'object',properties:{treatment:{type:'string'},reason:{type:'string'}},required:['treatment','reason']}},
        selected:{type:'integer',minimum:0,maximum:2}
      },required:['concepts','selected']}
    });
    const chosen = creative?.concepts?.[creative.selected];
    if (!chosen?.treatment) throw new Error('Creative planning did not return a usable concept. Your current image was preserved.');
    const renderPrompt = finalPrompt + '\nSELECTED ART DIRECTION (subject to the exact content and spelling requirements above):\n' + chosen.treatment;

    // --- Generate the actual image ---
    const passedRefs = Array.isArray(reference_asset_urls) ? reference_asset_urls.filter(Boolean) : [];
    const refs = [...new Set(passedRefs.filter(Boolean))];
    const gen = await base44.integrations.Core.GenerateImage(
      refs.length ? { prompt: renderPrompt, existing_image_urls: refs } : { prompt: renderPrompt }
    );
    const image_url = gen?.url || gen?.data?.url;
    if (!image_url || typeof image_url !== 'string' || !/^https?:\/\//.test(image_url)) {
      return Response.json({ ok: false, error: 'Image generation did not return a usable image. Nothing was saved or attached.' }, { status: 502 });
    }

    // Inspect the actual generated pixels before replacing the owner's asset.
    const review = await base44.integrations.Core.InvokeLLM({
      prompt: 'Inspect the attached finished marketing image against this brief. This is marketing for iRoxanne Studio, which builds custom apps and websites; any app shown is evidence of that work.\n\nFail it only for a real defect: lettering that is actually unreadable or misspelled, malformed anatomy, fabricated app UI presented as real, or a composition with no clear focal point. If the business name appears it must read exactly iRoxanne Studio; reject iRoxan, Roxanne Studios, Roxsan or other variants.\n\nDo NOT fail an image merely for containing text, for imperfect kerning or spacing, or for a minor flaw that does not stop a viewer reading it. Legible text carrying the studio name or a headline is wanted, not a defect. If you cannot inspect the image, fail. Return pass and reason. Brief: ' + finalPrompt,
      file_urls: [image_url],
      response_json_schema: { type:'object', properties:{pass:{type:'boolean'},reason:{type:'string'}}, required:['pass','reason'] }
    });
    if (review?.pass !== true) return Response.json({
      ok:false, error:'Graphic did not pass visual review: ' + (review?.reason || 'Review unavailable'),
      rejected_image_url:image_url, previous_image_preserved:true
    }, {status:422});

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
      source: 'upload',
      generation_prompt: renderPrompt,
      original_request: original_request || '',
      visual_direction: { ...visual_direction, aspect_ratio: aspect, platform: effPlatform, format: effFormat },
      platform: effPlatform,
      format: effFormat,
      aspect_ratio: aspect,
      post_id: post?.id || '',
      campaign_id: effCampaignId,
      portfolio_item_id: effPortfolioItemId,
      generation_status: 'generated',
      generated_at: new Date().toISOString(),
      variation_instruction: regenerate ? (variation_instruction || '') : '',
      previous_version_id,
      description: visual_direction.reason_for_match || '',
    });

    // --- Attach to the draft post without touching its approval/publish state ---
    let attached = false;
    if (post) {

      await base44.entities.MarketingPost.update(post.id, {
        media_file_url: image_url,
        media_clip_id: '',
        status: 'Pending Review', approval_status: 'Pending Review', publish_mode: 'manual', media_type: 'image',
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
      creative_concepts: creative.concepts,
      selected_concept: chosen,
      message: attached
        ? 'Image generated, saved to the Gallery and attached to the post. The post still needs your approval.'
        : 'Image generated and saved to the Gallery. No post was attached.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Image generation failed.' }, { status: 500 });
  }
}