import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getHeyGenApiKey, createHeyGenSession, pollHeyGenVideo, guardHeyGenCall } from '../../shared/heygen.ts';
import { sendStudioEmail } from '../../shared/studioEmail.ts';
import { esc, brandedEmail, brandButton } from '../../shared/emailBrand.ts';
import { clientLink } from '../../shared/studioUrl.ts';

// Called internally after a contract is signed — generates a personalized
// welcome video via HeyGen, saves it to the contract, and emails the client.
// Also exposed as an admin-invocable function for manual regeneration.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { contract_id, regenerate } = body || {};
    if (!contract_id) return Response.json({ error: 'contract_id is required' }, { status: 400 });

    // Admin guard — only admins can manually trigger or regenerate.
    if (regenerate) {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
    if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

    // Hard guard — prevents accidental HeyGen credit usage.
    guardHeyGenCall(body);

    const apiKey = getHeyGenApiKey();

    if (contract.welcome_video_status === 'generating' && !regenerate) {
      return Response.json({ status: 'already_generating', watch_url: null });
    }

    await base44.asServiceRole.entities.Contract.update(contract_id, {
      welcome_video_status: 'generating',
      welcome_video_url: null,
    });

    const prompt = buildPrompt(contract);

    const session = await createHeyGenSession(apiKey, prompt);
    if (session.error) {
      await base44.asServiceRole.entities.Contract.update(contract_id, { welcome_video_status: 'failed' });
      return Response.json({ error: session.error }, { status: 502 });
    }

    pollHeyGenVideo(apiKey, session.sessionId, async (videoUrl) => {
      await base44.asServiceRole.entities.Contract.update(contract_id, {
        welcome_video_url: videoUrl,
        welcome_video_status: 'ready',
      });
      console.log('generateWelcomeVideo: saved video_url', videoUrl, 'for contract', contract_id);

      // Email the client that their welcome video is ready.
      try {
        const updated = await base44.asServiceRole.entities.Contract.get(contract_id);
        if (updated?.client_email) {
          const firstName = (updated.signer_name || updated.client_name || '').split(' ')[0] || 'there';
          const contractLink = clientLink({ headers: {} }, 'contract', contract_id, updated.access_token);
          await sendStudioEmail(base44, {
            to: updated.client_email,
            subject: 'A personal welcome from Roxanne — ' + updated.project_title,
            body: brandedEmail({
              title: 'Your welcome video is ready, ' + esc(firstName) + '.',
              content: '<p style="margin:0 0 16px;">I just recorded a short welcome video for you about <strong>' + esc(updated.project_title) + '</strong>. Take a look — it covers what happens next and what to expect as we get started.</p>' +
                '<p style="margin:0 0 16px;">' + brandButton('Watch my welcome video', videoUrl) + '</p>' +
                '<p style="margin:0 0 16px;">' + brandButton('View your signed agreement', contractLink) + '</p>' +
                '<p style="margin:0;color:#8B7B95;font-size:13px;">— Roxanne, iRoxanne Studio</p>',
              footerNote: 'iRoxanne Studio — one builder, not an agency.',
            }),
          });
          await base44.asServiceRole.entities.Contract.update(contract_id, { welcome_video_sent_at: new Date().toISOString() });
        }
      } catch (e) {
        console.log('welcome video email failed', e?.message);
      }
    }, async (reason) => {
      console.warn('generateWelcomeVideo: failed', reason);
      await base44.asServiceRole.entities.Contract.update(contract_id, { welcome_video_status: 'failed' }).catch(() => {});
    });

    return Response.json({
      ok: true,
      status: 'generating',
      session_id: session.sessionId,
      watch_url: session.watchUrl,
    });
  } catch (error) {
    console.error('generateWelcomeVideo error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function buildPrompt(contract) {
  const firstName = (contract.signer_name || contract.client_name || '').split(' ')[0] || 'there';
  const projectTitle = contract.project_title || 'your project';
  const scope = contract.scope_summary || '';
  const tier = contract.estimated_tier || contract.selected_package || '';
  const launchDate = contract.target_launch_date || '';
  const isRush = contract.contract_variant === 'rush';

  return `Create a warm, personal welcome video from Roxanne, the founder of iRoxanne Studio (a custom app development studio). The client just signed their project agreement. This should feel like a personal message from Roxanne to the client, not a corporate video.

Client name: ${firstName}
Project: ${projectTitle}
${tier ? `Package/tier: ${tier}` : ''}
${scope ? `Project summary: ${scope}` : ''}
${launchDate ? `Target launch date: ${launchDate}` : ''}
${isRush ? 'Note: This is a rush project — acknowledge the expedited timeline.' : ''}

The video should be 60-90 seconds and cover:
1. A warm personal greeting using the client's first name
2. Congratulate them on signing and express genuine excitement about building their project
3. Briefly mention what the project is (based on the project title and summary above)
4. Walk through the immediate next steps: deposit, intake form, and then the build process
5. Reassure them about the journey ahead — they'll be involved and have room for feedback throughout
6. Close warmly with an invitation to reach out with any questions

Tone: warm, personal, authentic, confident but not corporate. Speak as if talking directly to this one person. No generic sales language.`;
}