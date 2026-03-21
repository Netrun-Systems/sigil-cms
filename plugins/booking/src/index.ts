/**
 * Booking Plugin — Appointment scheduling for service businesses
 *
 * Provides availability rules, Google Calendar integration (optional),
 * booking with email confirmations via ACS (optional), and admin management.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const bookingPlugin: CmsPlugin = {
  id: 'booking',
  name: 'Appointment Booking',
  version: '1.0.0',

  // Google Calendar and ACS are optional enhancements — no required env
  async register(ctx) {
    // ── Migrations ──

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_booking_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        price INTEGER,
        currency VARCHAR(3) DEFAULT 'USD',
        color VARCHAR(7),
        is_active BOOLEAN NOT NULL DEFAULT true,
        max_daily_bookings INTEGER,
        buffer_minutes INTEGER NOT NULL DEFAULT 15,
        advance_notice_hours INTEGER NOT NULL DEFAULT 24,
        max_advance_days INTEGER NOT NULL DEFAULT 60,
        sort_order INTEGER NOT NULL DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_booking_services_site_id
        ON cms_booking_services(site_id);
    `);

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_booking_availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        service_id UUID REFERENCES cms_booking_services(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time VARCHAR(5) NOT NULL,
        end_time VARCHAR(5) NOT NULL,
        timezone VARCHAR(50) NOT NULL DEFAULT 'America/Los_Angeles',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(site_id, service_id, day_of_week, start_time)
      );
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_booking_availability_site_id
        ON cms_booking_availability(site_id);
    `);

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS cms_appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
        service_id UUID NOT NULL REFERENCES cms_booking_services(id),
        customer_name VARCHAR(200) NOT NULL,
        customer_email VARCHAR(320) NOT NULL,
        customer_phone VARCHAR(50),
        appointment_date DATE NOT NULL,
        start_time VARCHAR(5) NOT NULL,
        end_time VARCHAR(5) NOT NULL,
        timezone VARCHAR(50) NOT NULL DEFAULT 'America/Los_Angeles',
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
        notes TEXT,
        admin_notes TEXT,
        confirmation_token UUID NOT NULL DEFAULT gen_random_uuid(),
        cancellation_token UUID NOT NULL DEFAULT gen_random_uuid(),
        google_event_id VARCHAR(255),
        reminder_sent BOOLEAN NOT NULL DEFAULT false,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_appointments_site_date
        ON cms_appointments(site_id, appointment_date);
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_appointments_site_status
        ON cms_appointments(site_id, status);
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_appointments_confirm_token
        ON cms_appointments(confirmation_token);
    `);

    await ctx.runMigration(`
      CREATE INDEX IF NOT EXISTS idx_cms_appointments_cancel_token
        ON cms_appointments(cancellation_token);
    `);

    // ── Routes ──

    const { adminRouter, publicRouter, confirmRouter } = createRoutes(ctx.db, ctx.logger);

    ctx.addRoutes('booking', adminRouter);
    ctx.addPublicRoutes('booking/:siteSlug', publicRouter);
    ctx.addPublicRoutes('booking', confirmRouter);

    // ── Block Types ──

    ctx.addBlockTypes([
      { type: 'booking_calendar', label: 'Booking Calendar', category: 'interactive' },
      { type: 'service_list', label: 'Service List', category: 'interactive' },
    ]);

    // ── Admin Navigation ──

    ctx.addAdminNav({
      title: 'Booking',
      siteScoped: true,
      items: [
        { label: 'Services', icon: 'CalendarDays', href: 'booking/services' },
        { label: 'Appointments', icon: 'CalendarCheck', href: 'booking/appointments' },
        { label: 'Availability', icon: 'Clock', href: 'booking/availability' },
      ],
    });

    // ── Admin Routes ──

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/booking/services', component: '@netrun-cms/plugin-booking/admin/ServicesList' },
      { path: 'sites/:siteId/booking/appointments', component: '@netrun-cms/plugin-booking/admin/AppointmentsList' },
      { path: 'sites/:siteId/booking/availability', component: '@netrun-cms/plugin-booking/admin/AvailabilityEditor' },
    ]);
  },
};

export default bookingPlugin;
