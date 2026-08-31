// Shared theme presets for dynamic release landing pages (/release/:slug).
// Each preset is a self-contained color system consumed by the release-landing
// components via inline styles — the release pages live outside the Tailwind
// theme tokens so they can carry per-release branding.

export const GOLD_THEME = {
  bg: '#070b14',
  text: '#eef2f8',
  textMuted: '#9fb0c8',
  accent: '#c9a96a',
  accentGradient: 'linear-gradient(135deg, #d8c08a, #c9a96a)',
  btnText: '#1a1208',
  glow: 'rgba(140,170,220,0.28)',
  border: 'rgba(120,150,200,0.18)',
  cardBg: 'rgba(12,20,36,0.8)',
  heroBg:
    'radial-gradient(ellipse 75% 55% at 50% 18%, rgba(120,150,210,0.18), transparent 70%), radial-gradient(ellipse 60% 50% at 50% 95%, rgba(201,169,106,0.12), transparent 70%), linear-gradient(180deg, #070b14 0%, #0c1424 50%, #070b14 100%)',
  coverFallback: 'linear-gradient(135deg, #0c1424 0%, #1e2c4a 100%)',
};

export const TEAL_THEME = {
  bg: '#061318',
  text: '#eaf2f0',
  textMuted: '#8fa9a6',
  accent: '#A67B3F',
  accentGradient: 'linear-gradient(135deg, #C59F59, #A67B3F)',
  btnText: '#0d0d0d',
  glow: 'rgba(40,164,156,0.28)',
  border: 'rgba(40,164,156,0.20)',
  cardBg: 'rgba(10,28,32,0.82)',
  heroBg:
    'radial-gradient(ellipse 75% 55% at 50% 18%, rgba(40,164,156,0.18), transparent 70%), radial-gradient(ellipse 60% 50% at 50% 95%, rgba(166,123,63,0.12), transparent 70%), linear-gradient(180deg, #061318 0%, #0a2329 50%, #061318 100%)',
  coverFallback: 'linear-gradient(135deg, #0a2329 0%, #1B575D 100%)',
};

export const ROSE_THEME = {
  bg: '#120a0f',
  text: '#f5e9ee',
  textMuted: '#c4a8b6',
  accent: '#d98fa6',
  accentGradient: 'linear-gradient(135deg, #e8a6bc, #d98fa6)',
  btnText: '#1a0a10',
  glow: 'rgba(217,143,166,0.26)',
  border: 'rgba(200,140,165,0.2)',
  cardBg: 'rgba(28,16,22,0.8)',
  heroBg:
    'radial-gradient(ellipse 75% 55% at 50% 18%, rgba(217,143,166,0.18), transparent 70%), radial-gradient(ellipse 60% 50% at 50% 95%, rgba(201,169,106,0.12), transparent 70%), linear-gradient(180deg, #120a0f 0%, #1f1218 50%, #120a0f 100%)',
  coverFallback: 'linear-gradient(135deg, #1f1218 0%, #3a2230 100%)',
};

export const CUSTOM_THEME = {
  bg: '#0a0705',
  text: '#f5e6d3',
  textMuted: '#d4c4a8',
  accent: '#e8b85a',
  accentGradient: 'linear-gradient(135deg, #e8b85a, #d94824)',
  btnText: '#1a0f08',
  glow: 'rgba(232,112,60,0.32)',
  border: 'rgba(212,160,74,0.4)',
  cardBg: 'rgba(31,22,16,0.6)',
  heroBg:
    'radial-gradient(ellipse 75% 55% at 50% 18%, rgba(232,112,60,0.28), transparent 70%), radial-gradient(ellipse 60% 50% at 50% 95%, rgba(212,160,74,0.16), transparent 70%), linear-gradient(180deg, #0a0705 0%, #160f0b 50%, #0a0705 100%)',
  coverFallback: 'linear-gradient(135deg, #3d2b1f 0%, #d94824 100%)',
};

export const THEME_PRESETS = {
  gold: GOLD_THEME,
  teal: TEAL_THEME,
  rose: ROSE_THEME,
  custom: CUSTOM_THEME,
};

export function getReleaseTheme(preset) {
  const base = THEME_PRESETS[preset] || GOLD_THEME;
  // Bright teal used for high-emphasis pre-save buttons (upcoming releases).
  return { ...base, teal: base.teal || '#28A49C', tealText: base.tealText || '#0d0d0d' };
}

export const THEME_PRESET_OPTIONS = [
  { value: 'gold', label: 'Gold — navy + champagne gold' },
  { value: 'teal', label: 'Teal — deep teal-black + gold' },
  { value: 'rose', label: 'Rose — wine + rose gold' },
  { value: 'custom', label: 'Custom — warm ember spice' },
];