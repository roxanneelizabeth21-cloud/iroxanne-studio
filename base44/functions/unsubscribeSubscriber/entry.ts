import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public unsubscribe endpoint used by the link at the bottom of every
// subscriber email. Requires both email and the per-subscriber unsubscribe_token
// so anonymous callers cannot opt arbitrary addresses out of the list.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = (body?.email || '').toString().trim().toLowerCase();
    const token = (body?.token || '').toString().trim();
    if (!email || !token || token.length < 32) {
      return Response.json({ error: 'An email and valid unsubscribe token are required' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.Subscriber.filter({ email, unsubscribe_token: token });
    if (existing.length === 0) {
      // Already gone / token mismatch / never subscribed — report calm found:false so callers cannot probe the list.
      return Response.json({ unsubscribed: true, found: false });
    }

    await base44.asServiceRole.entities.Subscriber.update(existing[0].id, { status: 'unsubscribed' });
    return Response.json({ unsubscribed: true, found: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}