// Shared vocabulary for filing media into collections (projects) and
// asset kinds (Cover Art, Promo, Live…), plus best-guess matching by title.
export const MEDIA_CATEGORIES = [
  'Cover Art',
  'Promo',
  'Live',
  'Behind the Scenes',
  'Press',
  'Other',
];

const COVER_WORDS = /(cover|artwork|album art|single art|screenshot|ui)/i;
const LIVE_WORDS = /(live|stage|concert|performance|show|demo)/i;
const BTS_WORDS = /(behind the scenes|bts|studio|rehearsal|build)/i;
const PRESS_WORDS = /(press|headshot|epk|photoshoot)/i;

export function guessCategory(text = '') {
  if (COVER_WORDS.test(text)) return 'Cover Art';
  if (BTS_WORDS.test(text)) return 'Behind the Scenes';
  if (LIVE_WORDS.test(text)) return 'Live';
  if (PRESS_WORDS.test(text)) return 'Press';
  return 'Promo';
}