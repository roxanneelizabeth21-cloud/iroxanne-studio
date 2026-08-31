// Shared vocabulary for filing media into collections (albums/singles) and
// asset kinds (Merch, Cover Art, Promo…), plus best-guess matching by title.
export const MEDIA_CATEGORIES = [
  'Cover Art',
  'Promo',
  'Merch',
  'Lyric Graphic',
  'Live',
  'Behind the Scenes',
  'Press',
  'Other',
];

const MERCH_WORDS = /(hoodie|sweatshirt|t-?shirt|\btee\b|\bshirt\b|mug|tumbler|\bcap\b|\bhat\b|beanie|tote|sticker|poster|merch|apparel|bundle|hoody|crewneck)/i;
const COVER_WORDS = /(cover|artwork|album art|single art)/i;
const LYRIC_WORDS = /(lyric|quote|verse)/i;
const LIVE_WORDS = /(live|stage|concert|performance|show)/i;
const BTS_WORDS = /(behind the scenes|bts|studio|rehearsal)/i;
const PRESS_WORDS = /(press|headshot|epk|photoshoot)/i;

export function guessCategory(text = '') {
  if (MERCH_WORDS.test(text)) return 'Merch';
  if (COVER_WORDS.test(text)) return 'Cover Art';
  if (LYRIC_WORDS.test(text)) return 'Lyric Graphic';
  if (BTS_WORDS.test(text)) return 'Behind the Scenes';
  if (LIVE_WORDS.test(text)) return 'Live';
  if (PRESS_WORDS.test(text)) return 'Press';
  return 'Promo';
}

const normalize = (s = '') => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Finds the release whose title (or a distinctive word from it) appears in the text.
export function guessRelease(text = '', releases = []) {
  const hay = normalize(text);
  if (!hay) return null;
  const scored = releases
    .map((r) => {
      const title = normalize(r.title);
      if (!title) return null;
      if (hay.includes(title)) return { r, score: title.length };
      const words = title.split(' ').filter((w) => w.length > 4);
      const hits = words.filter((w) => hay.includes(w)).length;
      return hits >= 2 ? { r, score: hits } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.r || null;
}

export function collectionLabel(release) {
  if (!release) return 'Unfiled';
  const kind = /album/i.test(release.release_type || '') ? 'Album' : 'Single';
  return `${release.title} · ${kind}`;
}