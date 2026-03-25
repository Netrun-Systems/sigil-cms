/**
 * @poppies/messaging — Chatrooms and direct messaging for Poppies artists
 *
 * Group chatrooms (General, Announcements, etc.) maintain persistent
 * conversation history. Direct messages use the same chatroom model
 * with type='direct' for unified message queries.
 *
 * Tables:
 *   - poppies_chatrooms: group and DM conversation containers
 *   - poppies_chatroom_members: membership + last_read_at for unread tracking
 *   - poppies_messages: individual messages with pagination
 */

import { Router } from 'express';
import type { CmsPlugin } from '@netrun-cms/plugin-runtime';

const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS poppies_chatrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    type VARCHAR(20) DEFAULT 'group',
    created_by UUID,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_cr_site_type ON poppies_chatrooms(site_id, type);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_poppies_cr_site_slug ON poppies_chatrooms(site_id, slug);

  CREATE TABLE IF NOT EXISTS poppies_chatroom_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatroom_id UUID NOT NULL REFERENCES poppies_chatrooms(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES poppies_consignment_artists(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(chatroom_id, artist_id)
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_cm_artist ON poppies_chatroom_members(artist_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_cm_chatroom ON poppies_chatroom_members(chatroom_id);

  CREATE TABLE IF NOT EXISTS poppies_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    chatroom_id UUID NOT NULL REFERENCES poppies_chatrooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES poppies_consignment_artists(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_msg_room_time ON poppies_messages(chatroom_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_poppies_msg_site_sender ON poppies_messages(site_id, sender_id);
`;

const messagingPlugin: CmsPlugin = {
  id: 'poppies-messaging',
  name: 'Poppies Messaging',
  version: '1.0.0',
  requiredEnv: [],

  async register(ctx) {
    await ctx.runMigration(MIGRATION_SQL);

    const db = ctx.db;
    const logger = ctx.logger;

    // ── Chatroom Routes ───────────────────────────────────────────────
    const roomRouter = Router({ mergeParams: true });

    // List chatrooms the artist belongs to (with unread counts)
    roomRouter.get('/', async (req, res) => {
      try {
        const { siteId } = req.params;
        const artistId = req.query.artist_id as string;
        if (!artistId) return res.status(400).json({ error: 'artist_id query param required' });

        const result = await db.execute({
          text: `
            SELECT c.*, cm.last_read_at, cm.role as member_role,
              (SELECT COUNT(*) FROM poppies_messages m
               WHERE m.chatroom_id = c.id AND m.created_at > cm.last_read_at
               AND m.deleted_at IS NULL AND m.sender_id != $2) as unread_count,
              (SELECT body FROM poppies_messages m2
               WHERE m2.chatroom_id = c.id AND m2.deleted_at IS NULL
               ORDER BY m2.created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM poppies_messages m3
               WHERE m3.chatroom_id = c.id AND m3.deleted_at IS NULL
               ORDER BY m3.created_at DESC LIMIT 1) as last_message_at,
              (SELECT a.artist_name FROM poppies_messages m4
               JOIN poppies_consignment_artists a ON a.id = m4.sender_id
               WHERE m4.chatroom_id = c.id AND m4.deleted_at IS NULL
               ORDER BY m4.created_at DESC LIMIT 1) as last_message_sender
            FROM poppies_chatrooms c
            JOIN poppies_chatroom_members cm ON cm.chatroom_id = c.id AND cm.artist_id = $2
            WHERE c.site_id = $1 AND c.is_archived = false
            ORDER BY last_message_at DESC NULLS LAST
          `,
          values: [siteId, artistId],
        } as any);
        res.json({ items: (result as any).rows ?? result });
      } catch (err) {
        logger.error({ err }, 'Failed to list chatrooms');
        res.status(500).json({ error: 'Failed to list chatrooms' });
      }
    });

    // Create chatroom (admin)
    roomRouter.post('/', async (req, res) => {
      try {
        const { siteId } = req.params;
        const { name, description, member_ids } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const result = await db.execute({
          text: `
            INSERT INTO poppies_chatrooms (site_id, name, slug, description, type)
            VALUES ($1, $2, $3, $4, 'group')
            RETURNING *
          `,
          values: [siteId, name, slug, description || null],
        } as any);
        const room = ((result as any).rows ?? result)[0];

        // Add members if provided
        if (Array.isArray(member_ids) && member_ids.length > 0) {
          const memberValues = member_ids.map((_: string, i: number) => `($1, $${i + 2})`).join(', ');
          await db.execute({
            text: `INSERT INTO poppies_chatroom_members (chatroom_id, artist_id) VALUES ${memberValues} ON CONFLICT DO NOTHING`,
            values: [room.id, ...member_ids],
          } as any);
        }

        ctx.emitEvent?.('chatroom.created', { siteId, chatroom: room });
        res.status(201).json(room);
      } catch (err) {
        logger.error({ err }, 'Failed to create chatroom');
        res.status(500).json({ error: 'Failed to create chatroom' });
      }
    });

    // Add member to chatroom
    roomRouter.post('/:roomId/members', async (req, res) => {
      try {
        const { roomId } = req.params;
        const { artist_id } = req.body;
        await db.execute({
          text: 'INSERT INTO poppies_chatroom_members (chatroom_id, artist_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          values: [roomId, artist_id],
        } as any);
        res.json({ added: true });
      } catch (err) {
        logger.error({ err }, 'Failed to add member');
        res.status(500).json({ error: 'Failed to add member' });
      }
    });

    // Remove member
    roomRouter.delete('/:roomId/members/:artistId', async (req, res) => {
      try {
        const { roomId, artistId } = req.params;
        await db.execute({
          text: 'DELETE FROM poppies_chatroom_members WHERE chatroom_id = $1 AND artist_id = $2',
          values: [roomId, artistId],
        } as any);
        res.json({ removed: true });
      } catch (err) {
        logger.error({ err }, 'Failed to remove member');
        res.status(500).json({ error: 'Failed to remove member' });
      }
    });

    // Get chatroom members
    roomRouter.get('/:roomId/members', async (req, res) => {
      try {
        const { roomId } = req.params;
        const result = await db.execute({
          text: `
            SELECT cm.*, a.artist_name, a.email
            FROM poppies_chatroom_members cm
            JOIN poppies_consignment_artists a ON a.id = cm.artist_id
            WHERE cm.chatroom_id = $1
            ORDER BY a.artist_name ASC
          `,
          values: [roomId],
        } as any);
        res.json({ items: (result as any).rows ?? result });
      } catch (err) {
        logger.error({ err }, 'Failed to list members');
        res.status(500).json({ error: 'Failed to list members' });
      }
    });

    // ── Message Routes ────────────────────────────────────────────────
    const messageRouter = Router({ mergeParams: true });

    // Get messages (paginated, cursor-based)
    messageRouter.get('/:roomId/messages', async (req, res) => {
      try {
        const { roomId } = req.params;
        const before = req.query.before as string; // ISO timestamp cursor
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        let query = `
          SELECT m.*, a.artist_name as sender_name
          FROM poppies_messages m
          LEFT JOIN poppies_consignment_artists a ON a.id = m.sender_id
          WHERE m.chatroom_id = $1 AND m.deleted_at IS NULL
        `;
        const params: unknown[] = [roomId];

        if (before) {
          params.push(before);
          query += ` AND m.created_at < $${params.length}`;
        }

        params.push(limit);
        query += ` ORDER BY m.created_at DESC LIMIT $${params.length}`;

        const result = await db.execute({ text: query, values: params } as any);
        const rows = (result as any).rows ?? result;
        // Return in chronological order
        res.json({ items: rows.reverse(), hasMore: rows.length === limit });
      } catch (err) {
        logger.error({ err }, 'Failed to get messages');
        res.status(500).json({ error: 'Failed to get messages' });
      }
    });

    // Send message
    messageRouter.post('/:roomId/messages', async (req, res) => {
      try {
        const { siteId, roomId } = req.params;
        const { sender_id, body } = req.body;
        if (!sender_id || !body?.trim()) {
          return res.status(400).json({ error: 'sender_id and body required' });
        }

        const result = await db.execute({
          text: `
            INSERT INTO poppies_messages (site_id, chatroom_id, sender_id, body)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `,
          values: [siteId, roomId, sender_id, body.trim()],
        } as any);
        const msg = ((result as any).rows ?? result)[0];

        // Update chatroom's updated_at
        await db.execute({
          text: 'UPDATE poppies_chatrooms SET updated_at = NOW() WHERE id = $1',
          values: [roomId],
        } as any);

        // Update sender's last_read_at (they've seen their own message)
        await db.execute({
          text: 'UPDATE poppies_chatroom_members SET last_read_at = NOW() WHERE chatroom_id = $1 AND artist_id = $2',
          values: [roomId, sender_id],
        } as any);

        // Get chatroom type for event
        const roomResult = await db.execute({
          text: 'SELECT type FROM poppies_chatrooms WHERE id = $1',
          values: [roomId],
        } as any);
        const roomType = ((roomResult as any).rows ?? roomResult)[0]?.type || 'group';

        ctx.emitEvent?.('message.sent', {
          siteId, message: msg, chatroomId: roomId, senderId: sender_id, chatroomType: roomType,
        });

        res.status(201).json(msg);
      } catch (err) {
        logger.error({ err }, 'Failed to send message');
        res.status(500).json({ error: 'Failed to send message' });
      }
    });

    // Edit message (sender only)
    messageRouter.put('/:roomId/messages/:msgId', async (req, res) => {
      try {
        const { roomId, msgId } = req.params;
        const { sender_id, body } = req.body;
        const result = await db.execute({
          text: `
            UPDATE poppies_messages
            SET body = $3, edited_at = NOW()
            WHERE id = $1 AND chatroom_id = $2 AND sender_id = $4 AND deleted_at IS NULL
            RETURNING *
          `,
          values: [msgId, roomId, body, sender_id],
        } as any);
        const rows = (result as any).rows ?? result;
        if (!rows.length) return res.status(404).json({ error: 'Message not found or not your message' });
        res.json(rows[0]);
      } catch (err) {
        logger.error({ err }, 'Failed to edit message');
        res.status(500).json({ error: 'Failed to edit message' });
      }
    });

    // Soft-delete message
    messageRouter.delete('/:roomId/messages/:msgId', async (req, res) => {
      try {
        const { roomId, msgId } = req.params;
        const { sender_id } = req.body;
        await db.execute({
          text: `
            UPDATE poppies_messages SET deleted_at = NOW()
            WHERE id = $1 AND chatroom_id = $2 AND sender_id = $3
          `,
          values: [msgId, roomId, sender_id],
        } as any);
        res.json({ deleted: true });
      } catch (err) {
        logger.error({ err }, 'Failed to delete message');
        res.status(500).json({ error: 'Failed to delete message' });
      }
    });

    // ── Direct Messages ───────────────────────────────────────────────
    const dmRouter = Router({ mergeParams: true });

    // Find or create a DM chatroom between two artists
    dmRouter.post('/', async (req, res) => {
      try {
        const { siteId } = req.params;
        const { artist_id, recipient_id } = req.body;
        if (!artist_id || !recipient_id) {
          return res.status(400).json({ error: 'artist_id and recipient_id required' });
        }
        if (artist_id === recipient_id) {
          return res.status(400).json({ error: 'Cannot DM yourself' });
        }

        // Check for existing DM room with exactly these two members
        const existing = await db.execute({
          text: `
            SELECT c.* FROM poppies_chatrooms c
            WHERE c.site_id = $1 AND c.type = 'direct'
              AND EXISTS (SELECT 1 FROM poppies_chatroom_members m1 WHERE m1.chatroom_id = c.id AND m1.artist_id = $2)
              AND EXISTS (SELECT 1 FROM poppies_chatroom_members m2 WHERE m2.chatroom_id = c.id AND m2.artist_id = $3)
              AND (SELECT COUNT(*) FROM poppies_chatroom_members m3 WHERE m3.chatroom_id = c.id) = 2
            LIMIT 1
          `,
          values: [siteId, artist_id, recipient_id],
        } as any);
        const existingRows = (existing as any).rows ?? existing;

        if (existingRows.length) {
          return res.json(existingRows[0]);
        }

        // Create new DM room
        const names = await db.execute({
          text: 'SELECT id, artist_name FROM poppies_consignment_artists WHERE id IN ($1, $2)',
          values: [artist_id, recipient_id],
        } as any);
        const nameRows = (names as any).rows ?? names;
        const dmName = nameRows.map((r: any) => r.artist_name).join(' & ');

        const roomResult = await db.execute({
          text: `
            INSERT INTO poppies_chatrooms (site_id, name, type)
            VALUES ($1, $2, 'direct')
            RETURNING *
          `,
          values: [siteId, dmName],
        } as any);
        const room = ((roomResult as any).rows ?? roomResult)[0];

        // Add both members
        await db.execute({
          text: 'INSERT INTO poppies_chatroom_members (chatroom_id, artist_id) VALUES ($1, $2), ($1, $3)',
          values: [room.id, artist_id, recipient_id],
        } as any);

        res.status(201).json(room);
      } catch (err) {
        logger.error({ err }, 'Failed to find/create DM');
        res.status(500).json({ error: 'Failed to find/create DM' });
      }
    });

    // List DM conversations for an artist
    dmRouter.get('/:artistId', async (req, res) => {
      try {
        const { siteId, artistId } = req.params;
        const result = await db.execute({
          text: `
            SELECT c.*, cm.last_read_at,
              (SELECT COUNT(*) FROM poppies_messages m
               WHERE m.chatroom_id = c.id AND m.created_at > cm.last_read_at
               AND m.deleted_at IS NULL AND m.sender_id != $2) as unread_count,
              (SELECT body FROM poppies_messages m2
               WHERE m2.chatroom_id = c.id AND m2.deleted_at IS NULL
               ORDER BY m2.created_at DESC LIMIT 1) as last_message,
              (SELECT a2.artist_name FROM poppies_chatroom_members cm2
               JOIN poppies_consignment_artists a2 ON a2.id = cm2.artist_id
               WHERE cm2.chatroom_id = c.id AND cm2.artist_id != $2
               LIMIT 1) as other_artist_name
            FROM poppies_chatrooms c
            JOIN poppies_chatroom_members cm ON cm.chatroom_id = c.id AND cm.artist_id = $2
            WHERE c.site_id = $1 AND c.type = 'direct' AND c.is_archived = false
            ORDER BY c.updated_at DESC
          `,
          values: [siteId, artistId],
        } as any);
        res.json({ items: (result as any).rows ?? result });
      } catch (err) {
        logger.error({ err }, 'Failed to list DMs');
        res.status(500).json({ error: 'Failed to list DMs' });
      }
    });

    // ── Read Tracking ─────────────────────────────────────────────────
    const readRouter = Router({ mergeParams: true });

    // Mark chatroom as read
    readRouter.post('/:roomId/read', async (req, res) => {
      try {
        const { roomId } = req.params;
        const { artist_id } = req.body;
        await db.execute({
          text: 'UPDATE poppies_chatroom_members SET last_read_at = NOW() WHERE chatroom_id = $1 AND artist_id = $2',
          values: [roomId, artist_id],
        } as any);
        res.json({ marked: true });
      } catch (err) {
        logger.error({ err }, 'Failed to mark read');
        res.status(500).json({ error: 'Failed to mark read' });
      }
    });

    // Get total unread count across all rooms
    readRouter.get('/unread', async (req, res) => {
      try {
        const { siteId } = req.params;
        const artistId = req.query.artist_id as string;
        if (!artistId) return res.status(400).json({ error: 'artist_id required' });

        const result = await db.execute({
          text: `
            SELECT COALESCE(SUM(sub.cnt), 0) as total_unread FROM (
              SELECT COUNT(*) as cnt
              FROM poppies_chatroom_members cm
              JOIN poppies_messages m ON m.chatroom_id = cm.chatroom_id
              WHERE cm.artist_id = $1 AND m.site_id = $2
                AND m.created_at > cm.last_read_at
                AND m.deleted_at IS NULL
                AND m.sender_id != $1
            ) sub
          `,
          values: [artistId, siteId],
        } as any);
        const rows = (result as any).rows ?? result;
        res.json({ unread: parseInt(rows[0]?.total_unread || '0', 10) });
      } catch (err) {
        logger.error({ err }, 'Failed to get unread count');
        res.status(500).json({ error: 'Failed to get unread count' });
      }
    });

    // Mount routes
    ctx.addRoutes('messaging/rooms', roomRouter);
    ctx.addRoutes('messaging', messageRouter);
    ctx.addRoutes('messaging/dm', dmRouter);
    ctx.addRoutes('messaging', readRouter);

    // Admin navigation
    ctx.addAdminNav({
      title: 'Messaging',
      siteScoped: true,
      items: [
        { label: 'Chatrooms', icon: 'MessageCircle', href: 'messaging' },
        { label: 'Direct Messages', icon: 'Mail', href: 'messaging/dm' },
      ],
    });

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/messaging', component: '@poppies/messaging/admin/ChatroomsList' },
      { path: 'sites/:siteId/messaging/rooms/:roomId', component: '@poppies/messaging/admin/Chatroom' },
      { path: 'sites/:siteId/messaging/dm', component: '@poppies/messaging/admin/DirectMessages' },
    ]);

    logger.info({ plugin: 'poppies-messaging' }, 'Poppies messaging plugin loaded');
  },
};

export default messagingPlugin;
