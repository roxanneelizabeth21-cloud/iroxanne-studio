// Color helpers for the dynamic release-landing theme.
// Extracts a dominant color from the cover art and derives a full readable
// palette (light-on-dark or dark-on-light) from it.

export function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  if (Number.isNaN(num)) return { r: 0, g: 0, b: 0 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function channel(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// 0.45 pushes mid-tone covers (saturated golds, mids) onto the dark-hero path so
// white text stays readable instead of muddying against a borderline background.
export function isColorDark(hex) {
  return relativeLuminance(hexToRgb(hex)) < 0.45;
}

export function mix(hex, target, amount) {
  const { r, g, b } = hexToRgb(hex);
  const t = hexToRgb(target);
  return rgbToHex(r + (t.r - r) * amount, g + (t.g - g) * amount, b + (t.b - b) * amount);
}

export function lighten(hex, amount) {
  return mix(hex, '#ffffff', amount);
}

export function darken(hex, amount) {
  return mix(hex, '#000000', amount);
}

export function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}