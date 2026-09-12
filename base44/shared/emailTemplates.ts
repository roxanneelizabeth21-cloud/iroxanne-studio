// Admin-editable email copy. Every automated email the app sends gets its
// subject + body text from here: the saved EmailTemplate record when the admin
// has edited it, otherwise the built-in default below. A blank saved field
// always falls back to the default, so an empty template can never send an
// empty email.
import { brandedEmail, brandButton } from './emailBrand.ts';

export const SITE_URL = 'https://iroxannestudio.com';

export type TemplateDef = { key: string; name: string; description: string; audience: string; body_label: string; merge_fields: { field: string; note: string }[]; subject: string; body: string; };

export const TEMPLATE_DEFS: TemplateDef[] = [
  { key: 'fan_welcome', name: 'Subscriber Welcome / Confirmation', description: 'Sent to a subscriber right after they join the list (newsletter or any capture page). Sent once per subscriber.', audience: 'The subscriber who just joined', body_label: 'Email body \u2014 one paragraph per blank line. A \u201cBook a consult\u201d button and unsubscribe link are added automatically.', merge_fields: [{ field: '{fan_name}', note: "The subscriber's first name, or \u201cthere\u201d when they didn't give one" }, { field: '{email}', note: "The subscriber's email address" }, { field: '{site_url}', note: 'Your public site link' }], subject: 'Welcome to the iRoxanne Studio list', body: `Hi {fan_name},\n\nThanks for joining the iRoxanne Studio list \u2014 glad to have you here.\n\nHere's what you'll get from me: notes on apps I'm building, the occasional behind-the-build story, and first looks at new work. No spam, and never more than you'd want.\n\nIf you've got an idea you're thinking about building, you can always book a free consult from the link below.\n\nTalk soon,\niRoxanne Studio` },
  { key: 'admin_new_subscriber', name: 'New Subscriber Alert', description: 'Sent to you the moment someone subscribes anywhere on the site. The subscriber detail table is added automatically below your text.', audience: 'You (admin)', body_label: 'Intro line shown above the subscriber details.', merge_fields: [{ field: '{email}', note: "The new subscriber's email" }, { field: '{name}', note: 'Their name, or \u2014 when blank' }, { field: '{source}', note: 'Capture slug or "newsletter"' }, { field: '{utm}', note: 'UTM source / medium / campaign' }, { field: '{signed_up}', note: 'When they signed up' }], subject: 'New Subscriber \u2014 {email}', body: 'A new subscriber just joined the iRoxanne Studio list.' },
  { key: 'admin_new_inquiry', name: 'New Contact Inquiry', description: 'Sent to you when someone submits the website contact form. Their details and full message are added automatically below your text.', audience: 'You (admin) \u2014 replying goes straight back to the inquirer', body_label: 'Intro line shown above the inquiry details.', merge_fields: [{ field: '{name}', note: 'Name they entered' }, { field: '{email}', note: 'Their email address' }, { field: '{inquiry_type}', note: 'Inquiry type they picked' }, { field: '{message_subject}', note: 'Subject line they entered' }, { field: '{submitted}', note: 'When the form was submitted' }], subject: 'New Inquiry \u2014 {message_subject}', body: 'You received a new message from the iRoxanne Studio website contact form.' },
  { key: 'admin_daily_posts', name: 'Daily Posts Due', description: "Sent to you each morning when marketing posts are scheduled for that day. The list of posts is added automatically below your text.", audience: 'You (admin)', body_label: "Intro line shown above the list of today\u2019s posts.", merge_fields: [{ field: '{count}', note: 'How many posts are due today' }, { field: '{plural}', note: '"s" when there is more than one post' }, { field: '{date}', note: "Today's date" }], subject: 'You have {count} post{plural} today', body: "Today, {date} \u2014 here's what's queued to post:" },
  { key: 'admin_post_time', name: 'Post Time Reminder', description: "Sent to you at a post's scheduled time as a nudge that it's time to post. The list of posts is added automatically below your text.", audience: 'You (admin)', body_label: 'Intro line shown above the list of posts going live now.', merge_fields: [{ field: '{count}', note: 'How many posts are due in this window' }, { field: '{plural}', note: '"s" when there is more than one post' }, { field: '{date}', note: "Today's date" }, { field: '{time}', note: 'The scheduled time window' }], subject: "It's time to post ({count})", body: "It's time to post \u2014 {date} {time}:" },
  { key: 'admin_weekly_digest', name: 'Weekly Marketing Digest', description: "Sent to you weekly with last week\u2019s completed posts and the week ahead. The summary rows are added automatically below your text.", audience: 'You (admin)', body_label: 'Intro line shown above the weekly summary.', merge_fields: [{ field: '{week_start}', note: 'Start of the reporting range' }, { field: '{week_end}', note: 'End of the reporting range' }, { field: '{completed_count}', note: 'Posts completed last week' }, { field: '{scheduled_count}', note: 'Posts scheduled this week' }], subject: 'Weekly marketing digest', body: "A snapshot of last week and what's ahead ({week_start} \u2192 {week_end})." },
  { key: 'admin_release_countdown', name: 'Launch Countdown', description: 'Sent to you 14, 7, 3 and 1 days before a campaign launch date. The per-project status rows are added automatically below your text.', audience: 'You (admin)', body_label: 'Intro line shown above the countdown details.', merge_fields: [{ field: '{date}', note: "Today's date" }, { field: '{count}', note: 'How many projects are in a countdown window' }], subject: 'Launch countdown update', body: 'Where each upcoming launch stands today, {date}.' },
  { key: 'admin_publish_failed', name: 'Auto-Publish Failure Alert', description: 'Sent to you when an auto-scheduled post fails to publish to Facebook or Instagram. The failing posts and their errors are added automatically below your text.', audience: 'You (admin)', body_label: 'Intro line shown above the failed posts.', merge_fields: [{ field: '{count}', note: 'How many posts failed' }, { field: '{plural}', note: '"s" when more than one failed' }], subject: '{count} auto-publish{plural} failed', body: 'These posts stayed in Ready so you can fix the issue and publish manually or retry:' },
  { key: 'admin_filming_nudge', name: 'Monthly Filming Nudge', description: 'Sent to you monthly with an AI-generated shot list for one filming session. The shot briefs are added automatically below your text.', audience: 'You (admin)', body_label: 'Intro line shown above the shot list.', merge_fields: [{ field: '{count}', note: 'How many shots are in the list' }], subject: "This month's filming list \u2014 one sitting, ~1 hour", body: 'One sitting, ~1 hour. Film these, then drop the clips into the Clip Library \u2014 the auto-generator will match them to posts for you.' },
];

export function defForKey(key: string): TemplateDef | null { return TEMPLATE_DEFS.find((d) => d.key === key) || null; }

export function fillTokens(text: string, vars: Record<string, any>): string {
  return String(text || '').replace(/\{(\w+)\}/g, (_m, k) => { const v = vars ? vars[k] : undefined; return v == null ? '' : String(v); });
}

export async function loadTemplate(base44: any, key: string) {
  const def = defForKey(key);
  if (!def) throw new Error(`Unknown email template: ${key}`);
  let rec: any = null;
  try { const list = await base44.asServiceRole.entities.EmailTemplate.filter({ key }); rec = list && list[0] ? list[0] : null; } catch { rec = null; }
  const savedSubject = String(rec?.subject || '').trim();
  const savedBody = String(rec?.body || '').trim();
  return { def, subject: savedSubject || def.subject, body: savedBody || def.body, usedDefaultSubject: !savedSubject, usedDefaultBody: !savedBody };
}

export async function renderTemplate(base44: any, key: string, vars: Record<string, any>) {
  const t = await loadTemplate(base44, key);
  return { def: t.def, subject: fillTokens(t.subject, vars).trim() || fillTokens(t.def.subject, vars), text: fillTokens(t.body, vars).trim() || fillTokens(t.def.body, vars) };
}

export function textToHtmlParagraphs(text: string): string {
  return String(text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p style="margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`).join('\n');
}

export function subscriberEmailHtml(text: string, unsubscribeLink: string): string {
  return brandedEmail({ content: `${textToHtmlParagraphs(text)}\n<p style="margin:24px 0 0;">${brandButton('Book a consult', `${SITE_URL}/consult`)}</p>`, footerNote: `You're receiving this because you signed up at <a href="${SITE_URL}" style="color:#8B7B95;">iroxannestudio.com</a>.<br>\n<a href="${unsubscribeLink}" style="color:#8B7B95;text-decoration:underline;">Unsubscribe</a>` });
}
