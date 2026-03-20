/**
 * Contact Submissions Controller
 *
 * Handles contact form submissions, booking inquiries, and press inquiries.
 * Supports ACS email delivery + database persistence.
 */

import type { Request, Response } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { contactSubmissions, sites, artistProfiles } from '@netrun-cms/db';
import { getDb } from '../db.js';
import type { AuthenticatedRequest } from '../types/index.js';

const SENDER_ADDRESS = process.env.ACS_SENDER_ADDRESS || 'charlotte@netrunsystems.com';

export class ContactController {
  /** GET /api/v1/sites/:siteId/contacts */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const { siteId } = req.params;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    const conditions = [eq(contactSubmissions.siteId, siteId)];
    if (status) conditions.push(eq(contactSubmissions.status, status));
    if (type) conditions.push(eq(contactSubmissions.type, type));

    const results = await db
      .select()
      .from(contactSubmissions)
      .where(and(...conditions))
      .orderBy(desc(contactSubmissions.createdAt));

    res.json({ success: true, data: results });
  }

  /** GET /api/v1/sites/:siteId/contacts/stats */
  static async stats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const { siteId } = req.params;

    const results = await db
      .select({ status: contactSubmissions.status, count: count() })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.siteId, siteId))
      .groupBy(contactSubmissions.status);

    const stats: Record<string, number> = {};
    for (const row of results) stats[row.status] = row.count;

    res.json({ success: true, data: stats });
  }

  /** PATCH /api/v1/sites/:siteId/contacts/:id */
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const { siteId, id } = req.params;
    const { status, notes } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const result = await db.update(contactSubmissions)
      .set(updates)
      .where(and(eq(contactSubmissions.id, id), eq(contactSubmissions.siteId, siteId)))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } });
      return;
    }

    res.json({ success: true, data: result[0] });
  }

  /** DELETE /api/v1/sites/:siteId/contacts/:id */
  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const db = getDb();
    const { siteId, id } = req.params;

    await db.delete(contactSubmissions)
      .where(and(eq(contactSubmissions.id, id), eq(contactSubmissions.siteId, siteId)));

    res.json({ success: true });
  }

  // ── Public endpoint (no auth) ──

  /** POST /api/v1/public/contact/:siteSlug */
  static async submit(req: Request, res: Response): Promise<void> {
    const db = getDb();
    const { siteSlug } = req.params;
    const { name, email, subject, message, type } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ success: false, error: { message: 'name, email, and message are required' } });
      return;
    }

    const [site] = await db.select({ id: sites.id, name: sites.name, domain: sites.domain })
      .from(sites).where(eq(sites.slug, siteSlug)).limit(1);
    if (!site) { res.status(404).json({ success: false, error: { message: 'Site not found' } }); return; }

    // Determine submission type from subject prefix
    const submissionType = type || (subject?.startsWith('Booking Inquiry:') ? 'booking' : 'general');

    // Parse booking metadata from structured message
    const metadata: Record<string, unknown> = {};
    if (submissionType === 'booking') {
      const get = (label: string) => {
        const match = message.match(new RegExp(`${label}:\\s*(.+?)\\n`));
        const val = match?.[1]?.trim();
        return val === 'TBD' || val === 'Not specified' ? null : val || null;
      };
      metadata.eventType = get('Event Type');
      metadata.eventDate = get('Date');
      metadata.venue = get('Venue');
      metadata.location = get('Location');
      metadata.attendance = get('Expected Attendance');
      metadata.budget = get('Budget Range');
    }

    // Save to database
    await db.insert(contactSubmissions).values({
      siteId: site.id,
      name,
      email,
      subject: subject || null,
      message,
      type: submissionType,
      metadata,
    });

    // Send email notification
    try {
      const connStr = process.env.ACS_CONNECTION_STRING || process.env.AZURE_ACS_CONNECTION_STRING;
      if (connStr) {
        // Find artist email to forward to
        const [profile] = await db.select({ bookingEmail: artistProfiles.bookingEmail, managementEmail: artistProfiles.managementEmail })
          .from(artistProfiles).where(eq(artistProfiles.siteId, site.id)).limit(1);

        const recipientEmail = profile?.bookingEmail || profile?.managementEmail;
        if (recipientEmail) {
          const { EmailClient } = await import('@azure/communication-email');
          const client = EmailClient.fromConnectionString(connStr);

          const poller = await client.beginSend({
            senderAddress: SENDER_ADDRESS,
            recipients: { to: [{ address: recipientEmail }] },
            replyTo: [{ address: email, displayName: name }],
            content: {
              subject: `[${site.name}] ${subject || 'New Contact'}`,
              plainText: `New ${submissionType} from ${site.name}:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject || 'N/A'}\n\n${message}`,
            },
          });
          await poller.result();
        }
      }
    } catch {
      // Email is best-effort — submission is already saved
    }

    res.json({ success: true, message: 'Message received' });
  }
}
