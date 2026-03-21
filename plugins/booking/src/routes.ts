// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Booking Routes
 *
 * Provides three routers:
 *   - adminRouter:   authenticated site-scoped CRUD for services, availability, appointments
 *   - publicRouter:  public service listing, availability checking, and booking
 *   - confirmRouter: token-based appointment confirmation and cancellation
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, count, sql, desc, asc } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import type { DrizzleClient, PluginLogger } from '@netrun-cms/plugin-runtime';
import { bookingServices, bookingAvailability, appointments } from './schema.js';
import { getFreeBusy, createCalendarEvent, deleteCalendarEvent, CALENDAR_ID } from './lib/calendar.js';
import { sendConfirmationEmail, sendCancellationEmail } from './lib/notifications.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "HH:MM" to minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight back to "HH:MM" */
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Build a Date from YYYY-MM-DD + HH:MM + timezone (approximate — uses UTC offset) */
function buildDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

/** Simple HTML page wrapper */
function htmlPage(title: string, heading: string, message: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5}.card{text-align:center;padding:3rem;max-width:480px}h1{font-size:1.5rem;margin-bottom:1rem;color:#90b9ab}p{color:#a3a3a3;line-height:1.6}</style></head><body><div class="card"><h1>${heading}</h1><p>${message}</p></div></body></html>`;
}

// ── Admin Routes ─────────────────────────────────────────────────────────────

function createAdminRouter(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  // ── Services CRUD ──

  /** GET /services — list booking services for site */
  router.get('/services', async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const results = await d.select().from(bookingServices)
      .where(eq(bookingServices.siteId, siteId))
      .orderBy(asc(bookingServices.sortOrder), asc(bookingServices.name));

    res.json({ success: true, data: results });
  });

  /** POST /services — create booking service */
  router.post('/services', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { name, description, durationMinutes, price, currency, color, isActive, maxDailyBookings, bufferMinutes, advanceNoticeHours, maxAdvanceDays, sortOrder, metadata } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'name is required' } });
      return;
    }

    const [service] = await d.insert(bookingServices).values({
      siteId,
      name,
      description: description || null,
      durationMinutes: durationMinutes ?? 60,
      price: price ?? null,
      currency: currency || 'USD',
      color: color || null,
      isActive: isActive ?? true,
      maxDailyBookings: maxDailyBookings ?? null,
      bufferMinutes: bufferMinutes ?? 15,
      advanceNoticeHours: advanceNoticeHours ?? 24,
      maxAdvanceDays: maxAdvanceDays ?? 60,
      sortOrder: sortOrder ?? 0,
      metadata: metadata || {},
    }).returning();

    logger.info({ serviceId: service.id }, 'Booking service created');
    res.status(201).json({ success: true, data: service });
  });

  /** PUT /services/:id — update booking service */
  router.put('/services/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    const updates = req.body;

    const [service] = await d.update(bookingServices)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(bookingServices.id, id), eq(bookingServices.siteId, siteId)))
      .returning();

    if (!service) {
      res.status(404).json({ success: false, error: { message: 'Service not found' } });
      return;
    }

    res.json({ success: true, data: service });
  });

  /** DELETE /services/:id — deactivate booking service */
  router.delete('/services/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;

    const [service] = await d.update(bookingServices)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(bookingServices.id, id), eq(bookingServices.siteId, siteId)))
      .returning();

    if (!service) {
      res.status(404).json({ success: false, error: { message: 'Service not found' } });
      return;
    }

    res.json({ success: true, data: service });
  });

  // ── Availability CRUD ──

  /** GET /availability — list availability rules for site */
  router.get('/availability', async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const results = await d.select().from(bookingAvailability)
      .where(eq(bookingAvailability.siteId, siteId))
      .orderBy(asc(bookingAvailability.dayOfWeek), asc(bookingAvailability.startTime));

    res.json({ success: true, data: results });
  });

  /** POST /availability — create availability rule */
  router.post('/availability', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { serviceId, dayOfWeek, startTime, endTime, timezone, isActive } = req.body;

    if (dayOfWeek === undefined || !startTime || !endTime) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'dayOfWeek, startTime, and endTime are required' } });
      return;
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'dayOfWeek must be 0-6 (Sunday-Saturday)' } });
      return;
    }

    try {
      const [rule] = await d.insert(bookingAvailability).values({
        siteId,
        serviceId: serviceId || null,
        dayOfWeek,
        startTime,
        endTime,
        timezone: timezone || 'America/Los_Angeles',
        isActive: isActive ?? true,
      }).returning();

      logger.info({ ruleId: rule.id }, 'Availability rule created');
      res.status(201).json({ success: true, data: rule });
    } catch (err) {
      if (err instanceof Error && err.message.includes('unique')) {
        res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Availability rule already exists for this day/time/service combination' } });
        return;
      }
      throw err;
    }
  });

  /** PUT /availability/:id — update availability rule */
  router.put('/availability/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    const updates = req.body;

    const [rule] = await d.update(bookingAvailability)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(bookingAvailability.id, id), eq(bookingAvailability.siteId, siteId)))
      .returning();

    if (!rule) {
      res.status(404).json({ success: false, error: { message: 'Availability rule not found' } });
      return;
    }

    res.json({ success: true, data: rule });
  });

  /** DELETE /availability/:id — delete availability rule */
  router.delete('/availability/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;

    const result = await d.delete(bookingAvailability)
      .where(and(eq(bookingAvailability.id, id), eq(bookingAvailability.siteId, siteId)))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ success: false, error: { message: 'Availability rule not found' } });
      return;
    }

    res.json({ success: true });
  });

  // ── Appointments Management ──

  /** GET /appointments — list appointments (filter by ?status=, ?date=, ?serviceId=) */
  router.get('/appointments', async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { status, date, serviceId } = req.query as Record<string, string>;

    const conditions = [eq(appointments.siteId, siteId)];
    if (status) conditions.push(eq(appointments.status, status));
    if (date) conditions.push(eq(appointments.appointmentDate, date));
    if (serviceId) conditions.push(eq(appointments.serviceId, serviceId));

    const results = await d.select().from(appointments)
      .where(and(...conditions))
      .orderBy(desc(appointments.appointmentDate), asc(appointments.startTime));

    res.json({ success: true, data: results });
  });

  /** GET /appointments/stats — counts by status */
  router.get('/appointments/stats', async (req: Request, res: Response) => {
    const { siteId } = req.params;

    const results = await d
      .select({ status: appointments.status, count: count() })
      .from(appointments)
      .where(eq(appointments.siteId, siteId))
      .groupBy(appointments.status);

    const stats: Record<string, number> = { pending: 0, confirmed: 0, cancelled: 0, completed: 0, no_show: 0 };
    for (const row of results) stats[row.status] = row.count;

    res.json({ success: true, data: stats });
  });

  /** PATCH /appointments/:id — update status/adminNotes */
  router.patch('/appointments/:id', async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    const { status, adminNotes } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    const [appointment] = await d.update(appointments)
      .set(updates)
      .where(and(eq(appointments.id, id), eq(appointments.siteId, siteId)))
      .returning();

    if (!appointment) {
      res.status(404).json({ success: false, error: { message: 'Appointment not found' } });
      return;
    }

    res.json({ success: true, data: appointment });
  });

  return router;
}

// ── Public Routes ────────────────────────────────────────────────────────────

function createPublicRouter(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** GET /services — list active services for a site (by slug) */
  router.get('/services', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;

    const [site] = await d.select({ id: sites.id }).from(sites)
      .where(eq(sites.slug, siteSlug)).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    const results = await d.select({
      id: bookingServices.id,
      name: bookingServices.name,
      description: bookingServices.description,
      durationMinutes: bookingServices.durationMinutes,
      price: bookingServices.price,
      currency: bookingServices.currency,
      color: bookingServices.color,
      bufferMinutes: bookingServices.bufferMinutes,
      advanceNoticeHours: bookingServices.advanceNoticeHours,
      maxAdvanceDays: bookingServices.maxAdvanceDays,
    }).from(bookingServices)
      .where(and(eq(bookingServices.siteId, site.id), eq(bookingServices.isActive, true)))
      .orderBy(asc(bookingServices.sortOrder), asc(bookingServices.name));

    res.json({ success: true, data: results });
  });

  /** GET /availability?date=YYYY-MM-DD&serviceId=xxx — returns available time slots */
  router.get('/availability', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const { date: dateStr, serviceId } = req.query as Record<string, string>;

    if (!dateStr || !serviceId) {
      res.status(400).json({ success: false, error: { message: 'date and serviceId query params are required' } });
      return;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      res.status(400).json({ success: false, error: { message: 'date must be in YYYY-MM-DD format' } });
      return;
    }

    const [site] = await d.select({ id: sites.id, domain: sites.domain }).from(sites)
      .where(eq(sites.slug, siteSlug)).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    // Load service
    const [service] = await d.select().from(bookingServices)
      .where(and(eq(bookingServices.id, serviceId), eq(bookingServices.siteId, site.id), eq(bookingServices.isActive, true)))
      .limit(1);
    if (!service) { res.status(404).json({ success: false, error: { message: 'Service not found' } }); return; }

    const requestedDate = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = requestedDate.getDay();
    const now = new Date();

    // Check advance notice
    const advanceNoticeMs = service.advanceNoticeHours * 60 * 60 * 1000;
    const earliestAllowed = new Date(now.getTime() + advanceNoticeMs);

    // Check max advance days
    const maxAdvanceMs = service.maxAdvanceDays * 24 * 60 * 60 * 1000;
    const latestAllowed = new Date(now.getTime() + maxAdvanceMs);

    if (requestedDate > latestAllowed) {
      res.json({ success: true, data: [] });
      return;
    }

    // Load availability rules (service-specific + global)
    const rules = await d.select().from(bookingAvailability)
      .where(and(
        eq(bookingAvailability.siteId, site.id),
        eq(bookingAvailability.dayOfWeek, dayOfWeek),
        eq(bookingAvailability.isActive, true),
        sql`(${bookingAvailability.serviceId} = ${serviceId} OR ${bookingAvailability.serviceId} IS NULL)`,
      ));

    if (rules.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    // Load existing confirmed/pending appointments for this date
    const existingApts = await d.select({
      startTime: appointments.startTime,
      endTime: appointments.endTime,
    }).from(appointments)
      .where(and(
        eq(appointments.siteId, site.id),
        eq(appointments.appointmentDate, dateStr),
        sql`${appointments.status} IN ('pending', 'confirmed')`,
      ));

    // Check Google Calendar free/busy (if configured)
    const dayStart = new Date(dateStr + 'T00:00:00');
    const dayEnd = new Date(dateStr + 'T23:59:59');
    const freeBusyBlocks = await getFreeBusy(CALENDAR_ID, dayStart, dayEnd);

    // Generate available slots
    const duration = service.durationMinutes;
    const buffer = service.bufferMinutes;
    const slots: Array<{ startTime: string; endTime: string; available: boolean }> = [];

    for (const rule of rules) {
      const ruleStart = timeToMinutes(rule.startTime);
      const ruleEnd = timeToMinutes(rule.endTime);

      let cursor = ruleStart;
      while (cursor + duration <= ruleEnd) {
        const slotStart = cursor;
        const slotEnd = cursor + duration;
        const slotStartTime = minutesToTime(slotStart);
        const slotEndTime = minutesToTime(slotEnd);

        // Check advance notice — skip slots that are too soon
        const slotDateTime = buildDateTime(dateStr, slotStartTime);
        if (slotDateTime < earliestAllowed) {
          cursor = slotEnd + buffer;
          continue;
        }

        // Check conflicts with existing appointments (include buffer)
        const hasAptConflict = existingApts.some((apt: any) => {
          const aptStart = timeToMinutes(apt.startTime);
          const aptEnd = timeToMinutes(apt.endTime);
          return slotStart < aptEnd + buffer && slotEnd + buffer > aptStart;
        });

        // Check conflicts with Google Calendar busy blocks
        let hasCalConflict = false;
        if (!hasAptConflict && freeBusyBlocks.length > 0) {
          const slotStartDate = buildDateTime(dateStr, slotStartTime);
          const slotEndDate = buildDateTime(dateStr, slotEndTime);
          hasCalConflict = freeBusyBlocks.some((block) => {
            const blockStart = new Date(block.start);
            const blockEnd = new Date(block.end);
            return slotStartDate < blockEnd && slotEndDate > blockStart;
          });
        }

        if (!hasAptConflict && !hasCalConflict) {
          slots.push({ startTime: slotStartTime, endTime: slotEndTime, available: true });
        }

        cursor = slotEnd + buffer;
      }
    }

    res.json({ success: true, data: slots });
  });

  /** POST /book — create a pending appointment */
  router.post('/book', async (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const { serviceId, date, startTime, customerName, customerEmail, customerPhone, notes } = req.body;

    if (!serviceId || !date || !startTime || !customerName || !customerEmail) {
      res.status(400).json({ success: false, error: { message: 'serviceId, date, startTime, customerName, and customerEmail are required' } });
      return;
    }

    if (typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
      res.status(400).json({ success: false, error: { message: 'Valid email is required' } });
      return;
    }

    const [site] = await d.select({ id: sites.id, domain: sites.domain, name: sites.name }).from(sites)
      .where(eq(sites.slug, siteSlug)).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    // Load service
    const [service] = await d.select().from(bookingServices)
      .where(and(eq(bookingServices.id, serviceId), eq(bookingServices.siteId, site.id), eq(bookingServices.isActive, true)))
      .limit(1);
    if (!service) { res.status(404).json({ success: false, error: { message: 'Service not found' } }); return; }

    // Calculate end time from service duration
    const startMinutes = timeToMinutes(startTime);
    const endTime = minutesToTime(startMinutes + service.durationMinutes);

    // Race condition check — verify the slot is still available
    const conflicting = await d.select({ id: appointments.id }).from(appointments)
      .where(and(
        eq(appointments.siteId, site.id),
        eq(appointments.appointmentDate, date),
        sql`${appointments.status} IN ('pending', 'confirmed')`,
        sql`${appointments.startTime} < ${endTime} AND ${appointments.endTime} > ${startTime}`,
      ))
      .limit(1);

    if (conflicting.length > 0) {
      res.status(409).json({ success: false, error: { message: 'This time slot is no longer available' } });
      return;
    }

    // Check max daily bookings
    if (service.maxDailyBookings) {
      const [{ count: dailyCount }] = await d.select({ count: count() }).from(appointments)
        .where(and(
          eq(appointments.siteId, site.id),
          eq(appointments.serviceId, serviceId),
          eq(appointments.appointmentDate, date),
          sql`${appointments.status} IN ('pending', 'confirmed')`,
        ));

      if (dailyCount >= service.maxDailyBookings) {
        res.status(409).json({ success: false, error: { message: 'Maximum bookings for this day has been reached' } });
        return;
      }
    }

    // Create appointment
    const timezone = service.timezone || 'America/Los_Angeles';
    const [appointment] = await d.insert(appointments).values({
      siteId: site.id,
      serviceId,
      customerName,
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone: customerPhone || null,
      appointmentDate: date,
      startTime,
      endTime,
      timezone,
      status: 'pending',
      notes: notes || null,
    }).returning();

    // Send confirmation email
    const siteUrl = site.domain ? `https://${site.domain}` : process.env.SITE_URL || 'https://localhost:3000';
    const confirmUrl = `${siteUrl}/api/v1/public/booking/confirm/${appointment.confirmationToken}`;
    const cancelUrl = `${siteUrl}/api/v1/public/booking/cancel/${appointment.cancellationToken}`;

    sendConfirmationEmail({
      to: appointment.customerEmail,
      customerName: appointment.customerName,
      serviceName: service.name,
      date,
      startTime,
      endTime,
      timezone,
      confirmUrl,
      cancelUrl,
      siteUrl,
      siteName: site.name || siteSlug,
    }).catch((err) => {
      logger.error({ err, appointmentId: appointment.id }, 'Failed to send confirmation email');
    });

    logger.info({ appointmentId: appointment.id, service: service.name }, 'Appointment booked');
    res.status(201).json({
      success: true,
      data: { appointmentId: appointment.id, message: 'Check your email to confirm' },
    });
  });

  return router;
}

// ── Confirm/Cancel Routes ────────────────────────────────────────────────────

function createConfirmRouter(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });
  const d = db as any;

  /** GET /confirm/:token — confirms appointment */
  router.get('/confirm/:token', async (req: Request, res: Response) => {
    const { token } = req.params;

    const [appointment] = await d.select().from(appointments)
      .where(and(eq(appointments.confirmationToken, token), eq(appointments.status, 'pending')))
      .limit(1);

    if (!appointment) {
      res.status(200).send(htmlPage(
        'Invalid or Expired',
        'Cannot Confirm',
        'This confirmation link is invalid, expired, or the appointment has already been confirmed or cancelled.',
      ));
      return;
    }

    // Update to confirmed
    await d.update(appointments)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(eq(appointments.id, appointment.id));

    // Create Google Calendar event if configured
    const [service] = await d.select({ name: bookingServices.name }).from(bookingServices)
      .where(eq(bookingServices.id, appointment.serviceId)).limit(1);

    const serviceName = service?.name || 'Appointment';
    const startDateTime = buildDateTime(appointment.appointmentDate, appointment.startTime);
    const endDateTime = buildDateTime(appointment.appointmentDate, appointment.endTime);

    const eventId = await createCalendarEvent(CALENDAR_ID, {
      summary: `${serviceName} — ${appointment.customerName}`,
      description: `Customer: ${appointment.customerName}\nEmail: ${appointment.customerEmail}\n${appointment.notes ? `Notes: ${appointment.notes}` : ''}`,
      start: startDateTime,
      end: endDateTime,
      attendeeEmail: appointment.customerEmail,
      timezone: appointment.timezone || 'America/Los_Angeles',
    });

    if (eventId) {
      await d.update(appointments)
        .set({ googleEventId: eventId })
        .where(eq(appointments.id, appointment.id));
    }

    logger.info({ appointmentId: appointment.id }, 'Appointment confirmed');

    res.status(200).send(htmlPage(
      'Appointment Confirmed',
      'Confirmed!',
      `Your ${serviceName} on ${appointment.appointmentDate} at ${appointment.startTime} has been confirmed. You will receive a reminder before your appointment.`,
    ));
  });

  /** Handle cancellation (shared between GET and POST) */
  async function handleCancel(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    const [appointment] = await d.select().from(appointments)
      .where(and(
        eq(appointments.cancellationToken, token),
        sql`${appointments.status} IN ('pending', 'confirmed')`,
      ))
      .limit(1);

    if (!appointment) {
      res.status(200).send(htmlPage(
        'Cannot Cancel',
        'Cannot Cancel',
        'This cancellation link is invalid, or the appointment has already been cancelled or completed.',
      ));
      return;
    }

    // Update to cancelled
    await d.update(appointments)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(appointments.id, appointment.id));

    // Delete Google Calendar event if exists
    if (appointment.googleEventId) {
      await deleteCalendarEvent(CALENDAR_ID, appointment.googleEventId);
    }

    // Send cancellation email
    const [service] = await d.select({ name: bookingServices.name }).from(bookingServices)
      .where(eq(bookingServices.id, appointment.serviceId)).limit(1);

    const [site] = await d.select({ name: sites.name }).from(sites)
      .where(eq(sites.id, appointment.siteId)).limit(1);

    const serviceName = service?.name || 'Appointment';

    sendCancellationEmail({
      to: appointment.customerEmail,
      customerName: appointment.customerName,
      serviceName,
      date: appointment.appointmentDate,
      startTime: appointment.startTime,
      siteName: site?.name || 'Our Site',
    }).catch((err) => {
      logger.error({ err, appointmentId: appointment.id }, 'Failed to send cancellation email');
    });

    logger.info({ appointmentId: appointment.id }, 'Appointment cancelled');

    res.status(200).send(htmlPage(
      'Appointment Cancelled',
      'Cancelled',
      `Your ${serviceName} on ${appointment.appointmentDate} at ${appointment.startTime} has been cancelled.`,
    ));
  }

  /** GET /cancel/:token — cancels appointment (browser click) */
  router.get('/cancel/:token', handleCancel);

  /** POST /cancel/:token — cancels appointment (email client compatibility) */
  router.post('/cancel/:token', handleCancel);

  return router;
}

// ── Export ────────────────────────────────────────────────────────────────────

export function createRoutes(db: DrizzleClient, logger: PluginLogger) {
  return {
    adminRouter: createAdminRouter(db, logger),
    publicRouter: createPublicRouter(db, logger),
    confirmRouter: createConfirmRouter(db, logger),
  };
}
