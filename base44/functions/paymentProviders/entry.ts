import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Token-verified: tells the invoice page which payment providers are actually
// usable right now, so the client is never shown a button that leads to a 503.
//
// Stripe financing is gated on BOTH secrets, deliberately:
//   - STRIPE_SECRET_KEY alone could create a session, but with no
//     STRIPE_WEBHOOK_SECRET nothing would ever confirm the payment, so the
//     client would pay and the invoice would stay unpaid.
//   - Affirm/Afterpay are delayed-notification methods, which makes a working
//     webhook non-optional rather than merely preferable.
//
// It is gated on live keys as well: a test-mode checkout shown to a real client
// takes fake money and credits a real invoice. Test keys are honoured only on a
// base44 preview host, so the test run-through stays possible.
//
// Whether Affirm or Afterpay actually appear is still Stripe's call at
// checkout, based on the Dashboard's payment method settings, the amount, the
// currency and the buyer's eligibility. This only reports that the route is
// open.
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

    const stripeKey = secrets.get('STRIPE_SECRET_KEY') || '';
    const stripeHook = secrets.get('STRIPE_WEBHOOK_SECRET') || '';
    const configured = !!stripeKey && !!stripeHook;

    // Surfaced so the admin can tell "not set up" from "set up in test mode"
    // without exposing any key material.
    const stripeMode = !stripeKey ? 'unset' : stripeKey.startsWith('sk_live_') ? 'live' : 'test';

    // Financing is hidden from real clients until the keys are live. Test keys
    // still work on a base44 preview host so the test-mode run-through
    // (successful payment, decline, abandonment, duplicate webhook) is possible
    // without ever showing a test-mode checkout on iroxannestudio.com.
    let onPreviewHost = false;
    try {
      onPreviewHost = /(^|\.)base44\.(app|com)$/i.test(new URL(req.url).hostname);
    } catch {
      onPreviewHost = false;
    }
    const financing = configured && (stripeMode === 'live' || onPreviewHost);

    return Response.json({
      square,
      stripe: configured,
      financing,
      stripe_mode: stripeMode,
      stripe_blocked_reason: financing
        ? null
        : !stripeKey
          ? 'STRIPE_SECRET_KEY is not set'
          : !stripeHook
            ? 'STRIPE_WEBHOOK_SECRET is not set — payments could not be confirmed'
            : 'Stripe is in test mode; financing stays hidden on the live site until live keys are set',
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
