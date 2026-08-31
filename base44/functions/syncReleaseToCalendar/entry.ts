import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { CALENDAR_API, resolveCalendarId, gcalInsertEvent, gcalUpdateEvent, gcalDeleteEvent } from '../../shared/googleCalendar.ts';

// Syncs a MusicRelease's release_date to a Google Calendar all-day event.
// Triggered by an entity automation on MusicRelease create/update/delete.
// Uses the app builder's shared Google Calendar connection (SHARED connector).
// Calendar helpers live in shared/googleCalendar.ts (also used by syncPostToCalendar).
//
// Payload (from the entity automation):
//   event: { type: 'create'|'update'|'delete', entity_name, entity_id }
//   data: current release (null on delete)
//   old_data: previous release (update/delete only)
//
// Behavior:
//   - create/update with a release_date -> upsert all-day event (tracks id in calendar_event_id)
//   - update where release_date was cleared -> delete the existing event
//   - delete -> delete the existing event

function nextDay(dateStr) {
  // Google all-day events use an exclusive end date; add one day.
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}

function buildDescription(release) {
  const lines = [];
  if (release.artist_name) lines.push(`Artist: ${release.artist_name}`);
  if (release.release_type) lines.push(`Type: ${release.release_type}`);
  if (release.label) lines.push(`Label: ${release.label}`);
  if (release.status) lines.push(`Status: ${release.status}`);
  if (release.slug) lines.push(`Landing page: /release/${release.slug}`);
  if (release.tagline) lines.push(`\n${release.tagline}`);
  return lines.join('\n') || 'Music release';
}

function releaseEventBody(release) {
  return {
    summary: `${release.title || 'Music Release'} — Release`,
    description: buildDescription(release),
    start: { date: release.release_date },
    end: { date: nextDay(release.release_date) },
    extendedProperties: { shared: { releaseId: release.id } }
  };
}

async function listEventByRelease(accessToken, calendarId, releaseId) {
  // Find an existing event tagged with this release via extendedProperties.
  const url = `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events` +
    `?sharedExtendedProperty=releaseId%3D${encodeURIComponent(releaseId)}&maxResults=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const json = await res.json();
  const items = json.items || [];
  return items.length ? items[0].id : null;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const event = body.event || {};
    const type = event.type;
    const data = body.data;
    const oldData = body.old_data;
    const entityId = event.entity_id;

    if (!entityId || !type) {
      return Response.json({ error: 'Missing event.entity_id or event.type' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    if (!accessToken) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 502 });
    }
    const calendarId = await resolveCalendarId(accessToken, body.calendarId);

    // DELETE: remove the existing event (if any).
    if (type === 'delete') {
      const eventId = oldData?.calendar_event_id || data?.calendar_event_id;
      if (eventId) {
        await gcalDeleteEvent(accessToken, calendarId, eventId);
      }
      return Response.json({ status: 'deleted', calendarId, eventId: eventId || null });
    }

    // create or update
    const release = data;
    const existingEventId = release?.calendar_event_id || (await listEventByRelease(accessToken, calendarId, entityId)) || null;

    // No release_date -> ensure any existing event is removed.
    if (!release?.release_date) {
      if (existingEventId) {
        await gcalDeleteEvent(accessToken, calendarId, existingEventId);
        await base44.asServiceRole.entities.MusicRelease.update(entityId, { calendar_event_id: '' });
      }
      return Response.json({ status: 'no_date_cleared', calendarId });
    }

    const eventPayload = releaseEventBody({ ...release, id: entityId });
    let eventId;
    if (existingEventId) {
      const updatedId = await gcalUpdateEvent(accessToken, calendarId, existingEventId, eventPayload);
      eventId = updatedId || await gcalInsertEvent(accessToken, calendarId, eventPayload);
    } else {
      eventId = await gcalInsertEvent(accessToken, calendarId, eventPayload);
    }

    // Persist the event id back onto the release so future updates are O(1).
    if (eventId && eventId !== existingEventId) {
      await base44.asServiceRole.entities.MusicRelease.update(entityId, { calendar_event_id: eventId });
    }

    return Response.json({ status: 'synced', calendarId, eventId, releaseId: entityId, releaseDate: release.release_date });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}