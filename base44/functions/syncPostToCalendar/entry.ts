import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveCalendarId, gcalInsertEvent, gcalUpdateEvent, gcalDeleteEvent } from '../../shared/googleCalendar.ts';
import { loadNotificationSettings, appOrigin, requireAuthenticated } from '../../shared/marketingAdmin.ts';

// syncPostToCalendar — mirrors scheduled MarketingPosts into Google Calendar.
//
// Triggered two ways:
//   1. Entity automation on MarketingPost create/update/delete (single post).
//   2. { sweep: true } payload — bulk pass over ALL posts (used after campaign
//      bulk-generation, which skips entity automations).
//
// Rules:
//   - Only posts with status Ready or Pending Review AND a scheduled_date get an event.
//   - Title: "[Platform] — [hook or first caption line]".
//   - Description: caption + hashtags + link to the Ready-to-Post view.
//   - Start: scheduled_time (default 09:00) in the admin's notify_timezone; 15 min long;
//     popup reminder 15 min before.
//   - Edited/rescheduled → event updated. Deleted, marked Posted/Skipped, or demoted
//     to Draft → event removed. Event id tracked in calendar_event_id.

const SYNCABLE = ['Ready', 'Pending Review'];
// Bookkeeping-only updates must not re-trigger a sync (prevents automation loops).
const IGNORED_CHANGES = ['calendar_event_id', 'publish_error'];

function addMinutes(dateStr, timeStr, mins) {
  // Pure wall-time arithmetic (UTC container is just for the math).
  const d = new Date(`${dateStr}T${timeStr}:00Z`);
  d.setUTCMinutes(d.getUTCMinutes() + mins);
  return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16) };
}

function eventBody(post, origin, tz) {
  const time = /^\d{2}:\d{2}$/.test(String(post.scheduled_time || '')) ? post.scheduled_time : '09:00';
  const end = addMinutes(post.scheduled_date, time, 15);
  const firstLine = String(post.hook || (post.caption || '').split('\n')[0] || post.format || 'post').trim().slice(0, 80);
  const description = [
    String(post.caption || '').trim(),
    String(post.hashtags || '').trim(),
    `Ready-to-Post: ${origin}/marketing/calendar?post=${post.id}`,
  ].filter(Boolean).join('\n\n');
  return {
    summary: `${post.platform} — ${firstLine}`,
    description,
    start: { dateTime: `${post.scheduled_date}T${time}:00`, timeZone: tz },
    end: { dateTime: `${end.date}T${end.time}:00`, timeZone: tz },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
    extendedProperties: { shared: { marketingPostId: post.id } },
  };
}

function isSyncable(p) {
  return !!(p && SYNCABLE.includes(p.status) && p.scheduled_date);
}

async function upsertEvent(base44, accessToken, calendarId, post, origin, tz) {
  const body = eventBody(post, origin, tz);
  const existingId = post.calendar_event_id || null;
  if (existingId) {
    const updated = await gcalUpdateEvent(accessToken, calendarId, existingId, body);
    if (updated) return existingId;
    // 404 — event deleted externally; fall through and recreate.
  }
  const newId = await gcalInsertEvent(accessToken, calendarId, body);
  await base44.asServiceRole.entities.MarketingPost.update(post.id, { calendar_event_id: newId });
  return newId;
}

async function removeEvent(base44, accessToken, calendarId, post) {
  if (!post?.calendar_event_id) return false;
  await gcalDeleteEvent(accessToken, calendarId, post.calendar_event_id);
  await base44.asServiceRole.entities.MarketingPost.update(post.id, { calendar_event_id: '' });
  return true;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthenticated(base44);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    if (!accessToken) return Response.json({ error: 'Google Calendar not connected' }, { status: 502 });
    const calendarId = await resolveCalendarId(accessToken, body.calendarId);

    const ns = await loadNotificationSettings(base44);
    const tz = ns.timezone || 'America/New_York';
    const origin = appOrigin(req) || 'https://roxsan.base44.app';

    // Bulk pass over all posts (campaign bulk-generation skips entity automations).
    if (body.sweep) {
      const posts = await base44.asServiceRole.entities.MarketingPost.list('-created_date', 500);
      let synced = 0;
      let removed = 0;
      for (const p of posts || []) {
        if (isSyncable(p)) {
          await upsertEvent(base44, accessToken, calendarId, p, origin, tz);
          synced++;
        } else if (p.calendar_event_id) {
          if (await removeEvent(base44, accessToken, calendarId, p)) removed++;
        }
      }
      return Response.json({ mode: 'sweep', calendarId, synced, removed });
    }

    // Single-post entity automation payload.
    const event = body.event || {};
    if (!event.entity_id || !event.type) {
      return Response.json({ error: 'Missing event.entity_id or event.type (or pass { sweep: true })' }, { status: 400 });
    }

    if (event.type === 'delete') {
      const old = body.old_data || body.data;
      if (old?.calendar_event_id) {
        await gcalDeleteEvent(accessToken, calendarId, old.calendar_event_id);
      }
      return Response.json({ status: 'deleted', calendarId, eventId: old?.calendar_event_id || null });
    }

    const changed = Array.isArray(body.changed_fields) ? body.changed_fields : [];
    if (event.type === 'update' && changed.length && changed.every((f) => IGNORED_CHANGES.includes(f))) {
      return Response.json({ status: 'skipped', reason: 'bookkeeping-only change' });
    }

    const data = body.data || await base44.asServiceRole.entities.MarketingPost.get(event.entity_id);
    if (!data) return Response.json({ status: 'not_found', calendarId });
    const post = { ...data, id: event.entity_id };

    if (isSyncable(post)) {
      const eventId = await upsertEvent(base44, accessToken, calendarId, post, origin, tz);
      return Response.json({ status: 'synced', calendarId, eventId, postId: post.id });
    }

    const didRemove = await removeEvent(base44, accessToken, calendarId, post);
    return Response.json({ status: didRemove ? 'removed' : 'no_event', calendarId, postId: post.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}