// Platform/tool marks for the case-study canvas. Any name renders as a single
// letter in a circle — a clean generic badge for any tech or tool the project
// was built with, with no per-brand logo assets required.

export const SERVICE_COLORS = {};

export const serviceColor = (service) => SERVICE_COLORS[service] || null;

function fallbackLetter(ctx, cx, cy, r, ch, ink) {
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(r * 1.15)}px Inter, sans-serif`;
  ctx.fillText(ch, cx, cy + r * 0.04);
}

// Draws one mark scaled into the given circle, in `ink`.
export function drawServiceIcon(ctx, service, cx, cy, r, ink) {
  const ch = String(service || '?').charAt(0).toUpperCase();
  fallbackLetter(ctx, cx, cy, r, ch, ink);
}