// Shared fan-email helpers: the public site origin used in fan-facing links and
// the sender identity. The welcome email copy itself lives in the
// admin-editable template registry (shared/emailTemplates.ts).

export const SITE_URL = 'https://iroxanne.com';
export const FROM_NAME = 'Roxsan Music';

export function unsubscribeUrl(email: string): string {
  return `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
}