/**
 * Google Calendar Integration
 *
 * Provides free/busy checking and event creation/deletion for appointment sync.
 * Degrades gracefully when GOOGLE_CALENDAR_CREDENTIALS is not set.
 */

import { google } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

async function getCalendarClient() {
  const credentialsJson = process.env.GOOGLE_CALENDAR_CREDENTIALS;
  if (!credentialsJson) return null;

  const credentials = JSON.parse(credentialsJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

/**
 * Check free/busy for a date range. Returns busy blocks.
 * If calendar is not configured, returns empty array.
 */
export async function getFreeBusy(
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<Array<{ start: string; end: string }>> {
  const calendar = await getCalendarClient();
  if (!calendar) return [];

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: calendarId }],
      },
    });

    const busy = response.data.calendars?.[calendarId]?.busy || [];
    return busy
      .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
      .map((b) => ({ start: b.start!, end: b.end! }));
  } catch (err) {
    console.warn('[booking] Google Calendar free/busy check failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Create a calendar event for a confirmed appointment.
 * Returns the event ID, or empty string if calendar is not configured.
 */
export async function createCalendarEvent(
  calendarId: string,
  params: {
    summary: string;
    description: string;
    start: Date;
    end: Date;
    attendeeEmail: string;
    timezone: string;
  },
): Promise<string> {
  const calendar = await getCalendarClient();
  if (!calendar) return '';

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: {
          dateTime: params.start.toISOString(),
          timeZone: params.timezone,
        },
        end: {
          dateTime: params.end.toISOString(),
          timeZone: params.timezone,
        },
        attendees: [{ email: params.attendeeEmail }],
      },
    });

    return response.data.id || '';
  } catch (err) {
    console.warn('[booking] Google Calendar event creation failed:', err instanceof Error ? err.message : err);
    return '';
  }
}

/**
 * Delete a calendar event (on cancellation).
 * No-op if calendar is not configured.
 */
export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string,
): Promise<void> {
  const calendar = await getCalendarClient();
  if (!calendar) return;

  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (err) {
    console.warn('[booking] Google Calendar event deletion failed:', err instanceof Error ? err.message : err);
  }
}

export { CALENDAR_ID };
