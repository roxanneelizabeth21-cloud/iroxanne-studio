import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requireAdmin } from '../../shared/marketingAdmin.ts';

const DIRECTION_SCHEMA = {
  type: 'object',
  properties: {
    creative_concept: { type: 'string' },
    mood: { type: 'string' },
    subject: { type: 'string' },
    setting: { type: 'string' },
    composition: { type: 'string' },
    lighting: { type: 'string' },
    color_direction: { type: 'string' },
    text_overlay: { type: 'string' },
    reason_for_match: { type: 'string' },
  },
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').trim();

    if (action === 'transcribe_voice_note') {
      const audio_url = String(body.audio_url || '').trim();
      if (!audio_url || !/^https?:\/\//.test(audio_url)) {
        return Response.json({ error: 'A valid audio_url is required.' }, { status: 400 });
      }
      const text = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url });
      return Response.json({ text: typeof text === 'string' ? text.trim() : '' });
    }

    if (action === 'generate_narration') {
      const text = String(body.text || '').replace(/\s+/g, ' ').trim().slice(0, 5000);
      if (!text) {
        return Response.json({ error: 'Narration text is required.' }, { status: 400 });
      }
      const res = await base44.asServiceRole.integrations.Core.GenerateSpeech({
        text,
        voice: 'honey',
      });
      const url = res?.url || res?.data?.url || '';
      if (!url) {
        return Response.json({ error: 'Speech generation did not return an audio URL.' }, { status: 502 });
      }
      return Response.json({ url });
    }

    if (action === 'write_story_beats') {
      const caption = String(body.caption || '').slice(0, 4000);
      const hook = String(body.hook || '').slice(0, 500);
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:
          'Write exactly three short on-screen beats for a 12-second iRoxanne Studio motion graphic based ONLY on this post. Each maximum 65 characters. First a specific hook, then a concrete possibility, then a warm invitation. No generic motivational slogans, fabricated claims or metrics. Exact brand spelling iRoxanne Studio. Caption: ' +
          caption +
          ' Hook: ' +
          hook,
        response_json_schema: {
          type: 'object',
          properties: {
            lines: {
              type: 'array',
              minItems: 3,
              maxItems: 3,
              items: { type: 'string', maxLength: 65 },
            },
          },
          required: ['lines'],
        },
      });
      return Response.json({ lines: Array.isArray(result?.lines) ? result.lines : [] });
    }

    if (action === 'suggest_visual_direction') {
      const projectContext = body.project_context || {};
      const goal = String(body.goal || '').slice(0, 500);
      const instruction = String(body.instruction || 'none').slice(0, 1000);
      const aspect = String(body.aspect || '4:5').slice(0, 20);
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an art director for the app-development studio iRoxanne Studio. Propose ONE visual direction for a single social image.

Project: ${projectContext.title || 'untitled'}
Project type: ${projectContext.releaseType || ''}
Project status: ${projectContext.status || ''}
Themes: ${projectContext.themes || ''}
Story: ${projectContext.story || ''}
Key details / highlights: ${projectContext.keyLines || ''}
Project category / identity: ${projectContext.genre || ''}
Campaign: ${projectContext.campaignName || ''} ${projectContext.campaignGoal || ''}
Post goal: ${goal}
Owner instruction: ${instruction}
Aspect ratio: ${aspect}
Brand image rules: ${projectContext.imageStyleNotes || ''}

Vary the aesthetic to suit THIS project specifically. Avoid repeating generic stock clichés (generic mockups, flat backgrounds, empty screenshots) unless the project truly calls for it. Never invent quotes or metrics: only use the real details above, and only if a text overlay genuinely helps.
Return concise plain-language values for: creative_concept, mood, subject, setting, composition, lighting, color_direction, text_overlay (empty string when the image should be text-free), reason_for_match.`,
        response_json_schema: DIRECTION_SCHEMA,
      });
      return Response.json({ direction: res && typeof res === 'object' ? res : null });
    }

    if (action === 'tweak_post_caption') {
      const projectTitle = String(body.project_title || 'iRoxanne Studio').slice(0, 200);
      const instruction = String(body.instruction || '').slice(0, 500);
      const caption = String(body.caption || '').slice(0, 4000);
      if (!caption.trim()) {
        return Response.json({ error: 'Current caption is required.' }, { status: 400 });
      }
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Rewrite this social caption for iRoxanne Studio, about "${projectTitle}". ${instruction}
Keep it truthful: never invent results, metrics, quotes, testimonials, prices or links. Keep any existing link exactly as written.

Current caption:
${caption}

Return only the rewritten caption text.`,
      });
      const text = typeof res === 'string' ? res.trim() : String(res?.caption || '').trim();
      return Response.json({ caption: text });
    }

    if (action === 'generate_post_image') {
      const prompt = String(body.prompt || '').trim().slice(0, 2000);
      if (!prompt) {
        return Response.json({ error: 'An image prompt is required.' }, { status: 400 });
      }
      const res = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
      const url = res?.url || res?.data?.url || '';
      if (!url) {
        return Response.json({ error: 'No image returned.' }, { status: 502 });
      }
      return Response.json({ url });
    }

    return Response.json({ error: 'Unsupported studio action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || 'Action failed.' }, { status: 500 });
  }
}