import { base44 } from '@/api/base44Client';
import { pageUrl, defaultLinkTarget } from '@/lib/postLink';

// Shared helpers for the Marketing Content Suite UI.

export const PLATFORMS = ['Facebook', 'Instagram', 'YouTube', 'TikTok'];
export const FORMATS = ['Feed Post', 'Reel', 'Story', 'Short', 'Video', 'Community Post'];
export const POST_STATUSES = ['Draft', 'Pending Review', 'Approved', 'Ready', 'Scheduled', 'Publishing', 'Posted', 'Partially Published', 'Failed', 'Paused', 'Cancelled', 'Skipped'];
export const CAMPAIGN_STATUSES = ['Planning', 'Active', 'Completed', 'Archived'];

export const VIDEO_CONTENT_TYPES = ['Demo Loop', 'Countdown', 'Behind The Scenes', 'Announcement', 'Story Teaser', 'Performance Clip'];
export const SLOT_TYPES = ['text', 'clip', 'audio_cue', 'timestamp'];
export const CLIP_SOURCES = ['My Footage', 'Stock', 'Canva Export', 'Adobe Stock'];
export const ORIENTATIONS = ['Vertical 9:16', 'Horizontal', 'Square'];
export const CLIP_MOODS = ['Beach', 'Island', 'Worship', 'Sunset', 'Road', 'Rain', 'Studio', 'Hands', 'Silhouette', 'Nature', 'City', 'Celebration'];
export const CONTENT_BUCKETS = ['Loop Clip', 'Authentic/Personal', 'Announcement/CTA'];

export const isVideoFormat = (format) => ['Reel', 'Short', 'Video'].includes(format);

// Default image style presets seeded into the Brand Profile on first load.
export const DEFAULT_STYLE_PRESETS = [
  { name: 'Warm Film', prompt_suffix: 'shot on warm 35mm film, soft golden tones, gentle grain, natural light' },
  { name: 'Island Watercolor', prompt_suffix: 'soft watercolor painting, tropical palette, dreamy washes of teal and coral' },
  { name: 'Golden Hour Realism', prompt_suffix: 'photorealistic, golden hour sunlight, warm cinematic color grade' },
  { name: 'Minimalist Light', prompt_suffix: 'clean minimalist composition, soft neutral palette, abundant negative space' },
  { name: 'Vintage Country', prompt_suffix: 'faded vintage photograph, rustic warm tones, countryside film aesthetic' },
];

// Five starter video templates seeded into the Templates page on first load.
export const DEFAULT_TEMPLATES = [
  {
    name: 'Demo Loop',
    description: 'Short looping clip built around a screen recording of the app in action.',
    content_type: 'Demo Loop',
    target_length_seconds: 12,
    platforms: ['Instagram', 'YouTube', 'Facebook'],
    capcut_notes: 'Loop template: seamless end-to-start cut, on-screen text timed to the beat, text fades match.',
    slots: [
      { slot_name: 'hook_text_frame_one', type: 'text', instructions: 'Bold on-screen text for frame one — a result, a question, or a direct address to the viewer' },
      { slot_name: 'key_points', type: 'text', instructions: 'The 2–3 key features or moments to show on screen' },
      { slot_name: 'clip', type: 'clip', instructions: 'The screen recording / footage to drop in' },
      { slot_name: 'screen_start_timestamp', type: 'timestamp', instructions: 'Where the recording should start, e.g. "open the booking calendar, approx 0:03"' },
      { slot_name: 'screen_end_timestamp', type: 'timestamp', instructions: 'End time of the loop, e.g. "0:12"' },
      { slot_name: 'loop_note', type: 'text', instructions: 'How the loop should seam together' },
    ],
  },
  {
    name: 'Launch Countdown',
    description: 'Countdown post building to a project launch day.',
    content_type: 'Countdown',
    target_length_seconds: 10,
    platforms: ['Instagram', 'Facebook', 'YouTube'],
    capcut_notes: 'Countdown number template with beat drop at the reveal.',
    slots: [
      { slot_name: 'countdown_text', type: 'text', instructions: 'The countdown numbers / copy on screen' },
      { slot_name: 'hook_text', type: 'text', instructions: 'Frame-one bold text' },
      { slot_name: 'clip', type: 'clip', instructions: 'Footage behind the countdown' },
      { slot_name: 'audio_cue', type: 'audio_cue', instructions: 'Section + timestamp for the beat drop' },
    ],
  },
  {
    name: 'Behind the Build',
    description: 'Direct-to-camera, behind-the-scenes. Admin\'s own footage only.',
    content_type: 'Behind The Scenes',
    target_length_seconds: 25,
    platforms: ['Instagram', 'YouTube', 'Facebook'],
    capcut_notes: 'Talking-head template with b-roll cutaways and lower-third captions.',
    slots: [
      { slot_name: 'opening_line_text', type: 'text', instructions: 'Opening line to camera' },
      { slot_name: 'talking_points', type: 'text', instructions: '3 bullet talking points' },
      { slot_name: 'cta_text', type: 'text', instructions: 'Call to action at the end' },
    ],
  },
  {
    name: 'Launch Day',
    description: 'Launch-day announcement pushing the live project link.',
    content_type: 'Announcement',
    target_length_seconds: 15,
    platforms: ['Instagram', 'Facebook', 'YouTube'],
    capcut_notes: 'Announcement template with project-link overlay and screenshot reveal.',
    slots: [
      { slot_name: 'announcement_text', type: 'text', instructions: 'The announcement copy' },
      { slot_name: 'project_cta', type: 'text', instructions: 'Project-link call to action' },
      { slot_name: 'clip', type: 'clip', instructions: 'Footage for the announcement' },
      { slot_name: 'screen_start_timestamp', type: 'timestamp', instructions: 'Where the recording should start' },
    ],
  },
  {
    name: 'Feature Teaser',
    description: 'Quick story teaser built around a single feature highlight.',
    content_type: 'Story Teaser',
    target_length_seconds: 8,
    platforms: ['Instagram', 'YouTube', 'Facebook'],
    capcut_notes: 'Single-text overlay story template with quick cut.',
    slots: [
      { slot_name: 'single_highlight_text', type: 'text', instructions: 'The single feature line on screen' },
      { slot_name: 'clip', type: 'clip', instructions: 'Mood footage for the teaser' },
      { slot_name: 'screen_start_timestamp', type: 'timestamp', instructions: 'Where the recording should start' },
    ],
  },
];

export const PLATFORM_COLORS = {
  Facebook: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-500/30' },
  Instagram: { bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400', dot: 'bg-pink-500', border: 'border-pink-500/30' },
  YouTube: { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500', border: 'border-red-500/30' },
  TikTok: { bg: 'bg-slate-500/15', text: 'text-slate-700 dark:text-slate-200', dot: 'bg-slate-900', border: 'border-slate-500/30' },
};

export const STATUS_STYLES = {
  Draft: 'bg-muted text-muted-foreground',
  'Pending Review': 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  Ready: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Posted: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Approved: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  Scheduled: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  Publishing: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'Partially Published': 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  Failed: 'bg-destructive/15 text-destructive',
  Paused: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  Cancelled: 'bg-secondary text-muted-foreground line-through',
  Skipped: 'bg-secondary text-muted-foreground line-through',
};

export function platformColor(p) {
  return PLATFORM_COLORS[p] || PLATFORM_COLORS.Instagram;
}

export async function copyText(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  // Fallback for mobile / insecure contexts.
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.length <= 10 ? 'T00:00:00' : ''));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function weekRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return [start, end];
}

export function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const start = new Date(first);
  start.setDate(start.getDate() - startDay);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function postsByDate(posts) {
  const map = {};
  for (const p of posts) {
    if (!p.scheduled_date) continue;
    (map[p.scheduled_date] = map[p.scheduled_date] || []).push(p);
  }
  return map;
}

export function totalMetrics(posts) {
  return posts.reduce((acc, p) => {
    const m = p.manual_metrics || {};
    acc.views += Number(m.views) || 0;
    acc.likes += Number(m.likes) || 0;
    acc.comments += Number(m.comments) || 0;
    acc.shares += Number(m.shares) || 0;
    acc.saves += Number(m.saves) || 0;
    return acc;
  }, { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 });
}

// Learning loop: capture a StyleExample when a post transitions to Ready or Posted.
// Compares the AI's original_ai_caption to the admin-approved final caption.
export async function captureStyleExample(post, newStatus, finalCaption) {
  if (newStatus !== 'Ready' && newStatus !== 'Posted') return;
  if (!post || !post.original_ai_caption) return;
  const original = String(post.original_ai_caption).trim();
  const final = String(finalCaption || '').trim();
  if (!final) return;
  try {
    await base44.entities.StyleExample.create({
      post_id: post.id,
      platform: post.platform,
      original_caption: post.original_ai_caption,
      final_caption: final,
      was_edited: original !== final,
    });
    // Cap at the most recent 100 per platform; delete oldest beyond that.
    const all = await base44.entities.StyleExample.filter({ platform: post.platform }, '-created_date');
    if (all.length > 100) {
      const overflow = all.slice(100).map((e) => e.id);
      if (overflow.length) await base44.entities.StyleExample.deleteMany({ id: { $in: overflow } });
    }
  } catch {
    // Non-fatal — the save flow must not break if capture fails.
  }
}

// Build a human-readable CapCut assembly checklist from a template + its slot values.
export function assembleVideoBrief(template, slotValues) {
  if (!template) return '';
  const sv = slotValues || {};
  const lines = [`Open "${template.name}" in CapCut`];
  const slots = Array.isArray(template.slots) ? template.slots : [];
  for (const s of slots) {
    const v = sv[s.slot_name];
    if (v == null || v === '') continue;
    const label = s.slot_name.replace(/_/g, ' ');
    if (s.type === 'clip') lines.push(`drop in [${v}]`);
    else if (s.type === 'timestamp' || s.type === 'audio_cue') lines.push(`set audio to [${v}]`);
    else lines.push(`${label}: ${v}`);
  }
  lines.push('export 9:16');
  return lines.join(' → ');
}

// Append a style preset's suffix to an image prompt (without duplicating it).
export function applyStylePreset(imagePrompt, suffix) {
  const base = String(imagePrompt || '').trim();
  const suf = String(suffix || '').trim();
  if (!suf) return base;
  if (base && base.toLowerCase().includes(suf.toLowerCase())) return base;
  return base ? `${base}, ${suf}` : suf;
}

// Format a clip duration (seconds) as m:ss.
export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '';
  const s = Math.round(Number(seconds));
  if (isNaN(s)) return '';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Build a single paste-ready string: caption + hashtags + optional link.
// Used by the "Copy Everything" button on the Today view, Quick Create, and post editor.
export function buildPasteReady(post, link) {
  const parts = [];
  const cap = String(post?.caption || '').trim();
  const tags = String(post?.hashtags || '').trim();
  const l = link ? String(link).trim() : '';
  if (cap) parts.push(cap);
  if (tags) parts.push(tags);
  if (l) parts.push(l);
  return parts.join('\n\n').trim();
}

// Resolve the link to append at the bottom of a post for the service business:
// the portfolio page of the attached project, or the consult-booking page.
// Mirrors the backend portfolio link resolver used by publishPost/fillFirstComment.
export function resolvePostLink(post, portfolioItems) {
  const item = (portfolioItems || []).find((p) => p.id === post?.portfolio_item_id) || null;
  const target = post?.link_target || defaultLinkTarget(item);
  if (target === 'None') return '';
  return pageUrl(item, target) || '';
}