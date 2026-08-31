// Shared vocabulary for filing media into collections (projects) and
// asset kinds (Screenshot, Promo, Demo…), plus best-guess matching by title.
export const MEDIA_CATEGORIES = [
  'Screenshot',
  'Promo',
  'Demo',
  'Behind the Scenes',
  'Press',
  'Other',
];

const COVER_WORDS = /(cover|artwork|screenshot|ui)/i;
const LIVE_WORDS = /(demo|stage|show|performance)/i;
const BTS_WORDS = /(behind the scenes|bts|studio|rehearsal|build)/i;
const PRESS_WORDS = /(press|headshot|epk|photoshoot)/i;

export function guessCategory(text = '') {
  if (COVER_WORDS.test(text)) return 'Screenshot';
  if (BTS_WORDS.test(text)) return 'Behind the Scenes';
  if (LIVE_WORDS.test(text)) return 'Demo';
  if (PRESS_WORDS.test(text)) return 'Press';
  return 'Promo';
}