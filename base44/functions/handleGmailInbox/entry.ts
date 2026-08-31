// Gmail incoming-mail webhook handler.
// Triggered by the Gmail `mailbox` connector automation whenever new messages
// arrive in the synced inbox. We fetch each new message via the Gmail API and
// nudge the admin with a PUSH notification only.
//
// IMPORTANT: we must NEVER email the watched inbox — that created a feedback
// loop (each nudge email re-triggered the watch). We also skip our own nudge
// messages and anything sent from the watched address so a backlog can't loop.
//
// The platform pre-enriches the payload with data.new_message_ids — we do NOT
// track historyId ourselves.
//
// NOTE: the OneSignal REST call is inlined here (rather than imported from
// base44/shared/onesignal.ts) because this function is new and not yet
// externalized from the client bundle by the dev server — importing the shared
// helper (which uses `base44:runtime`) would break the client build. `base44:runtime`
// resolves fine inside a function entry file.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

const ONESIGNAL_APP_ID = '207bf919-30c4-4afd-9c71-db07a4258f24';

// Markers for our own nudge emails — used to detect & skip them.
const SELF_SUBJECT_PREFIX = '📬 ';
const SELF_SUBJECT_MARKER = 'new reply in your inbox';

async function sendPush(heading: string, message: string, url?: string) {
  const apiKey = secrets.get('ONESIGNAL_REST_API_KEY');
  if (!apiKey) return;
  try {
    const body: any = {
      app_id: ONESIGNAL_APP_ID,
      contents: { en: message },
      headings: { en: heading },
      included_segments: ['Subscribed Users'],
    };
    if (url) body.url = url;
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: { Authorization: `Basic ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // best-effort — never fail the webhook on a push error
  }
}

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const messageIds: string[] = body?.data?.new_message_ids ?? [];

  if (!messageIds.length) {
    return Response.json({ ok: true, processed: 0 });
  }

  // The watched inbox address = the admin's notify_email. Nudging on messages
  // from this address (our own sent mail / self-notifications) loops forever.
  let selfAddress = '';
  try {
    const [bp = null] = await base44.entities.BrandProfile.list();
    selfAddress = String(bp?.notify_email || '').trim().toLowerCase();
  } catch {}

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  const summaries: { from: string; subject: string }[] = [];
  for (const messageId of messageIds) {
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: authHeader }
      );
      if (!res.ok) continue;
      const msg = await res.json();
      const headers = Object.fromEntries(
        (msg.payload?.headers || []).map((h: any) => [h.name.toLowerCase(), h.value])
      );
      const from = headers['from'] || 'Unknown sender';
      const subject = headers['subject'] || '(no subject)';

      const fromLower = from.toLowerCase();
      const subjLower = subject.toLowerCase();
      const isSelfNudge =
        (selfAddress && fromLower.includes(selfAddress)) ||
        (subjLower.startsWith(SELF_SUBJECT_PREFIX) && subjLower.includes(SELF_SUBJECT_MARKER));
      if (isSelfNudge) continue;

      summaries.push({ from, subject });
    } catch {
      // skip individual failures — process the rest
    }
  }

  if (summaries.length) {
    const count = summaries.length;
    const heading = `📬 ${count} new reply${count > 1 ? 'ies' : ''} in your inbox`;
    const message = summaries
      .map((s) => `From: ${s.from}\nSubject: ${s.subject}`)
      .join('\n\n');

    // Push nudge only — never email the watched inbox.
    try {
      await sendPush(heading, message, 'https://mail.google.com');
    } catch {}
  }

  return Response.json({ ok: true, processed: summaries.length });
}