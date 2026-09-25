import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const { id, token } = await req.json().catch(() => ({}));
    if (!id || !token) return Response.json({ error: 'Missing invoice id or token' }, { status: 400 });

    let invoice: any;
    try {
      invoice = await base44.asServiceRole.entities.Invoice.get(id);
    } catch {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (invoice.access_token !== token) return Response.json({ error: 'Invalid or expired link' }, { status: 403 });

    // Square: the connector has to be connected and returning a token.
    let square = false;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('square');
      square = !!conn?.accessToken;
    } catch {
      square = false;
    }

    return Response.json({ square, financing: false });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}