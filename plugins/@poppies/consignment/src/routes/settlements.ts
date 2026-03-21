/**
 * Settlement routes — monthly payout summaries per artist
 *
 * Generates, reviews, and marks settlements as paid.
 * Settlement = aggregation of all unsettled sales for an artist in a given month.
 */

import { Router } from 'express';
import type { DrizzleClient, PluginLogger } from '@netrun-cms/plugin-runtime';

export function createSettlementRoutes(db: DrizzleClient, logger: PluginLogger): Router {
  const router = Router({ mergeParams: true });

  // List settlements
  router.get('/', async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const artistId = req.query.artist_id as string | undefined;
      const status = req.query.status as string | undefined;

      let query = `
        SELECT s.*, a.artist_name, a.email as artist_email
        FROM poppies_consignment_settlements s
        JOIN poppies_consignment_artists a ON a.id = s.artist_id
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

      query += ' ORDER BY s.period_start DESC, a.artist_name ASC';

      const result = await db.execute({ text: query, values: params } as any);
      const rows = (result as any).rows ?? result;
      res.json({ items: rows, total: (rows as any[]).length });
    } catch (err) {
      logger.error({ err, route: 'GET settlements' }, 'Failed to list settlements');
      res.status(500).json({ error: 'Failed to list settlements' });
    }
  });

  // Get settlement detail with line items
  router.get('/:id', async (req, res) => {
    try {
      const { siteId, id } = req.params;

      const settlementResult = await db.execute({
        text: `
          SELECT s.*, a.artist_name, a.email as artist_email, a.commission_rate
          FROM poppies_consignment_settlements s
          JOIN poppies_consignment_artists a ON a.id = s.artist_id
          WHERE s.id = $1 AND s.site_id = $2
        `,
        values: [id, siteId],
      } as any);

      const settlements = (settlementResult as any).rows ?? settlementResult;
      if (!settlements || (settlements as any[]).length === 0) {
        return res.status(404).json({ error: 'Settlement not found' });
      }

      // Get the sales included in this settlement
      const salesResult = await db.execute({
        text: `
          SELECT s.*, i.name as item_name, i.sku
          FROM poppies_consignment_sales s
          LEFT JOIN poppies_consignment_items i ON i.id = s.item_id
          WHERE s.settlement_id = $1
          ORDER BY s.sale_date ASC
        `,
        values: [id],
      } as any);

      const sales = (salesResult as any).rows ?? salesResult;
      res.json({ ...settlements[0], sales });
    } catch (err) {
      logger.error({ err, route: 'GET settlements/:id' }, 'Failed to get settlement');
      res.status(500).json({ error: 'Failed to get settlement' });
    }
  });

  // Generate settlements for a given month
  // POST /settlements/generate { period_start: '2026-03-01', period_end: '2026-03-31' }
  router.post('/generate', async (req, res) => {
    try {
      const siteId = req.params.siteId;
      const { period_start, period_end } = req.body;

      if (!period_start || !period_end) {
        return res.status(400).json({ error: 'period_start and period_end are required' });
      }

      // Find all artists with unsettled sales in the period
      const salesSummary = await db.execute({
        text: `
          SELECT
            artist_id,
            SUM(sale_amount) as total_sales,
            SUM(artist_share) as total_artist_share,
            SUM(store_share) as total_store_share,
            COUNT(*) as sale_count
          FROM poppies_consignment_sales
          WHERE site_id = $1
            AND settlement_id IS NULL
            AND status = 'pending'
            AND sale_date >= $2
            AND sale_date <= $3
          GROUP BY artist_id
        `,
        values: [siteId, period_start, period_end],
      } as any);

      const summaries = (salesSummary as any).rows ?? salesSummary;
      const created: unknown[] = [];

      for (const summary of summaries as any[]) {
        // Create settlement record
        const insertResult = await db.execute({
          text: `
            INSERT INTO poppies_consignment_settlements
              (site_id, artist_id, period_start, period_end, total_sales, total_artist_share,
               total_store_share, sale_count, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
            RETURNING *
          `,
          values: [
            siteId, summary.artist_id, period_start, period_end,
            summary.total_sales, summary.total_artist_share,
            summary.total_store_share, summary.sale_count,
          ],
        } as any);

        const settlement = ((insertResult as any).rows ?? insertResult)[0];

        // Link sales to this settlement
        await db.execute({
          text: `
            UPDATE poppies_consignment_sales SET settlement_id = $1, status = 'settled'
            WHERE site_id = $2 AND artist_id = $3 AND settlement_id IS NULL
              AND status = 'pending' AND sale_date >= $4 AND sale_date <= $5
          `,
          values: [settlement.id, siteId, summary.artist_id, period_start, period_end],
        } as any);

        created.push(settlement);
      }

      logger.info(
        { plugin: 'poppies-consignment', settlements: created.length, period_start, period_end },
        'Generated settlements',
      );

      res.status(201).json({
        message: `Generated ${created.length} settlements for ${period_start} to ${period_end}`,
        settlements: created,
      });
    } catch (err) {
      logger.error({ err, route: 'POST settlements/generate' }, 'Failed to generate settlements');
      res.status(500).json({ error: 'Failed to generate settlements' });
    }
  });

  // Mark settlement as paid
  router.put('/:id/pay', async (req, res) => {
    try {
      const { siteId, id } = req.params;
      const { payment_method, payment_reference, notes } = req.body;

      const result = await db.execute({
        text: `
          UPDATE poppies_consignment_settlements SET
            status = 'paid',
            paid_at = NOW(),
            payment_method = $3,
            payment_reference = $4,
            notes = COALESCE($5, notes),
            updated_at = NOW()
          WHERE id = $1 AND site_id = $2 AND status = 'draft'
          RETURNING *
        `,
        values: [id, siteId, payment_method || 'check', payment_reference || null, notes],
      } as any);

      const rows = (result as any).rows ?? result;
      if (!rows || (rows as any[]).length === 0) {
        return res.status(404).json({ error: 'Settlement not found or already paid' });
      }
      res.json(rows[0]);
    } catch (err) {
      logger.error({ err, route: 'PUT settlements/:id/pay' }, 'Failed to mark settlement paid');
      res.status(500).json({ error: 'Failed to mark settlement paid' });
    }
  });

  return router;
}
