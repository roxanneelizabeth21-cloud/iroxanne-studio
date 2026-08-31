// Shared OneSignal Web Push helper for the Marketing Content Suite reminder
// functions. Sends a push to every subscribed device (the admin's phones /
// browsers) using the Subscribed Users segment.
//
// OneSignal REST API key is read from app secrets (ONESIGNAL_REST_API_KEY).
// App ID is the RoxSan OneSignal app (Typical Site, v16 SDK).
//
// NOTE: this module never references `base44:runtime`. Each calling function
// imports `secrets` itself and passes apiKey in.

const ONESIGNAL_APP_ID = '207bf919-30c4-4afd-9c71-db07a4258f24';

export async function sendPush(opts: {
  heading: string;
  message: string;
  url?: string;
  apiKey?: string;
}): Promise<{ ok: boolean; id?: string; recipients?: number; error?: string }> {
  // The caller reads ONESIGNAL_REST_API_KEY from `base44:runtime` and passes it
  // in: that backend-only specifier must not appear in this shared module,
  // because the client bundler scans base44/shared and cannot resolve it.
  const apiKey = opts.apiKey;
  if (!apiKey) return { ok: false, error: 'ONESIGNAL_REST_API_KEY not set' };
  try {
    const body: any = {
      app_id: ONESIGNAL_APP_ID,
      contents: { en: opts.message },
      headings: { en: opts.heading },
      included_segments: ['Subscribed Users'],
    };
    if (opts.url) body.url = opts.url;
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: { Authorization: `Basic ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: JSON.stringify(data?.errors || data) };
    return { ok: true, id: data.id, recipients: data.recipients };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}