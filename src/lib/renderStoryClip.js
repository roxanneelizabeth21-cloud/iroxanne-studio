// Browser-rendered MP4 motion graphic. No camera, microphone or external footage.
export async function renderStoryClip(imageUrl, lines, { onProgress = () => {} } = {}) {
  const mime = ['video/mp4;codecs=avc1.42E01E', 'video/mp4'].find(type => globalThis.MediaRecorder?.isTypeSupported(type));
  if (!mime) throw new Error('This browser cannot export MP4. Use a browser with MP4 recording support; no draft was changed.');
  const image = new Image(); image.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('The image could not be loaded for video export.')); image.src = imageUrl; });
  await document.fonts.ready;
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.captureStream) throw new Error('Canvas video export is unavailable.');
  // Detect cross-origin taint before starting a recording.
  ctx.drawImage(image, 0, 0, 1, 1); ctx.getImageData(0, 0, 1, 1);
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
  const chunks = [];
  let frameId, timeout, failed;
  const done = new Promise((resolve, reject) => {
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => failed ? reject(failed) : resolve();
    recorder.onerror = () => { failed = new Error('Video recording failed.'); reject(failed); };
  });
  const abort = () => {
    if (document.hidden) { failed = new Error('Keep this tab visible while exporting. Please try again.'); if (recorder.state !== 'inactive') recorder.stop(); }
  };
  document.addEventListener('visibilitychange', abort);
  const draw = elapsed => {
    const scene = Math.min(2, Math.floor(elapsed / 4000));
    const t = Math.min(1, (elapsed % 4000) / 4000);
    ctx.fillStyle = '#251e2c'; ctx.fillRect(0, 0, 1080, 1920);
    const scale = Math.max(1080 / image.width, 1920 / image.height) * (1.03 + t * .06);
    const w = image.width * scale, h = image.height * scale;
    ctx.drawImage(image, (1080 - w) / 2 + Math.sin(t * Math.PI) * (scene === 1 ? -20 : 20), (1920 - h) / 2, w, h);
    const gradient = ctx.createLinearGradient(0, 650, 0, 1800);
    gradient.addColorStop(0, 'rgba(25,18,31,0)'); gradient.addColorStop(1, 'rgba(25,18,31,.95)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1920);
    ctx.globalAlpha = Math.min(1, t * 8);
    ctx.fillStyle = '#fff8ed'; ctx.font = '600 70px Georgia';
    const words = String(lines[scene] || '').split(/\s+/); const rows = []; let row = '';
    for (const word of words) { const next = row ? row + ' ' + word : word; if (ctx.measureText(next).width > 860 && row) { rows.push(row); row = word; } else row = next; } rows.push(row);
    rows.slice(0,4).forEach((text,i) => ctx.fillText(text, 110, 1230 + i * 88));
    ctx.globalAlpha = 1; ctx.fillStyle = '#d9bd87'; ctx.font = '32px Arial';
    ctx.fillText('iRoxanne Studio', 110, 1690);
    ctx.fillRect(110, 1740, 860 * Math.min(1, elapsed / 12000), 4);
  };
  try {
    draw(0); recorder.start(250);
    const start = performance.now();
    const frame = now => {
      if (recorder.state === 'inactive') return;
      const elapsed = now - start; draw(Math.min(elapsed,11999)); onProgress(Math.min(100,Math.round(elapsed/120)));
      if (elapsed >= 12000) recorder.stop(); else frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    timeout = setTimeout(() => { failed = new Error('Video export timed out.'); if (recorder.state !== 'inactive') recorder.stop(); }, 20000);
    await done;
    const blob = new Blob(chunks, {type:'video/mp4'});
    if (!blob.size) throw new Error('The video was empty.');
    return blob;
  } finally {
    cancelAnimationFrame(frameId); clearTimeout(timeout);
    document.removeEventListener('visibilitychange', abort);
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach(track => track.stop());
  }
}
