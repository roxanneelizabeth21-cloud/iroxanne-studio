import { base44 } from '@/api/base44Client';

// Subscribe a fan by email via the subscribeFan backend function.
// The function runs as service role so it can read/update FanSubscriber records
// (admin-only under RLS) — this gives true dedupe for anonymous visitors,
// which client-side filter/update cannot do.
//
// Returns { created: boolean, record } where `created` is true for a brand-new
// subscriber and false for an already-subscribed (deduped) email. Throws on any
// true failure so callers can surface a visible error.
export async function subscribeFan({ email, name, source_slug, utm_source, utm_medium, utm_campaign }) {
  const res = await base44.functions.invoke('subscribeFan', {
    email,
    name,
    source_slug,
    utm_source,
    utm_medium,
    utm_campaign,
  });
  // invoke returns an axios-style envelope { data, status, ... }; the function
  // body is in .data. Fall back to res for safety.
  const body = res?.data ?? res;
  if (!body || body.error) {
    throw new Error(body?.error || 'Subscription failed');
  }
  return {
    created: body.created === true,
    record: body.record,
  };
}