import { CANONICAL_URL } from './studioUrl.ts';
// Shared subscriber-email helpers: the public site origin used in
// subscriber-facing links and the sender identity. The welcome email copy
// itself lives in the admin-editable template registry
// (shared/emailTemplates.ts).

export const SITE_URL = CANONICAL_URL;
export const FROM_NAME = 'iRoxanne Studio';

export function generateUnsubscribeToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function unsubscribeUrl(email: string, token?: string): string {
  const params = new URLSearchParams({ email });
  if (token) params.set('token', token);
  return `${SITE_URL}/unsubscribe?${params.toString()}`;
}