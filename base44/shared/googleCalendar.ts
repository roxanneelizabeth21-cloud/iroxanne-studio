// Shared Google Calendar helpers (SHARED googlecalendar connector).
// Used by syncReleaseToCalendar and syncPostToCalendar.

export const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

const PROJECT_KEYWORD = 'project';

// Picks the first calendar whose summary contains "project" (case-insensitive),
// falling back to the primary calendar. Pass an override id to force a calendar.
export async function resolveCalendarId(accessToken, override) {
  if (override) return override;
  try {
    const res = await fetch(`${CALENDAR_API}/users/me/calendarList?maxResults=250`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const json = await res.json();
      const items = json.items || [];
      const match = items.find((c) => {
        const summary = (c.summary || '').toLowerCase();
        return summary.includes(PROJECT_KEYWORD) && c.id && !c.id.endsWith('#contacts@group.v.calendar.google.com');
      });
      if (match) return match.id;
    }
  } catch {
    // fall through to primary
  }
  return 'primary';
}

export async function gcalInsertEvent(accessToken, calendarId, body) {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar create failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.id;
}

// Returns the event id, or null when the event was deleted externally (404) —
// the caller should recreate it.
export async function gcalUpdateEvent(accessToken, calendarId, eventId, body) {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar update failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.id;
}

export async function gcalDeleteEvent(accessToken, calendarId, eventId) {
  if (!eventId) return;
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  // 404 = already gone; treat as success
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Google Calendar delete failed (${res.status}): ${text}`);
  }
}