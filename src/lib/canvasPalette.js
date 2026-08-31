import { hexToRgb, rgbToHex, mix, lighten, darken, relativeLuminance } from '@/lib/colorUtils';

// Builds the swatch palette for a promo card. Every swatch is pulled from the
// cover image itself, then muted, so the
// panel colour and the artwork always read as one two-tone card.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Cover art could not be loaded'));
    img.src = url;
  });
}

// The most common colours in the artwork, coarsely bucketed so near-identical
// pixels collapse into one entry.
async function topColors(url, count) {
  const img = await loadImage(url);
  const size = 48;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const key = [data[i], data[i + 1], data[i + 2]].map((v) => Math.round(v / 24)).join(',');
    const b = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
    b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2]; b.n += 1;
    buckets.set(key, b);
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((b) => rgbToHex(b.r / b.n, b.g / b.n, b.b / b.n));
}

// The swatches are never fully saturated — they are the image's colour pulled
// toward its own grey, so text stays readable on top of them.
const muted = (hex, amount = 0.22) => {
  const { r, g, b } = hexToRgb(hex);
  const grey = Math.round((r + g + b) / 3);
  return mix(hex, rgbToHex(grey, grey, grey), amount);
};

export function paletteFromColor(hex) {
  const base = hex || '#8a8580';
  return [
    muted(base, 0.3),
    darken(base, 0.88),
    darken(muted(base, 0.15), 0.35),
    darken(muted(base, 0.35), 0.6),
    lighten(muted(base, 0.45), 0.68),
    muted(lighten(base, 0.35), 0.75),
    muted(lighten(base, 0.55), 0.85),
    darken(muted(base, 0.8), 0.45),
    muted(darken(base, 0.25), 0.9),
    darken(muted(base, 0.6), 0.7),
  ];
}

const dist = (a, b) => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return Math.abs(x.r - y.r) + Math.abs(x.g - y.g) + Math.abs(x.b - y.b);
};

// Ten swatches, each one a different colour actually present in the artwork,
// muted so text stays readable — not shades of a single colour.
export async function paletteFromCover(url) {
  if (!url) return paletteFromColor('#8a8580');
  const tones = await topColors(url, 40);
  if (!tones.length) return paletteFromColor('#8a8580');

  // Keep the most common tones that are visibly different from each other.
  const picked = [];
  for (const hex of tones) {
    if (picked.some((p) => dist(p, hex) < 90)) continue;
    picked.push(hex);
    if (picked.length === 8) break;
  }

  const out = picked.map((hex) => muted(hex, 0.28));
  // Round the row out with the artwork's own darkest and lightest tones.
  const byLum = [...picked].sort((a, b) => relativeLuminance(hexToRgb(a)) - relativeLuminance(hexToRgb(b)));
  out.push(darken(byLum[0], 0.85));
  out.push(lighten(muted(byLum[byLum.length - 1], 0.4), 0.6));
  return out.slice(0, 10);
}