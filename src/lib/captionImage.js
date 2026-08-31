// Renders a caption onto an image and returns a flattened PNG file, so the text
// is baked into the actual file that gets posted (not just an on-screen overlay).

export const CAPTION_SIZES = { tiny: 0.028, xsmall: 0.038, small: 0.05, medium: 0.07, large: 0.095 };

// Font choices for captions. `stack` is used for both the on-screen preview and
// the canvas render so they match exactly.
export const CAPTION_FONTS = {
  inter: { label: 'Inter (clean sans)', stack: "Inter, system-ui, sans-serif", weight: 700 },
  montserrat: { label: 'Montserrat (bold sans)', stack: "Montserrat, sans-serif", weight: 800 },
  playfair: { label: 'Playfair Display (elegant serif)', stack: "'Playfair Display', serif", weight: 700 },
  bebas: { label: 'Bebas Neue (tall caps)', stack: "'Bebas Neue', sans-serif", weight: 400 },
  caveat: { label: 'Caveat (handwritten)', stack: "Caveat, cursive", weight: 700 },
};
export const CAPTION_COLORS = {
  white: '#ffffff',
  gold: '#c5a059',
  black: '#111111',
};

function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

// Loads through fetch+blob so the canvas isn't tainted by cross-origin rules.
async function loadImage(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  const bitmapUrl = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('The image could not be loaded'));
      img.src = bitmapUrl;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(bitmapUrl), 5000);
  }
}

export async function renderCaptionedImage({ url, text, size = 'medium', font = 'inter', color = 'white', position = 'bottom', scrim = true, fileName = 'captioned' }) {
  const img = await loadImage(url);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const fontPx = Math.round(canvas.width * (CAPTION_SIZES[size] || CAPTION_SIZES.medium));
  const chosenFont = CAPTION_FONTS[font] || CAPTION_FONTS.inter;
  const fontSpec = `${chosenFont.weight} ${fontPx}px ${chosenFont.stack}`;
  // Make sure the webfont is ready, otherwise the canvas draws a fallback face.
  if (document.fonts?.load) await document.fonts.load(fontSpec, text);
  ctx.font = fontSpec;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';

  const pad = Math.round(canvas.width * 0.06);
  const lines = wrapLines(ctx, text.trim(), canvas.width - pad * 2);
  const lineHeight = Math.round(fontPx * 1.25);
  const blockHeight = lines.length * lineHeight;

  let top;
  if (position === 'top') top = pad;
  else if (position === 'center') top = Math.round((canvas.height - blockHeight) / 2);
  else top = canvas.height - blockHeight - pad;

  if (scrim) {
    const scrimTop = Math.max(0, top - pad * 0.6);
    const scrimHeight = Math.min(canvas.height - scrimTop, blockHeight + pad * 1.2);
    const grad = ctx.createLinearGradient(0, scrimTop, 0, scrimTop + scrimHeight);
    const dark = color === 'black' ? '255,255,255' : '0,0,0';
    grad.addColorStop(0, `rgba(${dark},0)`);
    grad.addColorStop(0.35, `rgba(${dark},0.62)`);
    grad.addColorStop(1, `rgba(${dark},0.78)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, scrimTop, canvas.width, scrimHeight);
  }

  ctx.fillStyle = CAPTION_COLORS[color] || CAPTION_COLORS.white;
  lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, top + i * lineHeight));

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return new File([blob], `${fileName.replace(/[^a-z0-9-_ ]/gi, '') || 'captioned'}.png`, { type: 'image/png' });
}