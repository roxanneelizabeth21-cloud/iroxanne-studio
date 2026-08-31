// Records a still promo card into a short silent looping video with a slow
// zoom (Ken Burns) so it reads as intentional motion on Reels and Stories.
// MP4 is used when the browser can encode it, otherwise WebM.
const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm',
];

function pickMime() {
  return MIME_CANDIDATES.find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || '';
}

export async function recordCanvasVideo(sourceCanvas, { seconds = 6, fps = 30, zoom = 1.08 } = {}) {
  const mimeType = pickMime();
  if (!mimeType) throw new Error('This browser cannot record video');

  const out = document.createElement('canvas');
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  const ctx = out.getContext('2d');

  const stream = out.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  const done = new Promise((resolve) => { recorder.onstop = resolve; });
  recorder.start();

  const start = performance.now();
  const total = seconds * 1000;
  await new Promise((resolve) => {
    const frame = (now) => {
      const t = Math.min((now - start) / total, 1);
      const scale = 1 + (zoom - 1) * t;
      const w = out.width * scale;
      const h = out.height * scale;
      ctx.drawImage(sourceCanvas, (out.width - w) / 2, (out.height - h) / 2, w, h);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });

  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  await done;

  const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  return { blob: new Blob(chunks, { type: mimeType }), ext };
}