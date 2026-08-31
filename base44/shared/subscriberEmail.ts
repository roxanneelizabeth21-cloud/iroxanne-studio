// Shared subscriber-email helpers: the public site origin used in
// subscriber-facing links and the sender identity. The welcome email copy
// itself lives in the admin-editable template registry
// (shared/emailTemplates.ts).

export const SITE_URL = 'https://iroxanne.com';
export const FROM_NAME = 'iRoxanne Studio';

export function unsubscribeUrl(email: string): string {
  return `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
}