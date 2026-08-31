// Shared configuration + draft persistence for the guided Create Post workflow.
// One in-progress MarketingPost record is reused for the whole wizard — the
// local snapshot only remembers which record that is and where the owner was.

export const POST_GOALS = [
  'Showcase a project',
  'Share a tech tip',
  'Share a client win',
  'Book a consult',
  'Build brand awareness',
  'Announce a new service',
  'Custom goal',
];

export const ASPECT_OPTIONS = [
  { value: '4:5', label: 'Feed portrait', hint: '4:5', format: 'Feed Post' },
  { value: '1:1', label: 'Square', hint: '1:1', format: 'Feed Post' },
  { value: '9:16', label: 'Story or Reel', hint: '9:16', format: 'Reel' },
];

export function formatForAspect(aspect) {
  return ASPECT_OPTIONS.find((a) => a.value === aspect)?.format || 'Feed Post';
}

export const STEPS = [
  { key: 'subject', label: 'Subject' },
  { key: 'media', label: 'Media' },
  { key: 'copy', label: 'Copy' },
  { key: 'review', label: 'Review' },
];

// Only the active draft's ID is kept locally — never post content. The
// MarketingPost record is the single source of truth for the whole wizard.
const KEY = 'iroxanne_create_post_draft_id';

export const EMPTY_DRAFT = {
  portfolioItemId: '',
  campaignId: '',
  goal: '',
  customGoal: '',
  instruction: '',
  aspect: '4:5',
  platformIds: ['instagram', 'facebook'],
  link: '',
  copyReady: false,
  reviewRecommended: false,
};

export function loadActiveDraftId() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('draft');
    if (fromUrl) return fromUrl;
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function setActiveDraftId(id) {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch { /* storage unavailable — the ?draft= parameter still carries the ID */ }
  try {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('draft', id);
    else url.searchParams.delete('draft');
    window.history.replaceState(window.history.state, '', url.toString());
  } catch { /* ignore */ }
}

export function clearActiveDraftId() {
  setActiveDraftId('');
}

const PUBLISHABLE = ['instagram', 'facebook'];
const ID_BY_ENTITY = { Instagram: 'instagram', Facebook: 'facebook', TikTok: 'tiktok', YouTube: 'youtube' };

// Rebuild the wizard's working state from the saved record.
export function draftFromPost(post) {
  const s = post?.create_post_state || {};
  const targets = (post?.publish_targets || []).map((v) => ID_BY_ENTITY[v]).filter(Boolean);
  const primary = ID_BY_ENTITY[post?.platform];
  const platformIds = s.platformIds?.length
    ? s.platformIds
    : (targets.length ? targets : (primary ? [primary] : EMPTY_DRAFT.platformIds));
  return {
    ...EMPTY_DRAFT,
    ...s,
    platformIds,
    portfolioItemId: post?.portfolio_item_id || s.portfolioItemId || '',
    campaignId: post?.campaign_id || s.campaignId || '',
    aspect: post?.requested_aspect_ratio || EMPTY_DRAFT.aspect,
  };
}

// The canonical fields + wizard-only state a draft change should persist.
export function postPatchFromDraft(draft, step, maxStep) {
  const publishable = (draft.platformIds || []).filter((p) => PUBLISHABLE.includes(p));
  return {
    portfolio_item_id: draft.portfolioItemId || '',
    campaign_id: draft.campaignId || '',
    platform: entityPlatform(draft.platformIds?.[0]) || 'Instagram',
    publish_targets: publishable.map(entityPlatform),
    format: formatForAspect(draft.aspect),
    requested_aspect_ratio: draft.aspect,
    create_post_step: step,
    create_post_state: {
      portfolioItemId: draft.portfolioItemId || '',
      campaignId: draft.campaignId || '',
      goal: draft.goal || '',
      customGoal: draft.customGoal || '',
      instruction: draft.instruction || '',
      platformIds: draft.platformIds || [],
      link: draft.link || '',
      copyReady: !!draft.copyReady,
      reviewRecommended: !!draft.reviewRecommended,
      maxStep: Math.max(maxStep || 0, step || 0),
    },
    description: `Goal: ${effectiveGoal(draft)}${draft.instruction ? ` | Note: ${draft.instruction}` : ''}`.slice(0, 1000),
  };
}

function entityPlatform(id) {
  const map = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube' };
  return map[id] || '';
}

// A draft the owner never finished — safe to offer for resuming.
export function isResumableDraft(post) {
  return !!post && post.status === 'Draft' && !post.posted_at;
}

// The goal the owner actually chose, in plain words.
export function effectiveGoal(draft) {
  return draft.goal === 'Custom goal' ? (draft.customGoal || '').trim() : draft.goal;
}

// The instruction string handed to the existing quickCreate generator.
export function generationNote(draft, link) {
  const parts = [];
  const goal = effectiveGoal(draft);
  if (goal) parts.push(`Goal of this post: ${goal}.`);
  if (draft.instruction?.trim()) parts.push(draft.instruction.trim());
  if (link) parts.push(`Use this exact call-to-action link, unchanged: ${link}`);
  else parts.push('No campaign link is saved — do not invent or include any URL or [Link] placeholder.');
  return parts.join(' ');
}