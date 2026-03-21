/**
 * Consignment CRUD routes — artists, items, and sales
 *
 * All routes are site-scoped: mounted under /api/v1/sites/:siteId/consignment/*
 * Auth is handled by the platform middleware before these routes.
 */

import { Router } from 'express';
import type { Router as IRouter } from 'express';
import type { DrizzleClient, PluginLogger } from '@netrun-cms/plugin-runtime';

export function createConsignmentRoutes(db: DrizzleClient, logger: PluginLogger): {
  artistRouter: IRouter;
  itemRouter: IRouter;
  salesRouter: IRouter;
} {
  // ── Artist routes ─────────────────────────────────────────────────
  const artistRouter = Router({ mergeParams: true });

  // List consignment artists
  artistRouter.get('/', async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      let query = `
        SELECT * FROM poppies_consignment_artists
        WHERE site_id = $1
      `;
      const params: unknown[] = [siteId];

      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        query += ` AND (artist_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
      }

      query += ' ORDER BY artist_name ASC';

      const result = await db.execute({ text: query, values: params } as any);
      res.json({ items: (result as any).rows ?? result, total: ((result as any).rows ?? result as any[]).length });
    } catch (err) {
      logger.error({ err, route: 'GET consignment/artists' }, 'Failed to list consignment artists');
      res.status(500).json({ error: 'Failed to list artists' });
    }
  });

  // Get single artist with summary stats
  artistRouter.get('/:id', async (req, res) => {
    try {
      const { siteId, id } = req.params;
      const result = await db.execute({
        text: `
          SELECT a.*,
            COALESCE(s.total_sales, 0) as lifetime_sales,
            COALESCE(s.total_share, 0) as lifetime_artist_share,
            COALESCE(s.sale_count, 0) as lifetime_sale_count,
            COALESCE(i.item_count, 0) as active_items
          FROM poppies_consignment_artists a
          LEFT JOIN LATERAL (
            SELECT SUM(sale_amount) as total_sales,
                   SUM(artist_share) as total_share,
                   COUNT(*) as sale_count
            FROM poppies_consignment_sales WHERE artist_id = a.id
          ) s ON true
          LEFT JOIN LATERAL (
            SELECT COUNT(*) as item_count
            FROM poppies_consignment_items WHERE artist_id = a.id AND status = 'active'
          ) i ON true
          WHERE a.id = $1 AND a.site_id = $2
        `,
        values: [id, siteId],
      } as any);

      const rows = (result as any).rows ?? result;
      if (!rows || (rows as any[]).length === 0) {
        return res.status(404).json({ error: 'Artist not found' });
      }
      res.json(rows[0]);
    } catch (err) {
      logger.error({ err, route: 'GET consignment/artists/:id' }, 'Failed to get artist');
      res.status(500).json({ error: 'Failed to get artist' });
    }
  });

  // Create artist
  artistRouter.post('/', async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const { artist_name, artist_slug, email, phone, commission_rate, rental_tier, notes } = req.body;

      if (!artist_name) {
        return res.status(400).json({ error: 'artist_name is required' });
      }

      const result = await db.execute({
        text: `
          INSERT INTO poppies_consignment_artists
            (site_id, artist_name, artist_slug, email, phone, commission_rate, rental_tier, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `,
        values: [
          siteId, artist_name,
          artist_slug || artist_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          email || null, phone || null,
          commission_rate ?? 60.00, rental_tier || 'standard',
          notes || null,
        ],
      } as any);

      const rows = (result as any).rows ?? result;
      res.status(201).json(rows[0]);
    } catch (err) {
      logger.error({ err, route: 'POST consignment/artists' }, 'Failed to create artist');
      res.status(500).json({ error: 'Failed to create artist' });
    }
  });

  // Update artist
  artistRouter.put('/:id', async (req, res) => {
    try {
      const { siteId, id } = req.params;
      const { artist_name, artist_slug, email, phone, commission_rate, rental_tier, status, notes } = req.body;

      const result = await db.execute({
        text: `
          UPDATE poppies_consignment_artists SET
            artist_name = COALESCE($3, artist_name),
            artist_slug = COALESCE($4, artist_slug),
            email = COALESCE($5, email),
            phone = COALESCE($6, phone),
            commission_rate = COALESCE($7, commission_rate),
            rental_tier = COALESCE($8, rental_tier),
            status = COALESCE($9, status),
            notes = COALESCE($10, notes),
            updated_at = NOW()
          WHERE id = $1 AND site_id = $2
          RETURNING *
        `,
        values: [id, siteId, artist_name, artist_slug, email, phone, commission_rate, rental_tier, status, notes],
      } as any);

      const rows = (result as any).rows ?? result;
      if (!rows || (rows as any[]).length === 0) {
        return res.status(404).json({ error: 'Artist not found' });
      }
      res.json(rows[0]);
    } catch (err) {
      logger.error({ err, route: 'PUT consignment/artists/:id' }, 'Failed to update artist');
      res.status(500).json({ error: 'Failed to update artist' });
    }
  });

  // ── Item routes ───────────────────────────────────────────────────
  const itemRouter = Router({ mergeParams: true });

  // List items (optionally filtered by artist)
  itemRouter.get('/', async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const artistId = req.query.artist_id as string | undefined;
      const status = req.query.status as string | undefined;

      let query = `
        SELECT i.*, a.artist_name
        FROM poppies_consignment_items i
        JOIN poppies_consignment_artists a ON a.id = i.artist_id
        WHERE i.site_id = $1
      `;
      const params: unknown[] = [siteId];

      if (artistId) {
        params.push(artistId);
        query += ` AND i.artist_id = $${params.length}`;
      }
      if (status) {
        params.push(status);
        query += ` AND i.status = $${params.length}`;
      }

      query += ' ORDER BY i.created_at DESC';

      const result = await db.execute({ text: query, values: params } as any);
      const rows = (result as any).rows ?? result;
      res.json({ items: rows, total: (rows as any[]).length });
    } catch (err) {
      logger.error({ err, route: 'GET consignment/items' }, 'Failed to list items');
      res.status(500).json({ error: 'Failed to list items' });
    }
  });

  // Create item
  itemRouter.post('/', async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const { artist_id, name, sku, description, category, unit_price, quantity_on_hand, image_url } = req.body;

      if (!artist_id || !name || unit_price === undefined) {
        return res.status(400).json({ error: 'artist_id, name, and unit_price are required' });
      }

      const result = await db.execute({
        text: `
          INSERT INTO poppies_consignment_items
            (site_id, artist_id, name, sku, description, category, unit_price, quantity_on_hand, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `,
        values: [siteId, artist_id, name, sku || null, description || null, category || null,
                 unit_price, quantity_on_hand ?? 1, image_url || null],
      } as any);

      const rows = (result as any).rows ?? result;
      res.status(201).json(rows[0]);
    } catch (err) {
      logger.error({ err, route: 'POST consignment/items' }, 'Failed to create item');
      res.status(500).json({ error: 'Failed to create item' });
    }
  });

  // Update item
  itemRouter.put('/:id', async (req, res) => {
    try {
      const { siteId, id } = req.params;
      const { name, sku, description, category, unit_price, quantity_on_hand, status, image_url } = req.body;

      const result = await db.execute({
        text: `
          UPDATE poppies_consignment_items SET
            name = COALESCE($3, name),
            sku = COALESCE($4, sku),
            description = COALESCE($5, description),
            category = COALESCE($6, category),
            unit_price = COALESCE($7, unit_price),
            quantity_on_hand = COALESCE($8, quantity_on_hand),
            status = COALESCE($9, status),
            image_url = COALESCE($10, image_url),
            updated_at = NOW()
          WHERE id = $1 AND site_id = $2
          RETURNING *
        `,
        values: [id, siteId, name, sku, description, category, unit_price, quantity_on_hand, status, image_url],
      } as any);

      const rows = (result as any).rows ?? result;
      if (!rows || (rows as any[]).length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json(rows[0]);
    } catch (err) {
      logger.error({ err, route: 'PUT consignment/items/:id' }, 'Failed to update item');
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  // ── Sales routes ──────────────────────────────────────────────────
  const salesRouter = Router({ mergeParams: true });

  // List sales with filters
  salesRouter.get('/', async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const artistId = req.query.artist_id as string | undefined;
      const status = req.query.status as string | undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      let query = `
        SELECT s.*, a.artist_name, i.name as item_name, i.sku
        FROM poppies_consignment_sales s
        JOIN poppies_consignment_artists a ON a.id = s.artist_id
        LEFT JOIN poppies_consignment_items i ON i.id = s.item_id
        WHERE s.site_id = $1
      `;
      const params: unknown[] = [siteId];

      if (artistId) {
        params.push(artistId);
        query += ` AND s.artist_id = $${params.length}`;
      }
      if (status) {
        params.push(status);
        query += ` AND s.status = $${params.length}`;
      }
      if (from) {
        params.push(from);
        query += ` AND s.sale_date >= $${params.length}`;
      }
      if (to) {
        params.push(to);
        query += ` AND s.sale_date <= $${params.length}`;
      }

      query += ' ORDER BY s.sale_date DESC';

      const result = await db.execute({ text: query, values: params } as any);
      const rows = (result as any).rows ?? result;
      res.json({ items: rows, total: (rows as any[]).length });
    } catch (err) {
      logger.error({ err, route: 'GET consignment/sales' }, 'Failed to list sales');
      res.status(500).json({ error: 'Failed to list sales' });
    }
  });

  // Record a manual sale (for cash/non-Square transactions)
  salesRouter.post('/', async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const { item_id, artist_id, quantity, sale_amount, sale_date } = req.body;

      if (!artist_id || !sale_amount) {
        return res.status(400).json({ error: 'artist_id and sale_amount are required' });
      }

      // Look up artist commission rate
      const artistResult = await db.execute({
        text: 'SELECT commission_rate FROM poppies_consignment_artists WHERE id = $1 AND site_id = $2',
        values: [artist_id, siteId],
      } as any);

      const artists = (artistResult as any).rows ?? artistResult;
      if (!artists || (artists as any[]).length === 0) {
        return res.status(404).json({ error: 'Artist not found' });
      }

      const commissionRate = Number((artists as any[])[0].commission_rate);
      const artistShare = Math.round(sale_amount * (commissionRate / 100));
      const storeShare = sale_amount - artistShare;

      const result = await db.execute({
        text: `
          INSERT INTO poppies_consignment_sales
            (site_id, item_id, artist_id, quantity, sale_amount, artist_share, store_share,
             commission_rate_applied, sale_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `,
        values: [siteId, item_id || null, artist_id, quantity ?? 1, sale_amount,
                 artistShare, storeShare, commissionRate, sale_date || new Date().toISOString()],
      } as any);

      const rows = (result as any).rows ?? result;
      res.status(201).json(rows[0]);
    } catch (err) {
      logger.error({ err, route: 'POST consignment/sales' }, 'Failed to record sale');
      res.status(500).json({ error: 'Failed to record sale' });
    }
  });

  return { artistRouter, itemRouter, salesRouter };
}
