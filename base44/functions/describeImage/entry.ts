import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Lets Sam (the AI agent) "see" an image from the library or elsewhere.
// Sam is a text-based LLM — she can read GalleryImage records (title, URL,
// metadata) but cannot visually inspect image content. This function takes an
// image URL, passes it to a vision-capable LLM, and returns a plain-text
// description of what the image actually shows. Sam uses it to verify
// generated graphics, pick the right asset from the library, and describe
// images to Roxanne accurately.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { image_url, question } = body || {};

    if (!image_url || typeof image_url !== 'string' || !/^https?:\/\//.test(image_url)) {
      return Response.json({ ok: false, error: 'A valid image_url (https URL) is required.' }, { status: 400 });
    }

    const focus = question?.trim()
      ? ` Focus specifically on this question: ${question.trim()}`
      : '';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a visual analyst for iRoxanne Studio. Describe what you see in this image in clear, specific detail so a colleague who cannot see it can understand exactly what it contains. Cover: the main subject, composition, colors, any text visible in the image (quote it exactly including spelling), the mood, and whether it looks like a finished marketing graphic or a raw photo/screenshot. If the image contains the business name, confirm whether it reads exactly 'iRoxanne Studio' (lowercase i, capital R, capital S).${focus}`,
      file_urls: [image_url],
      response_json_schema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Detailed visual description of the image' },
          text_found: { type: 'string', description: 'Any text visible in the image, quoted exactly' },
          is_marketing_graphic: { type: 'boolean', description: 'Whether this looks like a finished marketing graphic vs a raw photo' },
          brand_name_correct: { type: 'boolean', description: 'Whether the business name reads exactly iRoxanne Studio, if present' },
        },
        required: ['description'],
      },
    });

    return Response.json({
      ok: true,
      image_url,
      description: result?.description || '',
      text_found: result?.text_found || '',
      is_marketing_graphic: result?.is_marketing_graphic ?? null,
      brand_name_correct: result?.brand_name_correct ?? null,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Could not analyze the image.' }, { status: 500 });
  }
}