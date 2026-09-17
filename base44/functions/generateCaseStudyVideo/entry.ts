import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';
import { secrets } from 'base44:runtime';
import { requireAdmin, loadPortfolioItem } from '../../shared/marketingAdmin.ts';

const HEYGEN_BASE = 'https://api.heygen.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const { portfolio_item_id } = body || {};
    if (!portfolio_item_id) return Response.json({ error: 'portfolio_item_id is required' }, { status: 400 });

    const apiKey = secrets.get('HEYGEN_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'HeyGen API key is not configured. Add HEYGEN_API_KEY in Settings → Secrets.' }, { status: 500 });
    }

    const item = await loadPortfolioItem(base44, portfolio_item_id);
    if (!item) return Response.json({ error: 'Portfolio item not found' }, { status: 404 });

    const prompt = buildPrompt(item);

    // 1. Create a HeyGen Video Agent session
    const createRes = await fetch(`${HEYGEN_BASE}/v3/video-agents`, {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      const msg = createData?.message || createData?.error || 'HeyGen session creation failed';
      return Response.json({ error: msg }, { status: 502 });
    }
    const sessionId = createData?.data?.session_id;
    if (!sessionId) return Response.json({ error: 'HeyGen did not return a session id' }, { status: 502 });

    // 2. Poll in the background and save the video_url onto the portfolio item when done.
    waitUntil(pollAndSave(base44, apiKey, sessionId, portfolio_item_id));

    return Response.json({
      ok: true,
      status: 'generating',
      session_id: sessionId,
      watch_url: `https://app.heygen.com/video-agent/${sessionId}`,
    });
  } catch (error) {
    console.error('generateCaseStudyVideo error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function pollAndSave(base44, apiKey, sessionId, portfolioItemId) {
  const maxWaitMs = 6 * 60 * 1000; // up to 6 minutes total
  const deadline = Date.now() + maxWaitMs;
  try {
    // 1. Wait for the video_id to be assigned
    let videoId = null;
    while (!videoId && Date.now() < deadline) {
      await sleep(5000);
      const sessRes = await fetch(`${HEYGEN_BASE}/v3/video-agents/${sessionId}`, {
        headers: { 'X-Api-Key': apiKey },
      });
      if (!sessRes.ok) continue;
      const sessData = await sessRes.json();
      videoId = sessData?.data?.video_id;
    }
    if (!videoId) {
      console.warn('generateCaseStudyVideo: no video_id after waiting for session', sessionId);
      return;
    }

    // 2. Poll the video until completed or failed
    let videoUrl = null;
    while (Date.now() < deadline) {
      await sleep(10000);
      const vRes = await fetch(`${HEYGEN_BASE}/v3/videos/${videoId}`, {
        headers: { 'X-Api-Key': apiKey },
      });
      if (!vRes.ok) continue;
      const vData = await vRes.json();
      const status = vData?.data?.status;
      if (status === 'completed') { videoUrl = vData?.data?.video_url; break; }
      if (status === 'failed') {
        console.warn('generateCaseStudyVideo: video failed', videoId, vData?.data?.failure_message);
        return;
      }
    }

    if (!videoUrl) {
      console.warn('generateCaseStudyVideo: timed out before completion', videoId);
      return;
    }

    // 3. Save the finished video onto the portfolio item
    await base44.asServiceRole.entities.PortfolioItem.update(portfolioItemId, { video_url: videoUrl });
    console.log('generateCaseStudyVideo: saved video_url', videoUrl, 'for', portfolioItemId);
  } catch (e) {
    console.error('generateCaseStudyVideo poll error', e);
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function buildPrompt(item) {
  const title = item.title || 'this project';
  const tagline = item.tagline || '';
  const description = item.description || '';
  const client = item.client_shareable && item.client_name ? `Built for ${item.client_name}.` : '';
  const tech = Array.isArray(item.tech_used) ? item.tech_used.join(', ') : (item.tech_used || '');
  const saas = item.saas_replacement_value || '';
  const features = item.marketing_features || '';
  const projectUrl = item.project_url || 'https://iroxannestudio.com';

  return `Create a short (60-90 second) presenter-led video presentation for a portfolio case study from iRoxanne Studio, a custom app development studio.

Project title: ${title}
${tagline ? `Tagline: ${tagline}` : ''}
${client}
${description ? `What it does: ${description}` : ''}
${tech ? `Built with: ${tech}` : ''}
${saas ? `What it replaces: ${saas}` : ''}
${features ? `Key features and benefits: ${features}` : ''}

Tone: warm, professional, confident. The presenter should walk through the problem this project solves, the solution that was built, and the outcome. Keep it concise and engaging. End with a call to visit ${projectUrl} to see the live project.`;
}