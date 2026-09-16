// Renders a sequence of finished card images into one vertical MP4.
//
// Different from renderStoryClip, which animates text over a single image.
// Here each card is already a finished frame, so the job is to hold each one
// long enough to read, drift it slightly so it does not feel like a slide deck,
// and cross-fade between them.
//
// Runs in the browser with MediaRecorder. There is no server-side renderer.

function pickMime() {
  const candidates = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm',
  ];
  return candidates.find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || '';
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`A card image could not be loaded for export: ${url.slice(0, 60)}`));
    img.src = url;
  });
}

const W = 1080;
const H = 1920;

/**
 * @param {string[]} imageUrls  finished card images, in order
 * @param {object}   opts       secondsPerCard, fade, onProgress, audioUrl
 * @returns {Promise<{blob: Blob, mime: string, seconds: number}>}
 */
export async function renderCardReel(imageUrls, {
  secondsPerCard = 2.6,
  fade = 0.45,
  onProgress = () => {},
  audioUrl = '',
  background = '#F5F1EA',
} = {}) {
  const mime = pickMime();
  if (!mime) throw new Error('This browser cannot export video. Use a browser with MP4 recording support; nothing was changed.');
  if (!imageUrls?.length) throw new Error('Add at least one card before exporting a reel.');

  onProgress({ stage: 'loading', pct: 0 });
  const images = [];
  for (let i = 0; i < imageUrls.length; i++) {
    images.push(await loadImage(imageUrls[i]));
    onProgress({ stage: 'loading', pct: Math.round(((i + 1) / imageUrls.length) * 20) });
  }

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.captureStream) throw new Error('Canvas video export is unavailable in this browser.');

  const stream = canvas.captureStream(30);

  // Optional narration or music, mixed in if the browser allows it.
  let audioEl = null;
  if (audioUrl) {
    try {
      audioEl = new Audio(audioUrl);
      audioEl.crossOrigin = 'anonymous';
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const src = actx.createMediaElementSource(audioEl);
      const dest = actx.createMediaStreamDestination();
      src.connect(dest); src.connect(actx.destination);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    } catch {
      audioEl = null; // silent clip rather than a failed export
    }
  }

  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };

  const total = imageUrls.length * secondsPerCard;
  let failed = null;

  const onHide = () => {
    if (document.hidden) {
      failed = new Error('Keep this tab visible while the reel exports. Please try again.');
      if (recorder.state !== 'inactive') recorder.stop();
    }
  };
  document.addEventListener('visibilitychange', onHide);

  // Contain the card in frame, letterboxed on the studio background.
  const drawCard = (img, t, alpha) => {
    const scale = Math.min(W / img.width, H / img.height);
    // Slow drift so a still frame still feels alive.
    const zoom = 1.02 + 0.03 * t;
    const w = img.width * scale * zoom;
    const h = img.height * scale * zoom;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    ctx.globalAlpha = 1;
  };

  const done = new Promise((resolve, reject) => {
    recorder.onstop = () => {
      document.removeEventListener('visibilitychange', onHide);
      if (failed) return reject(failed);
      resolve({ blob: new Blob(chunks, { type: mime }), mime, seconds: total });
    };
    recorder.onerror = () => reject(new Error('The recorder stopped unexpectedly. No draft was changed.'));
  });

  recorder.start();
  if (audioEl) audioEl.play().catch(() => {});
  const startedAt = performance.now();

  await new Promise((resolve) => {
    const frame = () => {
      if (failed) { resolve(); return; }
      const elapsed = (performance.now() - startedAt) / 1000;
      if (elapsed >= total) { resolve(); return; }

      const idx = Math.min(images.length - 1, Math.floor(elapsed / secondsPerCard));
      const local = elapsed - idx * secondsPerCard;
      const t = local / secondsPerCard;

      ctx.fillStyle = background;
      ctx.fillRect(0, 0, W, H);

      // Fade the outgoing card under the incoming one.
      if (local < fade && idx > 0) {
        drawCard(images[idx - 1], 1, 1);
        drawCard(images[idx], t, local / fade);
      } else {
        drawCard(images[idx], t, 1);
      }

      onProgress({ stage: 'rendering', pct: 20 + Math.round((elapsed / total) * 78) });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });

  if (recorder.state !== 'inactive') recorder.stop();
  if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; }
  const out = await done;
  onProgress({ stage: 'done', pct: 100 });
  return out;
}
