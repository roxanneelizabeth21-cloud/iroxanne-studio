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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Markers for our own nudge emails — used to detect & skip them.
const SELF_SUBJECT_PREFIX = '📬 ';
const SELF_SUBJECT_MARKER = 'new reply in your inbox';

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const actor = await base44.auth.me().catch(() => null);
  if (!actor || (actor.role !== 'admin' && actor.is_service !== true)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const rawIds = Array.isArray(body?.data?.new_message_ids) ? body.data.new_message_ids : [];
  const messageIds: string[] = rawIds
    .filter((id: any) => typeof id === 'string' && /^[a-zA-Z0-9_-]{4,64}$/.test(id))
    .slice(0, 20);

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

  return Response.json({ ok: true, processed: summaries.length, summaries });
}