import { isColorDark, lighten, darken, withAlpha } from '@/lib/colorUtils';

// Builds a full, readable landing-page theme from a single dominant cover color.
// Light covers (luminance >= 0.45) get a light background + dark text;
// dark/mid covers get a dark background + light text. Brand gold accent and
// teal CTA color are kept consistent across both paths.
// `base` is the static fallback preset (provides teal/tealText); dynamic keys override it.
export function buildDynamicTheme(hex, base = {}) {
  const dark = isColorDark(hex);
  const accent = dark ? '#C59F59' : '#A67B3F';

  const bg = dark ? darken(hex, 0.9) : lighten(hex, 0.9);
  const text = dark ? '#f4f6fb' : '#141414';
  // Solid muted tone — alpha-blended muted text muddies against saturated mid-tone backgrounds.
  const textMuted = dark ? 'rgba(255,255,255,0.72)' : '#3a3a3a';
  // Higher-contrast card surfaces than the static presets so buttons read as clickable.
  const border = dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)';
  const cardBg = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.78)';

  const heroBg = dark
    ? `radial-gradient(ellipse 75% 55% at 50% 18%, ${withAlpha(lighten(hex, 0.25), 0.22)}, transparent 70%), linear-gradient(180deg, ${darken(hex, 0.92)} 0%, ${darken(hex, 0.8)} 50%, ${darken(hex, 0.92)} 100%)`
    : `radial-gradient(ellipse 75% 55% at 50% 18%, ${withAlpha(hex, 0.2)}, transparent 70%), linear-gradient(180deg, ${lighten(hex, 0.92)} 0%, ${lighten(hex, 0.85)} 50%, ${lighten(hex, 0.92)} 100%)`;

  return {
    ...base,
    bg,
    text,
    textMuted,
    accent,
    accentGradient: `linear-gradient(135deg, ${lighten(accent, 0.15)}, ${accent})`,
    btnText: dark ? '#1a1208' : '#fffaf0',
    glow: withAlpha(hex, 0.3),
    border,
    cardBg,
    heroBg,
    coverFallback: `linear-gradient(135deg, ${darken(hex, 0.5)} 0%, ${lighten(hex, 0.1)} 100%)`,
    teal: base.teal || '#28A49C',
    tealText: base.tealText || '#0d0d0d',
  };
}