/**
 * @poppies/notifications — Multi-channel notification system for Poppies
 *
 * Sends notifications via email, SMS, and Web Push based on per-artist
 * preferences. Subscribes to events from @poppies/shifts and
 * @poppies/messaging to auto-notify on coverage requests, new messages, etc.
 *
 * Tables:
 *   - poppies_notification_preferences: per-artist channel + type toggles
 *   - poppies_push_subscriptions: Web Push API device registrations
 *   - poppies_notifications: notification inbox/history
 */

import { Router } from 'express';
import type { CmsPlugin } from '@netrun-cms/plugin-runtime';

const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS poppies_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES poppies_consignment_artists(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT false,
    email_address VARCHAR(320),
    phone_number VARCHAR(50),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    shift_reminders BOOLEAN DEFAULT true,
    coverage_requests BOOLEAN DEFAULT true,
    new_messages BOOLEAN DEFAULT true,
    new_dm BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(site_id, artist_id)
  );

  CREATE TABLE IF NOT EXISTS poppies_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES poppies_consignment_artists(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_ps_artist ON poppies_push_subscriptions(artist_id);

  CREATE TABLE IF NOT EXISTS poppies_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    recipient_artist_id UUID NOT NULL REFERENCES poppies_consignment_artists(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT,
    link VARCHAR(500),
    source_type VARCHAR(50),
    source_id UUID,
    is_read BOOLEAN DEFAULT false,
    channels_sent JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    read_at TIMESTAMPTZ
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_notif_inbox
    ON poppies_notifications(site_id, recipient_artist_id, is_read, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_poppies_notif_type ON poppies_notifications(site_id, type);
`;

// ── Notification Dispatch ───────────────────────────────────────────
async function sendNotification(
  db: any,
  logger: any,
  opts: {
    siteId: string;
    recipientArtistId: string;
    type: string;
    title: string;
    body: string;
    link?: string;
    sourceType?: string;
    sourceId?: string;
  },
) {
  const channels: string[] = [];

  // Get preferences (or defaults)
  const prefResult = await db.execute({
    text: 'SELECT * FROM poppies_notification_preferences WHERE site_id = $1 AND artist_id = $2',
    values: [opts.siteId, opts.recipientArtistId],
  } as any);
  const prefRows = (prefResult as any).rows ?? prefResult;
  const prefs = prefRows[0] || {
    email_enabled: true, sms_enabled: false, push_enabled: false,
    shift_reminders: true, coverage_requests: true, new_messages: true, new_dm: true,
  };

  // Check if this notification type is enabled
  const typeEnabled =
    (opts.type.startsWith('shift') && prefs.shift_reminders) ||
    (opts.type === 'coverage_request' && prefs.coverage_requests) ||
    (opts.type === 'new_message' && prefs.new_messages) ||
    (opts.type === 'new_dm' && prefs.new_dm) ||
    (opts.type === 'coverage_accepted');
  if (!typeEnabled && opts.type !== 'coverage_accepted') {
    logger.debug({ type: opts.type, artist: opts.recipientArtistId }, 'Notification type disabled by preferences');
    return;
  }

  // Check quiet hours
  if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    if (prefs.quiet_hours_start <= prefs.quiet_hours_end) {
      if (currentTime >= prefs.quiet_hours_start && currentTime < prefs.quiet_hours_end) {
        logger.debug({ artist: opts.recipientArtistId }, 'Skipping notification — quiet hours');
        // Still create the in-app notification, just skip external channels
      }
    } else {
      // Wraps midnight (e.g., 22:00 - 08:00)
      if (currentTime >= prefs.quiet_hours_start || currentTime < prefs.quiet_hours_end) {
        logger.debug({ artist: opts.recipientArtistId }, 'Skipping notification — quiet hours');
      }
    }
  }

  // Always create in-app notification
  channels.push('app');

  // Get artist email/phone for external channels
  const artistResult = await db.execute({
    text: 'SELECT email, phone FROM poppies_consignment_artists WHERE id = $1',
    values: [opts.recipientArtistId],
  } as any);
  const artist = ((artistResult as any).rows ?? artistResult)[0];
  const email = prefs.email_address || artist?.email;
  const phone = prefs.phone_number || artist?.phone;

  // Email channel
  if (prefs.email_enabled && email) {
    try {
      // Use ACS or nodemailer — env-gated
      const acsConnStr = process.env.ACS_CONNECTION_STRING;
      if (acsConnStr) {
        // Lazy import to avoid breaking if @azure/communication-email not installed
        const { EmailClient } = await import('@azure/communication-email');
        const emailClient = new EmailClient(acsConnStr);
        await emailClient.beginSend({
          senderAddress: process.env.ACS_SENDER_ADDRESS || 'notifications@netrunsystems.com',
          content: { subject: opts.title, plainText: opts.body },
          recipients: { to: [{ address: email }] },
        });
        channels.push('email');
        logger.info({ to: email, type: opts.type }, 'Email notification sent');
      }
    } catch (err) {
      logger.warn({ err, to: email }, 'Email notification failed (non-fatal)');
    }
  }

  // SMS channel
  if (prefs.sms_enabled && phone) {
    try {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
      if (twilioSid && twilioToken && twilioFrom) {
        const twilio = await import('twilio');
        const client = (twilio as any).default?.(twilioSid, twilioToken) ?? (twilio as any)(twilioSid, twilioToken);
        await client.messages.create({
          body: `${opts.title}: ${opts.body}`,
          from: twilioFrom,
          to: phone,
        });
        channels.push('sms');
        logger.info({ to: phone, type: opts.type }, 'SMS notification sent');
      } else {
        logger.debug('SMS skipped — Twilio not configured');
      }
    } catch (err) {
      logger.warn({ err, to: phone }, 'SMS notification failed (non-fatal)');
    }
  }

  // Web Push channel
  if (prefs.push_enabled) {
    try {
      const webpush = await import('web-push');
      const vapidPublic = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
      const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:notifications@netrunsystems.com';

      if (vapidPublic && vapidPrivate) {
        webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

        const subsResult = await db.execute({
          text: 'SELECT * FROM poppies_push_subscriptions WHERE artist_id = $1',
          values: [opts.recipientArtistId],
        } as any);
        const subs = (subsResult as any).rows ?? subsResult;

        const payload = JSON.stringify({
          title: opts.title,
          body: opts.body,
          url: opts.link || '/',
          type: opts.type,
        });

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
              payload,
            );
          } catch (pushErr: any) {
            if (pushErr.statusCode === 410) {
              // Subscription expired — clean up
              await db.execute({
                text: 'DELETE FROM poppies_push_subscriptions WHERE id = $1',
                values: [sub.id],
              } as any);
            }
          }
        }
        if (subs.length > 0) channels.push('push');
      }
    } catch (err) {
      logger.warn({ err }, 'Push notification failed (non-fatal)');
    }
  }

  // Save notification record
  await db.execute({
    text: `
      INSERT INTO poppies_notifications
        (site_id, recipient_artist_id, type, title, body, link, source_type, source_id, channels_sent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    values: [
      opts.siteId, opts.recipientArtistId, opts.type, opts.title, opts.body,
      opts.link || null, opts.sourceType || null, opts.sourceId || null,
      JSON.stringify(channels),
    ],
  } as any);
}

const notificationsPlugin: CmsPlugin = {
  id: 'poppies-notifications',
  name: 'Poppies Notifications',
  version: '1.0.0',
  requiredEnv: [],

  async register(ctx) {
    await ctx.runMigration(MIGRATION_SQL);

    const db = ctx.db;
    const logger = ctx.logger;

    // ── Event Subscriptions (from shifts + messaging plugins) ─────────
    ctx.onEvent?.('shift.coverage_requested', async (event: any) => {
      const { siteId, shift, artistId } = event;
      // Notify all active artists in the site EXCEPT the requester
      const artists = await db.execute({
        text: "SELECT id FROM poppies_consignment_artists WHERE site_id = $1 AND status = 'active' AND id != $2",
        values: [siteId, artistId],
      } as any);
      const rows = (artists as any).rows ?? artists;
      const dateStr = shift.shift_date?.split?.('T')?.[0] || shift.shift_date;
      for (const artist of rows) {
        await sendNotification(db, logger, {
          siteId,
          recipientArtistId: artist.id,
          type: 'coverage_request',
          title: 'Shift Coverage Needed',
          body: `A shift on ${dateStr} (${shift.start_time}–${shift.end_time}) needs coverage.`,
          link: '/shifts/coverage',
          sourceType: 'shift',
          sourceId: shift.id,
        });
      }
    });

    ctx.onEvent?.('shift.coverage_accepted', async (event: any) => {
      const { siteId, requestingArtistId, acceptingArtistId } = event;
      // Notify the original requester
      const acceptor = await db.execute({
        text: 'SELECT artist_name FROM poppies_consignment_artists WHERE id = $1',
        values: [acceptingArtistId],
      } as any);
      const name = ((acceptor as any).rows ?? acceptor)[0]?.artist_name || 'Someone';
      await sendNotification(db, logger, {
        siteId,
        recipientArtistId: requestingArtistId,
        type: 'coverage_accepted',
        title: 'Shift Coverage Accepted',
        body: `${name} has picked up your shift.`,
        link: '/shifts',
        sourceType: 'shift',
      });
    });

    ctx.onEvent?.('message.sent', async (event: any) => {
      const { siteId, chatroomId, senderId, chatroomType } = event;
      // Notify chatroom members except sender
      const members = await db.execute({
        text: 'SELECT artist_id FROM poppies_chatroom_members WHERE chatroom_id = $1 AND artist_id != $2',
        values: [chatroomId, senderId],
      } as any);
      const memberRows = (members as any).rows ?? members;
      const senderResult = await db.execute({
        text: 'SELECT artist_name FROM poppies_consignment_artists WHERE id = $1',
        values: [senderId],
      } as any);
      const senderName = ((senderResult as any).rows ?? senderResult)[0]?.artist_name || 'Someone';

      const notifType = chatroomType === 'direct' ? 'new_dm' : 'new_message';
      const title = chatroomType === 'direct' ? `New message from ${senderName}` : `New message in chat`;
      const link = chatroomType === 'direct' ? '/messaging/dm' : `/messaging/rooms/${chatroomId}`;

      for (const member of memberRows) {
        await sendNotification(db, logger, {
          siteId,
          recipientArtistId: member.artist_id,
          type: notifType,
          title,
          body: `${senderName} sent a message.`,
          link,
          sourceType: 'message',
          sourceId: chatroomId,
        });
      }
    });

    // ── Preferences Routes ────────────────────────────────────────────
    const prefsRouter = Router({ mergeParams: true });

    // Get preferences
    prefsRouter.get('/:artistId', async (req, res) => {
      try {
        const { siteId, artistId } = req.params;
        const result = await db.execute({
          text: 'SELECT * FROM poppies_notification_preferences WHERE site_id = $1 AND artist_id = $2',
          values: [siteId, artistId],
        } as any);
        const rows = (result as any).rows ?? result;
        if (!rows.length) {
          // Return defaults
          return res.json({
            artist_id: artistId,
            email_enabled: true, sms_enabled: false, push_enabled: false,
            shift_reminders: true, coverage_requests: true, new_messages: true, new_dm: true,
          });
        }
        res.json(rows[0]);
      } catch (err) {
        logger.error({ err }, 'Failed to get preferences');
        res.status(500).json({ error: 'Failed to get preferences' });
      }
    });

    // Update preferences (upsert)
    prefsRouter.put('/:artistId', async (req, res) => {
      try {
        const { siteId, artistId } = req.params;
        const {
          email_enabled, sms_enabled, push_enabled, email_address, phone_number,
          quiet_hours_start, quiet_hours_end, shift_reminders, coverage_requests,
          new_messages, new_dm,
        } = req.body;

        const result = await db.execute({
          text: `
            INSERT INTO poppies_notification_preferences
              (site_id, artist_id, email_enabled, sms_enabled, push_enabled,
               email_address, phone_number, quiet_hours_start, quiet_hours_end,
               shift_reminders, coverage_requests, new_messages, new_dm)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (site_id, artist_id) DO UPDATE SET
              email_enabled = COALESCE($3, poppies_notification_preferences.email_enabled),
              sms_enabled = COALESCE($4, poppies_notification_preferences.sms_enabled),
              push_enabled = COALESCE($5, poppies_notification_preferences.push_enabled),
              email_address = COALESCE($6, poppies_notification_preferences.email_address),
              phone_number = COALESCE($7, poppies_notification_preferences.phone_number),
              quiet_hours_start = $8,
              quiet_hours_end = $9,
              shift_reminders = COALESCE($10, poppies_notification_preferences.shift_reminders),
              coverage_requests = COALESCE($11, poppies_notification_preferences.coverage_requests),
              new_messages = COALESCE($12, poppies_notification_preferences.new_messages),
              new_dm = COALESCE($13, poppies_notification_preferences.new_dm),
              updated_at = NOW()
            RETURNING *
          `,
          values: [
            siteId, artistId,
            email_enabled ?? true, sms_enabled ?? false, push_enabled ?? false,
            email_address || null, phone_number || null,
            quiet_hours_start || null, quiet_hours_end || null,
            shift_reminders ?? true, coverage_requests ?? true,
            new_messages ?? true, new_dm ?? true,
          ],
        } as any);
        res.json(((result as any).rows ?? result)[0]);
      } catch (err) {
        logger.error({ err }, 'Failed to update preferences');
        res.status(500).json({ error: 'Failed to update preferences' });
      }
    });

    // ── Push Subscription Routes ──────────────────────────────────────
    const pushRouter = Router({ mergeParams: true });

    // Get VAPID public key (for client-side subscription)
    pushRouter.get('/vapid-public-key', (_req, res) => {
      const key = process.env.VAPID_PUBLIC_KEY;
      if (!key) return res.status(503).json({ error: 'Push notifications not configured' });
      res.json({ publicKey: key });
    });

    // Register push subscription
    pushRouter.post('/subscribe', async (req, res) => {
      try {
        const { siteId } = req.params;
        const { artist_id, endpoint, p256dh_key, auth_key, user_agent } = req.body;
        if (!artist_id || !endpoint || !p256dh_key || !auth_key) {
          return res.status(400).json({ error: 'artist_id, endpoint, p256dh_key, and auth_key required' });
        }
        const result = await db.execute({
          text: `
            INSERT INTO poppies_push_subscriptions (site_id, artist_id, endpoint, p256dh_key, auth_key, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (endpoint) DO UPDATE SET
              artist_id = $2, p256dh_key = $4, auth_key = $5, user_agent = $6
            RETURNING *
          `,
          values: [siteId, artist_id, endpoint, p256dh_key, auth_key, user_agent || null],
        } as any);
        res.status(201).json(((result as any).rows ?? result)[0]);
      } catch (err) {
        logger.error({ err }, 'Failed to register push subscription');
        res.status(500).json({ error: 'Failed to register push subscription' });
      }
    });

    // Unsubscribe device
    pushRouter.delete('/subscribe/:subscriptionId', async (req, res) => {
      try {
        await db.execute({
          text: 'DELETE FROM poppies_push_subscriptions WHERE id = $1',
          values: [req.params.subscriptionId],
        } as any);
        res.json({ removed: true });
      } catch (err) {
        logger.error({ err }, 'Failed to remove push subscription');
        res.status(500).json({ error: 'Failed to remove push subscription' });
      }
    });

    // ── Inbox Routes ──────────────────────────────────────────────────
    const inboxRouter = Router({ mergeParams: true });

    // List notifications (inbox)
    inboxRouter.get('/', async (req, res) => {
      try {
        const { siteId } = req.params;
        const artistId = req.query.artist_id as string;
        const unreadOnly = req.query.unread_only === 'true';
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const offset = parseInt(req.query.offset as string) || 0;

        if (!artistId) return res.status(400).json({ error: 'artist_id required' });

        let query = `
          SELECT * FROM poppies_notifications
          WHERE site_id = $1 AND recipient_artist_id = $2
        `;
        const params: unknown[] = [siteId, artistId];

        if (unreadOnly) query += ' AND is_read = false';

        query += ' ORDER BY created_at DESC';
        params.push(limit);
        query += ` LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const result = await db.execute({ text: query, values: params } as any);
        res.json({ items: (result as any).rows ?? result });
      } catch (err) {
        logger.error({ err }, 'Failed to list notifications');
        res.status(500).json({ error: 'Failed to list notifications' });
      }
    });

    // Unread count
    inboxRouter.get('/count', async (req, res) => {
      try {
        const { siteId } = req.params;
        const artistId = req.query.artist_id as string;
        if (!artistId) return res.status(400).json({ error: 'artist_id required' });

        const result = await db.execute({
          text: 'SELECT COUNT(*) as count FROM poppies_notifications WHERE site_id = $1 AND recipient_artist_id = $2 AND is_read = false',
          values: [siteId, artistId],
        } as any);
        res.json({ unread: parseInt(((result as any).rows ?? result)[0]?.count || '0', 10) });
      } catch (err) {
        logger.error({ err }, 'Failed to get unread count');
        res.status(500).json({ error: 'Failed to get unread count' });
      }
    });

    // Mark single notification read
    inboxRouter.post('/:id/read', async (req, res) => {
      try {
        await db.execute({
          text: 'UPDATE poppies_notifications SET is_read = true, read_at = NOW() WHERE id = $1',
          values: [req.params.id],
        } as any);
        res.json({ marked: true });
      } catch (err) {
        logger.error({ err }, 'Failed to mark notification read');
        res.status(500).json({ error: 'Failed to mark notification read' });
      }
    });

    // Mark all read
    inboxRouter.post('/read-all', async (req, res) => {
      try {
        const { siteId } = req.params;
        const { artist_id } = req.body;
        await db.execute({
          text: 'UPDATE poppies_notifications SET is_read = true, read_at = NOW() WHERE site_id = $1 AND recipient_artist_id = $2 AND is_read = false',
          values: [siteId, artist_id],
        } as any);
        res.json({ marked: true });
      } catch (err) {
        logger.error({ err }, 'Failed to mark all read');
        res.status(500).json({ error: 'Failed to mark all read' });
      }
    });

    // Mount routes
    ctx.addRoutes('notifications/preferences', prefsRouter);
    ctx.addRoutes('notifications/push', pushRouter);
    ctx.addRoutes('notifications/inbox', inboxRouter);

    // Admin navigation
    ctx.addAdminNav({
      title: 'Notifications',
      siteScoped: true,
      items: [
        { label: 'Inbox', icon: 'Bell', href: 'notifications' },
        { label: 'Settings', icon: 'Settings', href: 'notifications/settings' },
      ],
    });

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/notifications', component: '@poppies/notifications/admin/Inbox' },
      { path: 'sites/:siteId/notifications/settings', component: '@poppies/notifications/admin/Settings' },
    ]);

    logger.info({ plugin: 'poppies-notifications' }, 'Poppies notifications plugin loaded');
  },
};

export default notificationsPlugin;
