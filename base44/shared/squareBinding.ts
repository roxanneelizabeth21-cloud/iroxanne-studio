// Never infer an invoice from browser input or select an account's first payment.
export function assertSquareBinding(checkout: any, payment: any) {
  if (!payment?.id || payment.status !== 'COMPLETED' ||
      payment.order_id !== checkout.order_id ||
      payment.location_id !== checkout.location_id ||
      payment.amount_money?.currency !== checkout.currency ||
      Number(payment.amount_money?.amount) !== checkout.expected_amount_cents ||
      Number(payment.refunded_money?.amount || 0) !== 0)
    throw new Error('Square payment does not match the saved checkout; manual review required');
}
