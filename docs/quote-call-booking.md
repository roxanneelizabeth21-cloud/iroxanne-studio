# Optional quote call booking
Google Calendar connection verified active for roxanneelizabeth21@gmail.com on September 12, 2026.

## Owner controls
Admin → Call availability (/admin/call-availability).
Saved enabled settings: Monday–Friday 17:00–19:30 America/New_York, 30-minute phone calls, 15-minute breaks, 24-hour advance notice, 21-day booking horizon. Primary Google Calendar is used for busy-time checks and new appointments. Hours, breaks, notice, horizon, blocked dates and on/off are editable.

## Client experience
After submitting a new quote, clients can choose Schedule an optional call. The confirmation email includes the same private booking link. The client selects a day/time, enters the phone number to call and confirms. Times are shown in the client's browser time zone. They do not need an app account.
Google Calendar receives a busy event and sends an attendee invitation. The app sends branded confirmation emails to the client and resolved studio notification address.
A booking never creates a contract or charges a payment.

## Implementation and validation
- Backend: quoteCallBooking; helpers: callAvailability.
- Private Lead booking token; no calendar event details, tokens, or access credentials are returned with slot lists.
- Busy events plus buffer remove available slots. Availability is checked again before insert.
- Deterministic Google event IDs prevent two confirmed events at the exact same start time; repeat completed requests return the saved booking. A pending start supports recovery after uncertain responses.
- Production build and changed-file ESLint passed.
- Four mocked test groups passed: hours, buffers, weekday/date exclusion, daylight saving, private/admin access, Google errors, invalid slots, booking/retry, recovery and same-time collision.
- No live appointment/email was created in these tests; browser and real Google invitation delivery remain unverified.
- External calendar changes and bookings at different start times are not a transaction; availability checks cannot guarantee against every concurrent external edit. Settings changes do not move existing appointments.
- Changes/cancellations are handled in Google Calendar with client notification. Lead booking summaries are snapshots, not continuous event synchronization.
- Previous quotes without booking_token do not receive a new link automatically.
