import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin, loadPortfolioItem } from '../../shared/marketingAdmin.ts';
import { getHeyGenApiKey, createHeyGenSession, pollHeyGenVideo } from '../../shared/heygen.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireAdmin(base44);
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const { portfolio_item_id } = body || {};
    if (!portfolio_item_id) return Response.json({ error: 'portfolio_item_id is required' }, { status: 400 });

    const apiKey = getHeyGenApiKey();

    const item = await loadPortfolioItem(base44, portfolio_item_id);
    if (!item) return Response.json({ error: 'Portfolio item not found' }, { status: 404 });

    const prompt = buildPrompt(item);

    const session = await createHeyGenSession(apiKey, prompt);
    if (session.error) return Response.json({ error: session.error }, { status: 502 });

    pollHeyGenVideo(apiKey, session.sessionId, async (videoUrl) => {
      await base44.asServiceRole.entities.PortfolioItem.update(portfolio_item_id, { video_url: videoUrl });
      console.log('generateCaseStudyVideo: saved video_url', videoUrl, 'for', portfolio_item_id);
    }, (reason) => {
      console.warn('generateCaseStudyVideo: failed', reason);
    });

    return Response.json({
      ok: true,
      status: 'generating',
      session_id: session.sessionId,
      watch_url: session.watchUrl,
    });
  } catch (error) {
    console.error('generateCaseStudyVideo error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

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