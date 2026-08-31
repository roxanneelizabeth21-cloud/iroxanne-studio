import { relativeLuminance, hexToRgb, withAlpha } from '@/lib/colorUtils';
import { drawServiceIcon, serviceColor } from '@/lib/canvasServiceIcons';

export const CANVAS_SIZES = {
  '4:5': { w: 1080, h: 1350 },
  '1:1': { w: 1080, h: 1080 },
  '3:4': { w: 2048, h: 2732 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Cover image could not be loaded'));
    img.src = url;
  });
}

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Renders the case-study promo card: one flat colour panel matched
// to the cover image, the text set at the bottom of that panel, and the artwork
// filling the rest of the card edge to edge — two tones, nothing else.
export async function drawProjectCanvas({ coverUrl, title = '', studioName = '', color = '#8a8580', ratio = '9:16', cta = '', subtext = '', services = [], width, height }) {
  const fallback = CANVAS_SIZES[ratio] || CANVAS_SIZES['9:16'];
  const w = width || fallback.w;
  const h = height || fallback.h;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);

  // Dark ink on light panels, light ink on dark ones — the two-tone rule.
  const lightPanel = relativeLuminance(hexToRgb(color)) > 0.42;
  const ink = lightPanel ? '#141414' : '#ffffff';
  const inkSoft = withAlpha(ink, lightPanel ? 0.55 : 0.7);

  const img = await loadImage(coverUrl);
  const landscape = w / h >= 1.15;
  const pad = Math.round(w * (landscape ? 0.05 : 0.075));
  const titleSize = Math.round((landscape ? h : w) * (landscape ? 0.062 : 0.062));
  const lineH = Math.round(titleSize * 1.28);
  // Shrink the badge row when several services are on, so it never runs past
  // the card edges.
  const n = Math.max(services.length, 1);
  const mark = Math.round(Math.min(titleSize * 1.7, (w - pad * 2) / (1.4 * n - 0.4)));
  const markGap = Math.round(mark * 0.4);

  // Portrait cards centre the text in the colour panel; landscape sets it left.
  ctx.textAlign = landscape ? 'left' : 'center';
  ctx.textBaseline = 'alphabetic';

  // Landscape keeps a square artwork panel on the left; portrait artwork fills
  // everything under the text block (measured further down).
  const artSize = Math.round(h - pad * 2);
  const artX = pad;
  const artY = pad;

  const colWidth = landscape ? w - artSize - pad * 3 : w - pad * 2;
  const headline = String(title);
  // The extra line is optional — left blank, the card lays out exactly as before.
  const subLines = [`by ${studioName}`, cta, subtext].filter(Boolean);

  const bodySize = Math.round(titleSize * 0.62);
  const bodyLineH = Math.round(bodySize * 1.35);
  ctx.font = `700 ${titleSize}px Inter, sans-serif`;
  const headLines = wrap(ctx, headline, colWidth);
  ctx.font = `500 ${bodySize}px Inter, sans-serif`;
  const bodyLines = subLines.flatMap((l) => wrap(ctx, l, colWidth));
  // Clear breathing room between the last text line and the badge row.
  const markGapTop = Math.round(mark * 0.55);
  const markRow = services.length ? mark + markGapTop : 0;
  const textH = headLines.length * lineH + bodyLines.length * bodyLineH + markRow;

  const textX = landscape ? artX + artSize + pad : Math.round(w / 2);
  // Portrait sets the text at the top of the colour panel (the promote card
  // hierarchy); landscape centres it beside the artwork.
  const textTop = landscape ? Math.round((h - textH) / 2) : pad;

  let y = textTop + titleSize;
  ctx.fillStyle = ink;
  ctx.font = `700 ${titleSize}px Inter, sans-serif`;
  headLines.forEach((l) => { ctx.fillText(l, textX, y); y += lineH; });
  ctx.font = `500 ${bodySize}px Inter, sans-serif`;
  ctx.fillStyle = inkSoft;
  bodyLines.forEach((l) => { ctx.fillText(l, textX, y); y += bodyLineH; });

  if (services.length) {
    const cy = y + markGapTop + Math.round(mark / 2);
    const rowW = services.length * mark + (services.length - 1) * markGap;
    let cx = landscape ? textX : Math.round((w - rowW) / 2);
    services.forEach((s) => {
      // Real brand colours, drawn flat with no background plate.
      drawServiceIcon(ctx, s, cx + mark / 2, cy, mark / 2, serviceColor(s) || ink);
      cx += mark + markGap;
    });
  }

  if (landscape) {
    ctx.drawImage(img, artX, artY, artSize, artSize);
  } else {
    // Artwork runs the full card width and sits flush with the bottom edge, so
    // nothing is cut off the sides and there is no gap underneath. Any leftover
    // height above it stays in the matched colour panel with the text.
    const top = textTop + textH + Math.round(pad * 0.7);
    const boxH = h - top;
    const dw = w;
    const dh = Math.round((img.height / img.width) * w);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, w, boxH);
    ctx.clip();
    ctx.drawImage(img, 0, h - dh, dw, dh);
    ctx.restore();
  }

  return canvas;
}