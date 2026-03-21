/**
 * Booking Plugin Schema — services, availability rules, and appointments
 *
 * Supports per-site service definitions, recurring weekly availability,
 * and appointment lifecycle (pending → confirmed → completed/cancelled/no_show).
 */

import { pgTable, uuid, varchar, text, integer, boolean, timestamp, date, jsonb, unique, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sites } from '@netrun-cms/db';
import type { InferSelectModel } from 'drizzle-orm';

// ── Booking Services ─────────────────────────────────────────────────────────

export const bookingServices = pgTable('cms_booking_services', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  price: integer('price'), // cents, nullable — free services allowed
  currency: varchar('currency', { length: 3 }).default('USD'),
  color: varchar('color', { length: 7 }), // hex color for calendar display
  isActive: boolean('is_active').notNull().default(true),
  maxDailyBookings: integer('max_daily_bookings'), // null means unlimited
  bufferMinutes: integer('buffer_minutes').notNull().default(15),
  advanceNoticeHours: integer('advance_notice_hours').notNull().default(24),
  maxAdvanceDays: integer('max_advance_days').notNull().default(60),
  sortOrder: integer('sort_order').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteIdIdx: index('idx_cms_booking_services_site_id').on(table.siteId),
}));

// ── Booking Availability ─────────────────────────────────────────────────────

export const bookingAvailability = pgTable('cms_booking_availability', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').references(() => bookingServices.id, { onDelete: 'cascade' }), // nullable — null applies to all services
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 6=Saturday
  startTime: varchar('start_time', { length: 5 }).notNull(), // "09:00" (HH:MM, 24h)
  endTime: varchar('end_time', { length: 5 }).notNull(), // "17:00"
  timezone: varchar('timezone', { length: 50 }).notNull().default('America/Los_Angeles'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteServiceDayTimeUnique: unique('cms_booking_availability_unique').on(
    table.siteId, table.serviceId, table.dayOfWeek, table.startTime
  ),
  siteIdIdx: index('idx_cms_booking_availability_site_id').on(table.siteId),
  dayOfWeekCheck: check('cms_booking_availability_dow_check',
    sql`${table.dayOfWeek} >= 0 AND ${table.dayOfWeek} <= 6`
  ),
}));

// ── Appointments ─────────────────────────────────────────────────────────────

export const appointments = pgTable('cms_appointments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull().references(() => bookingServices.id),
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  customerEmail: varchar('customer_email', { length: 320 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }),
  appointmentDate: date('appointment_date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(), // "14:00"
  endTime: varchar('end_time', { length: 5 }).notNull(), // "15:00"
  timezone: varchar('timezone', { length: 50 }).notNull().default('America/Los_Angeles'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  notes: text('notes'), // customer notes
  adminNotes: text('admin_notes'), // internal notes
  confirmationToken: uuid('confirmation_token').notNull().default(sql`gen_random_uuid()`),
  cancellationToken: uuid('cancellation_token').notNull().default(sql`gen_random_uuid()`),
  googleEventId: varchar('google_event_id', { length: 255 }),
  reminderSent: boolean('reminder_sent').notNull().default(false),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  siteDateIdx: index('idx_cms_appointments_site_date').on(table.siteId, table.appointmentDate),
  siteStatusIdx: index('idx_cms_appointments_site_status').on(table.siteId, table.status),
  confirmTokenIdx: index('idx_cms_appointments_confirm_token').on(table.confirmationToken),
  cancelTokenIdx: index('idx_cms_appointments_cancel_token').on(table.cancellationToken),
  statusCheck: check('cms_appointments_status_check',
    sql`${table.status} IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')`
  ),
}));

// ── Zod Schemas & Types ──────────────────────────────────────────────────────

export const insertBookingServiceSchema = createInsertSchema(bookingServices);
export const selectBookingServiceSchema = createSelectSchema(bookingServices);
export type BookingService = InferSelectModel<typeof bookingServices>;

export const insertBookingAvailabilitySchema = createInsertSchema(bookingAvailability);
export const selectBookingAvailabilitySchema = createSelectSchema(bookingAvailability);
export type BookingAvailability = InferSelectModel<typeof bookingAvailability>;

export const insertAppointmentSchema = createInsertSchema(appointments);
export const selectAppointmentSchema = createSelectSchema(appointments);
export type Appointment = InferSelectModel<typeof appointments>;
