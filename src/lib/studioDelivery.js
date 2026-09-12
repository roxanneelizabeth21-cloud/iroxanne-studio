// Frontend-safe copy of rush-date logic used by contract forms.
// Mirrors base44/shared/studioDelivery.ts — keep in sync if the logic changes.

export const RUSH_TERMS = 'EXPEDITED PROJECT SCHEDULE\nThe target launch date is an expedited planning target. Work begins after the agreed deposit, content, and required access have been received. The client and iRoxanne Studio will agree on review dates and feedback deadlines before work starts. Delayed content, access, approvals, or changes to the agreed scope may move the launch date. Any additional fee or revised delivery date must be agreed in writing before the extra work proceeds. The payment, ownership, and revision provisions in the main agreement continue to apply.';

export function isRushDate(value, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const target = Date.parse(value + 'T00:00:00Z');
  const days = (target - today) / 86400000;
  return days >= 0 && days < 30;
}