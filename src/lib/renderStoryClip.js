// Browser-rendered MP4 motion graphic. No camera, microphone or external footage.
export async function renderStoryClip(imageUrl, lines, { onProgress = () => {}, audioUrl = '' } = {}) {
  const mime = (audioUrl ? ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4'] : ['video/mp4;codecs=avc1.42E01E', 'video/mp4']).find(type => globalThis.MediaRecorder?.isTypeSupported(type));
  if (!mime) throw new Error('This browser cannot export MP4. Use a browser with MP4 recording support; no draft was changed.');
  const image = new Image(); image.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('The image could not be loaded for video export.')); image.src = imageUrl; });
  await document.fonts.ready;
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx || !canvas.captureStream) throw new Error('Canvas video export is unavailable.');
  // Detect cross-origin taint before starting a recording.
  ctx.drawImage(image, 0, 0, 1, 1); ctx.getImageData(0, 0, 1, 1);
  let audioContext, audioSource;
  let duration = 12000;
  if (audioUrl) {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Audio mixing is not supported by this browser.');
      audioContext = new AudioContextClass();
      await audioContext.resume();
      const response = await fetch(audioUrl, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('Narration could not be loaded.');
      const buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
      if (!Number.isFinite(buffer.duration) || buffer.duration <= 0 || buffer.duration > 60) throw new Error('Narration must be between 1 and 60 seconds.');
      duration = Math.max(12000, buffer.duration * 1000 + 500);
      audioSource = audioContext.createBufferSource(); audioSource.buffer = buffer;
    } catch(e) { if(audioContext) await audioContext.close(); throw e; }
  }
  let stream, recorder;
  try {
    stream = canvas.captureStream(30);
    if (audioSource) {
      const destination = audioContext.createMediaStreamDestination();
      audioSource.connect(destination);
      destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    }
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
  } catch(e) {
    stream?.getTracks().forEach(track => track.stop());
    if(audioContext) await audioContext.close();
    throw e;
  }
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
    const scene = Math.min(2, Math.floor(elapsed / (duration / 3)));
    const t = Math.min(1, (elapsed % (duration / 3)) / (duration / 3));
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
    ctx.fillRect(110, 1740, 860 * Math.min(1, elapsed / duration), 4);
  };
  try {
    draw(0); recorder.start(250);
    if (audioSource) audioSource.start();
    const start = performance.now();
    const frame = now => {
      if (recorder.state === 'inactive') return;
      const elapsed = now - start; draw(Math.min(elapsed,duration-1)); onProgress(Math.min(100,Math.round(elapsed/duration*100)));
      if (elapsed >= duration) recorder.stop(); else frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    timeout = setTimeout(() => { failed = new Error('Video export timed out.'); if (recorder.state !== 'inactive') recorder.stop(); }, duration + 8000);
    await done;
    const blob = new Blob(chunks, {type:'video/mp4'});
    if (!blob.size) throw new Error('The video was empty.');
    return blob;
  } finally {
    cancelAnimationFrame(frameId); clearTimeout(timeout);
    document.removeEventListener('visibilitychange', abort);
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach(track => track.stop());
    if (audioSource) { try { audioSource.stop(); } catch { /* already stopped */ } }
    if (audioContext) await audioContext.close();
  }
}
