// Shared Gmail raw-message builder used by the email-notification backend
// functions (sendContactNotification, sendSubscriberNotification, …).
// Plain module — no Deno.serve. Import the helpers and call sendGmail().

export function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binString = '';
  for (const byte of bytes) binString += String.fromCharCode(byte);
  return btoa(binString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function stripNewlines(value: unknown): string {
  return String(value == null ? '' : value).replace(/[\r\n]+/g, ' ').trim();
}

// html: true sends the body as text/html so branded shells render.
function buildRawEmail({ to, replyTo, fromName, subject, body, html }) {
  const safeTo = stripNewlines(to);
  const safeReplyTo = stripNewlines(replyTo);
  const encodedSubject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(stripNewlines(subject))))}?=`;
  const encodedBody = btoa(unescape(encodeURIComponent(body)));
  const headers = [
    `To: ${safeTo}`,
    `From: ${stripNewlines(fromName)} <${safeTo}>`,
    safeReplyTo ? `Reply-To: ${safeReplyTo}` : null,
    `Subject: ${encodedSubject}`,
    `Content-Type: ${html ? 'text/html' : 'text/plain'}; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    `MIME-Version: 1.0`,
  ].filter(Boolean);
  return base64UrlEncode(headers.join('\r\n') + '\r\n\r\n' + encodedBody);
}

// Resolves the admin's own Gmail address from the connected gmail connector,
// builds a raw RFC822 message, and sends it. Returns { messageId, toEmail }.
export async function sendGmail(base44, { fromName, subject, body, replyTo, html }) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

  const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json();
  const toEmail = profile.emailAddress;

  const rawMessage = buildRawEmail({ to: toEmail, replyTo, fromName, subject, body, html });

  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawMessage }),
  });
  const result = await sendRes.json();
  return { messageId: result.id, toEmail };
}