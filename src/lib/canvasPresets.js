// Real delivery specs for showcase canvases, plus the social sizes.
// safeBottom = share of the height a platform's own UI covers, so nothing
// important gets rendered underneath it.
export const CANVAS_PRESETS = [
  {
    id: 'promo_portrait',
    label: 'Portrait promo card',
    group: 'Showcase sizes',
    platform: 'All platforms',
    w: 1080,
    h: 1920,
    ratio: '9:16',
    safeBottom: 0,
    note: 'Portrait 9:16 at 1080×1920 — the portrait promo card shape. Works for Stories and Reels.',
  },
  {
    id: 'showcase_loop',
    label: 'Vertical loop 9:16',
    group: 'Showcase sizes',
    platform: 'All platforms',
    w: 1080,
    h: 1920,
    ratio: '9:16',
    safeBottom: 0.2,
    note: 'Vertical 9:16 at 1080×1920. A short looping MP4 with no audio — export this still as your loop in Canva.',
  },
  {
    id: 'apple_motion_square',
    label: 'Square motion 1:1',
    group: 'Showcase sizes',
    platform: 'All platforms',
    w: 3000,
    h: 3000,
    ratio: '1:1',
    safeBottom: 0.04,
    note: 'Square 1:1 at 3000×3000 — square motion artwork. The whole square is safe to use.',
  },
  {
    id: 'apple_motion_34',
    label: 'Tall motion 3:4',
    group: 'Showcase sizes',
    platform: 'All platforms',
    w: 2048,
    h: 2732,
    ratio: '3:4',
    safeBottom: 0.22,
    note: 'Tall 3:4 at 2048×2732 — tall motion art. Keep the lower area clear for any overlay buttons.',
  },
  {
    id: 'amazon_animated',
    label: 'Square animated 1:1',
    group: 'Showcase sizes',
    platform: 'All platforms',
    w: 1600,
    h: 1600,
    ratio: '1:1',
    safeBottom: 0.04,
    note: 'Square 1:1 at 1600×1600 — square animated cover.',
  },
  {
    id: 'cover_art',
    label: 'Square cover 1:1',
    group: 'Showcase sizes',
    platform: 'All platforms',
    w: 3000,
    h: 3000,
    ratio: '1:1',
    safeBottom: 0.04,
    note: 'Square 1:1 at 3000×3000 — the standard square cover size.',
  },
  { id: 'social_feed', label: 'Feed post 4:5', group: 'Social', w: 1080, h: 1350, ratio: '4:5', safeBottom: 0, note: 'Instagram and Facebook feed at 1080×1350.' },
  { id: 'social_square', label: 'Square post 1:1', group: 'Social', w: 1080, h: 1080, ratio: '1:1', safeBottom: 0, note: 'Square social post at 1080×1080.' },
  { id: 'social_story', label: 'Story / Reel 9:16', group: 'Social', w: 1080, h: 1920, ratio: '9:16', safeBottom: 0.14, note: 'Stories and Reels at 1080×1920, with room for the platform’s buttons at the bottom.' },
  { id: 'social_wide', label: 'Wide 16:9', group: 'Social', w: 1920, h: 1080, ratio: '16:9', safeBottom: 0, note: 'YouTube and wide placements at 1920×1080.' },
];

export const getCanvasPreset = (id) =>
  CANVAS_PRESETS.find((p) => p.id === id) || CANVAS_PRESETS[0];

export const presetSizeLabel = (p) => `${p.ratio} · ${p.w}×${p.h}`;