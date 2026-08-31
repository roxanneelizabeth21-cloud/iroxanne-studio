// Admin-editable email copy. Every automated email the app sends gets its
// subject + body text from here: the saved EmailTemplate record when the admin
// has edited it, otherwise the built-in default below. A blank saved field
// always falls back to the default, so an empty template can never send an
// empty email.
import { brandedEmail, brandButton } from './emailBrand.ts';

export const SITE_URL = 'https://iroxanne.com';

export type TemplateDef = {
  key: string;
  name: string;
  description: string;
  audience: string;
  body_label: string;
  merge_fields: { field: string; note: string }[];
  subject: string;
  body: string;
};

export const TEMPLATE_DEFS: TemplateDef[] = [
  {
    key: 'fan_welcome',
    name: 'Fan Welcome / Confirmation',
    description: 'Sent to a fan right after they subscribe on any page (release pages, /go capture pages, newsletter). Sent once per fan.',
    audience: 'The fan who just subscribed',
    body_label: 'Email body — one paragraph per blank line. A “Read & Listen” button and unsubscribe link are added automatically.',
    merge_fields: [
      { field: '{fan_name}', note: "The fan's first name, or “there” when they didn't give one" },
      { field: '{email}', note: "The fan's email address" },
      { field: '{site_url}', note: 'Your public site link' },
      { field: '{music_url}', note: 'Link to your Music page' },
    ],
    subject: 'Welcome to the Roxsan mailing list',
    body: `Hi {fan_name},

Thank you for joining the Roxsan mailing list. It means a lot to have you here.

Here's what you can expect from me: new music the moment it drops, and the occasional story I only share with this list. No spam, and never more than you'd want.

Want the story behind the songs? Every release page has a "Behind the Song" section — come read the story and listen to the latest.

Talk soon,
Roxsan`,
  },
  {
    key: 'admin_new_subscriber',
    name: 'New Fan Subscriber Alert',
    description: 'Sent to you the moment someone subscribes anywhere on the site. The subscriber detail table is added automatically below your text.',
    audience: 'You (admin)',
    body_label: 'Intro line shown above the subscriber details.',
    merge_fields: [
      { field: '{email}', note: "The new subscriber's email" },
      { field: '{name}', note: 'Their name, or — when blank' },
      { field: '{source}', note: 'Release slug or “newsletter”' },
      { field: '{utm}', note: 'UTM source / medium / campaign' },
      { field: '{signed_up}', note: 'When they signed up' },
    ],
    subject: 'New Fan Subscriber — {email}',
    body: 'A new fan just subscribed on the Roxsan site.',
  },
  {
    key: 'admin_new_inquiry',
    name: 'New Contact Inquiry',
    description: 'Sent to you when someone submits the website contact form. Their details and full message are added automatically below your text.',
    audience: 'You (admin) — replying goes straight back to the fan',
    body_label: 'Intro line shown above the inquiry details.',
    merge_fields: [
      { field: '{name}', note: 'Name they entered' },
      { field: '{email}', note: 'Their email address' },
      { field: '{inquiry_type}', note: 'Inquiry type they picked' },
      { field: '{message_subject}', note: 'Subject line they entered' },
      { field: '{submitted}', note: 'When the form was submitted' },
    ],
    subject: 'New Fan Inquiry — {message_subject}',
    body: 'You received a new message from the Roxsan website contact form.',
  },
  {
    key: 'admin_daily_posts',
    name: 'Daily Posts Due',
    description: "Sent to you each morning when marketing posts are scheduled for that day. The list of posts is added automatically below your text.",
    audience: 'You (admin)',
    body_label: 'Intro line shown above the list of today’s posts.',
    merge_fields: [
      { field: '{count}', note: 'How many posts are due today' },
      { field: '{plural}', note: '“s” when there is more than one post' },
      { field: '{date}', note: "Today's date" },
    ],
    subject: 'You have {count} post{plural} today',
    body: "Today, {date} — here's what's queued to post:",
  },
  {
    key: 'admin_post_time',
    name: 'Post Time Reminder',
    description: "Sent to you at a post's scheduled time as a nudge that it's time to post. The list of posts is added automatically below your text.",
    audience: 'You (admin)',
    body_label: 'Intro line shown above the list of posts going live now.',
    merge_fields: [
      { field: '{count}', note: 'How many posts are due in this window' },
      { field: '{plural}', note: '“s” when there is more than one post' },
      { field: '{date}', note: "Today's date" },
      { field: '{time}', note: 'The scheduled time window' },
    ],
    subject: "It's time to post ({count})",
    body: "It's time to post — {date} {time}:",
  },
  {
    key: 'admin_weekly_digest',
    name: 'Weekly Marketing Digest',
    description: 'Sent to you weekly with last week’s completed posts and the week ahead. The summary rows are added automatically below your text.',
    audience: 'You (admin)',
    body_label: 'Intro line shown above the weekly summary.',
    merge_fields: [
      { field: '{week_start}', note: 'Start of the reporting range' },
      { field: '{week_end}', note: 'End of the reporting range' },
      { field: '{completed_count}', note: 'Posts completed last week' },
      { field: '{scheduled_count}', note: 'Posts scheduled this week' },
    ],
    subject: 'Weekly marketing digest',
    body: "A snapshot of last week and what's ahead ({week_start} → {week_end}).",
  },
  {
    key: 'admin_release_countdown',
    name: 'Release Countdown',
    description: 'Sent to you 14, 7, 3 and 1 days before a release date. The per-release status rows are added automatically below your text.',
    audience: 'You (admin)',
    body_label: 'Intro line shown above the countdown details.',
    merge_fields: [
      { field: '{date}', note: "Today's date" },
      { field: '{count}', note: 'How many releases are in a countdown window' },
    ],
    subject: 'Release countdown update',
    body: 'Where each upcoming release stands today, {date}.',
  },
  {
    key: 'admin_publish_failed',
    name: 'Auto-Publish Failure Alert',
    description: 'Sent to you when an auto-scheduled post fails to publish to Facebook or Instagram. The failing posts and their errors are added automatically below your text.',
    audience: 'You (admin)',
    body_label: 'Intro line shown above the failed posts.',
    merge_fields: [
      { field: '{count}', note: 'How many posts failed' },
      { field: '{plural}', note: '“s” when more than one failed' },
    ],
    subject: '{count} auto-publish{plural} failed',
    body: 'These posts stayed in Ready so you can fix the issue and publish manually or retry:',
  },
  {
    key: 'admin_filming_nudge',
    name: 'Monthly Filming Nudge',
    description: 'Sent to you monthly with an AI-generated shot list for one filming session. The shot briefs are added automatically below your text.',
    audience: 'You (admin)',
    body_label: 'Intro line shown above the shot list.',
    merge_fields: [
      { field: '{count}', note: 'How many shots are in the list' },
    ],
    subject: "This month's filming list — one sitting, ~1 hour",
    body: 'One sitting, ~1 hour. Film these, then drop the clips into the Clip Library — the auto-generator will match them to posts for you.',
  },
];

export function defForKey(key: string): TemplateDef | null {
  return TEMPLATE_DEFS.find((d) => d.key === key) || null;
}

// Replaces {merge_field} tokens. Unknown or empty values render as an empty
// string so a stray token never leaks braces into a real email.
export function fillTokens(text: string, vars: Record<string, any>): string {
  return String(text || '').replace(/\{(\w+)\}/g, (_m, k) => {
    const v = vars ? vars[k] : undefined;
    return v == null ? '' : String(v);
  });
}

// Loads a template's effective subject/body: saved value when non-blank,
// otherwise the built-in default.
export async function loadTemplate(base44: any, key: string) {
  const def = defForKey(key);
  if (!def) throw new Error(`Unknown email template: ${key}`);
  let rec: any = null;
  try {
    const list = await base44.asServiceRole.entities.EmailTemplate.filter({ key });
    rec = list && list[0] ? list[0] : null;
  } catch {
    rec = null;
  }
  const savedSubject = String(rec?.subject || '').trim();
  const savedBody = String(rec?.body || '').trim();
  return {
    def,
    subject: savedSubject || def.subject,
    body: savedBody || def.body,
    usedDefaultSubject: !savedSubject,
    usedDefaultBody: !savedBody,
  };
}

// Loads + merges in one step. Returns the final subject and body text.
export async function renderTemplate(base44: any, key: string, vars: Record<string, any>) {
  const t = await loadTemplate(base44, key);
  return {
    def: t.def,
    subject: fillTokens(t.subject, vars).trim() || fillTokens(t.def.subject, vars),
    text: fillTokens(t.body, vars).trim() || fillTokens(t.def.body, vars),
  };
}

export function textToHtmlParagraphs(text: string): string {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

// Wraps admin-authored fan copy in the branded Roxsan shell, with the
// Read & Listen button and unsubscribe footer appended.
export function fanEmailHtml(text: string, unsubscribeLink: string): string {
  return brandedEmail({
    content: `${textToHtmlParagraphs(text)}
<p style="margin:24px 0 0;">${brandButton('Read & Listen', `${SITE_URL}/music`)}</p>`,
    footerNote: `You're receiving this because you signed up at <a href="${SITE_URL}" style="color:#8B8B85;">iroxanne.com</a>.<br>
<a href="${unsubscribeLink}" style="color:#8B8B85;text-decoration:underline;">Unsubscribe</a>`,
  });
}