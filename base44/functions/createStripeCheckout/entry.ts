// Stripe has been retired from iRoxanne Studio. Preserve this endpoint so old
// clients cannot start checkouts or mutate the payment ledger.
export default async function () {
  return Response.json({ error: 'Stripe payments are no longer supported. Please use the Square payment link on your invoice.' }, { status: 410 });
}
