// Shared HeyGen helpers used by generateCaseStudyVideo and generateWelcomeVideo.
import { waitUntil } from 'base44:runtime';
import { secrets } from 'base44:runtime';

const HEYGEN_BASE = 'https://api.heygen.com';

export function getHeyGenApiKey() {
  const apiKey = secrets.get('HEYGEN_API_KEY');
  if (!apiKey) throw new Error('HeyGen API key is not configured. Add HEYGEN_API_KEY in Settings → Secrets.');
  return apiKey;
}

// Creates a HeyGen Video Agent session from a prompt, returns { sessionId, watchUrl }.
// Defaults to portrait (9:16) orientation for mobile-friendly client videos.
export async function createHeyGenSession(apiKey, prompt, orientation = 'portrait') {
  const createRes = await fetch(`${HEYGEN_BASE}/v3/video-agents`, {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, orientation }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    const msg = createData?.message || createData?.error || 'HeyGen session creation failed';
    return { error: msg };
  }
  const sessionId = createData?.data?.session_id;
  if (!sessionId) return { error: 'HeyGen did not return a session id' };
  return { sessionId, watchUrl: `https://app.heygen.com/video-agent/${sessionId}` };
}

// Polls a HeyGen session → video until completed (up to maxWaitMs), then calls
// onSave(videoUrl) with the finished video URL. Calls onFail() if it fails or times out.
export function pollHeyGenVideo(apiKey, sessionId, onSave, onFail) {
  waitUntil(_pollAndSave(apiKey, sessionId, onSave, onFail));
}

async function _pollAndSave(apiKey, sessionId, onSave, onFail) {
  const maxWaitMs = 6 * 60 * 1000;
  const deadline = Date.now() + maxWaitMs;
  try {
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
    if (!videoId) { onFail('no_video_id'); return; }

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
      if (status === 'failed') { onFail('video_failed:' + (vData?.data?.failure_message || '')); return; }
    }
    if (!videoUrl) { onFail('timeout'); return; }
    onSave(videoUrl);
  } catch (e) {
    console.error('heygen poll error', e);
    onFail('error:' + e?.message);
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }