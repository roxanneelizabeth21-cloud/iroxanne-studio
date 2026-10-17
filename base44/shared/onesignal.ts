// Shared OneSignal Web Push helper for the Marketing Content Suite reminder
// functions. Sends a push to every subscribed device (the admin's phones /
// browsers) using the Subscribed Users segment.
//
// OneSignal REST API key is read from app secrets (ONESIGNAL_REST_API_KEY).
// App ID is the iRoxanne Studio OneSignal app (Typical Site, v16 SDK).
//
// NOTE: this module never references `base44:runtime`. Each calling function
// imports `secrets` itself and passes apiKey in.

export async function sendPush(opts: {
  heading: string;
  message: string;
  url?: string;
  apiKey?: string;
  appId?: string;
}): Promise<{ ok: boolean; id?: string; recipients?: number; error?: string }> {
  // The caller reads ONESIGNAL_REST_API_KEY from `base44:runtime` and passes it
  // in: that backend-only specifier must not appear in this shared module,
  // because the client bundler scans base44/shared and cannot resolve it.
  const apiKey = opts.apiKey;
  const appId = String(opts.appId || '').trim();
  if (!apiKey) return { ok: false, error: 'ONESIGNAL_REST_API_KEY not set' };
  if (!appId) return { ok: false, error: 'onesignal_app_id not configured on BrandProfile' };
  try {
    const body: any = {
      app_id: appId,
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