import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

const ONESIGNAL_APP_ID = '207bf919-30c4-4afd-9c71-db07a4258f24';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const heading = body.heading || 'RoxSan Test Push';
    const message = body.message || 'This is a test notification from the RoxSan app.';

    const apiKey = secrets.get('ONESIGNAL_REST_API_KEY');
    if (!apiKey) return Response.json({ error: 'ONESIGNAL_REST_API_KEY not set' }, { status: 500 });

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        contents: { en: message },
        headings: { en: heading },
        included_segments: ['Subscribed Users'],
      }),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data?.errors || data }, { status: res.status });
    return Response.json({ ok: true, id: data.id, recipients: data.recipients });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}