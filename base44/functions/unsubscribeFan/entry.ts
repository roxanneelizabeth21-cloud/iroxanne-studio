import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public unsubscribe endpoint used by the link at the bottom of every fan email.
// Runs as service role so an anonymous visitor can opt themselves out even
// though FanSubscriber read/update is admin-only.
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
    if (!email) {
      return Response.json({ error: 'An email is required' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.FanSubscriber.filter({ email });
    if (existing.length === 0) {
      // Already gone / never subscribed — report success so the page is calm.
      return Response.json({ unsubscribed: true, found: false });
    }

    await base44.asServiceRole.entities.FanSubscriber.update(existing[0].id, { status: 'unsubscribed' });
    return Response.json({ unsubscribed: true, found: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}