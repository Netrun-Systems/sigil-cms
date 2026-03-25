/**
 * @poppies/shifts — Shift scheduling for Poppies Art & Gifts
 *
 * Artists can view, claim, and unclaim shifts. Request shift coverage
 * when they can't make it. Admins create and delete shifts.
 *
 * Tables:
 *   - poppies_shifts: individual shift slots with date/time/role
 *   - poppies_shift_coverage_requests: coverage swap requests between artists
 */

import { Router } from 'express';
import type { CmsPlugin } from '@netrun-cms/plugin-runtime';

const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS poppies_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    role VARCHAR(100) DEFAULT 'floor',
    notes TEXT,
    assigned_artist_id UUID REFERENCES poppies_consignment_artists(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'open',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_sh_site_date ON poppies_shifts(site_id, shift_date);
  CREATE INDEX IF NOT EXISTS idx_poppies_sh_artist ON poppies_shifts(site_id, assigned_artist_id);
  CREATE INDEX IF NOT EXISTS idx_poppies_sh_status ON poppies_shifts(site_id, status);

  CREATE TABLE IF NOT EXISTS poppies_shift_coverage_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES cms_sites(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES poppies_shifts(id) ON DELETE CASCADE,
    requesting_artist_id UUID NOT NULL REFERENCES poppies_consignment_artists(id) ON DELETE CASCADE,
    accepting_artist_id UUID REFERENCES poppies_consignment_artists(id) ON DELETE SET NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMPTZ
  );

  CREATE INDEX IF NOT EXISTS idx_poppies_scr_site_status ON poppies_shift_coverage_requests(site_id, status);
  CREATE INDEX IF NOT EXISTS idx_poppies_scr_shift ON poppies_shift_coverage_requests(shift_id);
`;

const shiftsPlugin: CmsPlugin = {
  id: 'poppies-shifts',
  name: 'Poppies Shifts',
  version: '1.0.0',
  requiredEnv: [],

  async register(ctx) {
    await ctx.runMigration(MIGRATION_SQL);

    const db = ctx.db;
    const logger = ctx.logger;

    // ── Shift CRUD ────────────────────────────────────────────────────
    const shiftRouter = Router({ mergeParams: true });

    // List shifts (with date range, artist, status filters)
    shiftRouter.get('/', async (req, res) => {
      try {
        const { siteId } = req.params;
        const { from, to, artist_id, status, role } = req.query;
        let query = `
          SELECT s.*, a.artist_name as assigned_artist_name, a.email as assigned_artist_email
          FROM poppies_shifts s
          LEFT JOIN poppies_consignment_artists a ON a.id = s.assigned_artist_id
          WHERE s.site_id = $1
        `;
        const params: unknown[] = [siteId];

        if (from) { params.push(from); query += ` AND s.shift_date >= $${params.length}`; }
        if (to) { params.push(to); query += ` AND s.shift_date <= $${params.length}`; }
        if (artist_id) { params.push(artist_id); query += ` AND s.assigned_artist_id = $${params.length}`; }
        if (status) { params.push(status); query += ` AND s.status = $${params.length}`; }
        if (role) { params.push(role); query += ` AND s.role = $${params.length}`; }

        query += ' ORDER BY s.shift_date ASC, s.start_time ASC';
        const result = await db.execute({ text: query, values: params } as any);
        const rows = (result as any).rows ?? result;
        res.json({ items: rows, total: rows.length });
      } catch (err) {
        logger.error({ err }, 'Failed to list shifts');
        res.status(500).json({ error: 'Failed to list shifts' });
      }
    });

    // Today's shifts
    shiftRouter.get('/today', async (req, res) => {
      try {
        const { siteId } = req.params;
        const result = await db.execute({
          text: `
            SELECT s.*, a.artist_name as assigned_artist_name
            FROM poppies_shifts s
            LEFT JOIN poppies_consignment_artists a ON a.id = s.assigned_artist_id
            WHERE s.site_id = $1 AND s.shift_date = CURRENT_DATE
            ORDER BY s.start_time ASC
          `,
          values: [siteId],
        } as any);
        res.json({ items: (result as any).rows ?? result });
      } catch (err) {
        logger.error({ err }, 'Failed to get today shifts');
        res.status(500).json({ error: 'Failed to get today shifts' });
      }
    });

    // This week's shifts
    shiftRouter.get('/week', async (req, res) => {
      try {
        const { siteId } = req.params;
        const result = await db.execute({
          text: `
            SELECT s.*, a.artist_name as assigned_artist_name
            FROM poppies_shifts s
            LEFT JOIN poppies_consignment_artists a ON a.id = s.assigned_artist_id
            WHERE s.site_id = $1
              AND s.shift_date >= CURRENT_DATE
              AND s.shift_date < CURRENT_DATE + INTERVAL '7 days'
            ORDER BY s.shift_date ASC, s.start_time ASC
          `,
          values: [siteId],
        } as any);
        res.json({ items: (result as any).rows ?? result });
      } catch (err) {
        logger.error({ err }, 'Failed to get week shifts');
        res.status(500).json({ error: 'Failed to get week shifts' });
      }
    });

    // Create shift
    shiftRouter.post('/', async (req, res) => {
      try {
        const { siteId } = req.params;
        const { shift_date, start_time, end_time, role, notes, assigned_artist_id } = req.body;
        if (!shift_date || !start_time || !end_time) {
          return res.status(400).json({ error: 'shift_date, start_time, and end_time are required' });
        }
        const status = assigned_artist_id ? 'claimed' : 'open';
        const result = await db.execute({
          text: `
            INSERT INTO poppies_shifts (site_id, shift_date, start_time, end_time, role, notes, assigned_artist_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `,
          values: [siteId, shift_date, start_time, end_time, role || 'floor', notes || null, assigned_artist_id || null, status],
        } as any);
        const shift = ((result as any).rows ?? result)[0];
        ctx.emitEvent?.('shift.created', { siteId, shift });
        res.status(201).json(shift);
      } catch (err) {
        logger.error({ err }, 'Failed to create shift');
        res.status(500).json({ error: 'Failed to create shift' });
      }
    });

    // Update shift
    shiftRouter.put('/:id', async (req, res) => {
      try {
        const { siteId, id } = req.params;
        const { shift_date, start_time, end_time, role, notes } = req.body;
        const result = await db.execute({
          text: `
            UPDATE poppies_shifts
            SET shift_date = COALESCE($3, shift_date),
                start_time = COALESCE($4, start_time),
                end_time = COALESCE($5, end_time),
                role = COALESCE($6, role),
                notes = COALESCE($7, notes),
                updated_at = NOW()
            WHERE id = $1 AND site_id = $2
            RETURNING *
          `,
          values: [id, siteId, shift_date, start_time, end_time, role, notes],
        } as any);
        const rows = (result as any).rows ?? result;
        if (!rows.length) return res.status(404).json({ error: 'Shift not found' });
        res.json(rows[0]);
      } catch (err) {
        logger.error({ err }, 'Failed to update shift');
        res.status(500).json({ error: 'Failed to update shift' });
      }
    });

    // Delete shift
    shiftRouter.delete('/:id', async (req, res) => {
      try {
        const { siteId, id } = req.params;
        await db.execute({
          text: 'DELETE FROM poppies_shifts WHERE id = $1 AND site_id = $2',
          values: [id, siteId],
        } as any);
        res.json({ deleted: true });
      } catch (err) {
        logger.error({ err }, 'Failed to delete shift');
        res.status(500).json({ error: 'Failed to delete shift' });
      }
    });

    // Claim shift
    shiftRouter.post('/:id/claim', async (req, res) => {
      try {
        const { siteId, id } = req.params;
        const { artist_id } = req.body;
        if (!artist_id) return res.status(400).json({ error: 'artist_id required' });

        const result = await db.execute({
          text: `
            UPDATE poppies_shifts
            SET assigned_artist_id = $3, status = 'claimed', updated_at = NOW()
            WHERE id = $1 AND site_id = $2 AND status = 'open'
            RETURNING *
          `,
          values: [id, siteId, artist_id],
        } as any);
        const rows = (result as any).rows ?? result;
        if (!rows.length) return res.status(409).json({ error: 'Shift not available or already claimed' });
        ctx.emitEvent?.('shift.claimed', { siteId, shift: rows[0], artistId: artist_id });
        res.json(rows[0]);
      } catch (err) {
        logger.error({ err }, 'Failed to claim shift');
        res.status(500).json({ error: 'Failed to claim shift' });
      }
    });

    // Unclaim shift
    shiftRouter.post('/:id/unclaim', async (req, res) => {
      try {
        const { siteId, id } = req.params;
        const { artist_id } = req.body;
        const result = await db.execute({
          text: `
            UPDATE poppies_shifts
            SET assigned_artist_id = NULL, status = 'open', updated_at = NOW()
            WHERE id = $1 AND site_id = $2 AND assigned_artist_id = $3
            RETURNING *
          `,
          values: [id, siteId, artist_id],
        } as any);
        const rows = (result as any).rows ?? result;
        if (!rows.length) return res.status(404).json({ error: 'Shift not found or not assigned to this artist' });
        ctx.emitEvent?.('shift.unclaimed', { siteId, shift: rows[0], artistId: artist_id });
        res.json(rows[0]);
      } catch (err) {
        logger.error({ err }, 'Failed to unclaim shift');
        res.status(500).json({ error: 'Failed to unclaim shift' });
      }
    });

    // ── Coverage Requests ─────────────────────────────────────────────
    const coverageRouter = Router({ mergeParams: true });

    // List open coverage requests
    coverageRouter.get('/', async (req, res) => {
      try {
        const { siteId } = req.params;
        const statusFilter = (req.query.status as string) || 'open';
        const result = await db.execute({
          text: `
            SELECT cr.*, s.shift_date, s.start_time, s.end_time, s.role,
              ra.artist_name as requesting_artist_name,
              aa.artist_name as accepting_artist_name
            FROM poppies_shift_coverage_requests cr
            JOIN poppies_shifts s ON s.id = cr.shift_id
            JOIN poppies_consignment_artists ra ON ra.id = cr.requesting_artist_id
            LEFT JOIN poppies_consignment_artists aa ON aa.id = cr.accepting_artist_id
            WHERE cr.site_id = $1 AND cr.status = $2
            ORDER BY s.shift_date ASC, s.start_time ASC
          `,
          values: [siteId, statusFilter],
        } as any);
        res.json({ items: (result as any).rows ?? result });
      } catch (err) {
        logger.error({ err }, 'Failed to list coverage requests');
        res.status(500).json({ error: 'Failed to list coverage requests' });
      }
    });

    // Request coverage for a claimed shift
    coverageRouter.post('/:shiftId', async (req, res) => {
      try {
        const { siteId, shiftId } = req.params;
        const { artist_id, reason } = req.body;
        if (!artist_id) return res.status(400).json({ error: 'artist_id required' });

        // Verify shift belongs to this artist
        const shiftCheck = await db.execute({
          text: 'SELECT * FROM poppies_shifts WHERE id = $1 AND site_id = $2 AND assigned_artist_id = $3',
          values: [shiftId, siteId, artist_id],
        } as any);
        const shiftRows = (shiftCheck as any).rows ?? shiftCheck;
        if (!shiftRows.length) return res.status(403).json({ error: 'Shift not assigned to this artist' });

        // Mark shift as coverage_requested
        await db.execute({
          text: "UPDATE poppies_shifts SET status = 'coverage_requested', updated_at = NOW() WHERE id = $1",
          values: [shiftId],
        } as any);

        const result = await db.execute({
          text: `
            INSERT INTO poppies_shift_coverage_requests (site_id, shift_id, requesting_artist_id, reason)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `,
          values: [siteId, shiftId, artist_id, reason || null],
        } as any);
        const request = ((result as any).rows ?? result)[0];
        ctx.emitEvent?.('shift.coverage_requested', {
          siteId, coverageRequest: request, shift: shiftRows[0], artistId: artist_id,
        });
        res.status(201).json(request);
      } catch (err) {
        logger.error({ err }, 'Failed to create coverage request');
        res.status(500).json({ error: 'Failed to create coverage request' });
      }
    });

    // Accept a coverage request (transfers the shift)
    coverageRouter.post('/:requestId/accept', async (req, res) => {
      try {
        const { siteId, requestId } = req.params;
        const { artist_id } = req.body;
        if (!artist_id) return res.status(400).json({ error: 'artist_id required' });

        // Get the coverage request
        const crResult = await db.execute({
          text: "SELECT * FROM poppies_shift_coverage_requests WHERE id = $1 AND site_id = $2 AND status = 'open'",
          values: [requestId, siteId],
        } as any);
        const crRows = (crResult as any).rows ?? crResult;
        if (!crRows.length) return res.status(404).json({ error: 'Coverage request not found or already resolved' });
        const cr = crRows[0];

        // Can't accept your own request
        if (cr.requesting_artist_id === artist_id) {
          return res.status(400).json({ error: 'Cannot accept your own coverage request' });
        }

        // Transfer the shift
        await db.execute({
          text: "UPDATE poppies_shifts SET assigned_artist_id = $1, status = 'claimed', updated_at = NOW() WHERE id = $2",
          values: [artist_id, cr.shift_id],
        } as any);

        // Close the request
        const updated = await db.execute({
          text: `
            UPDATE poppies_shift_coverage_requests
            SET accepting_artist_id = $1, status = 'accepted', resolved_at = NOW()
            WHERE id = $2
            RETURNING *
          `,
          values: [artist_id, requestId],
        } as any);
        const resolved = ((updated as any).rows ?? updated)[0];

        ctx.emitEvent?.('shift.coverage_accepted', {
          siteId, coverageRequest: resolved, acceptingArtistId: artist_id,
          requestingArtistId: cr.requesting_artist_id,
        });
        res.json(resolved);
      } catch (err) {
        logger.error({ err }, 'Failed to accept coverage request');
        res.status(500).json({ error: 'Failed to accept coverage request' });
      }
    });

    // Cancel own coverage request
    coverageRouter.post('/:requestId/cancel', async (req, res) => {
      try {
        const { siteId, requestId } = req.params;
        const { artist_id } = req.body;

        const result = await db.execute({
          text: `
            UPDATE poppies_shift_coverage_requests
            SET status = 'cancelled', resolved_at = NOW()
            WHERE id = $1 AND site_id = $2 AND requesting_artist_id = $3 AND status = 'open'
            RETURNING shift_id
          `,
          values: [requestId, siteId, artist_id],
        } as any);
        const rows = (result as any).rows ?? result;
        if (!rows.length) return res.status(404).json({ error: 'Coverage request not found' });

        // Restore shift status back to claimed
        await db.execute({
          text: "UPDATE poppies_shifts SET status = 'claimed', updated_at = NOW() WHERE id = $1",
          values: [rows[0].shift_id],
        } as any);

        res.json({ cancelled: true });
      } catch (err) {
        logger.error({ err }, 'Failed to cancel coverage request');
        res.status(500).json({ error: 'Failed to cancel coverage request' });
      }
    });

    // Mount routes
    ctx.addRoutes('shifts', shiftRouter);
    ctx.addRoutes('shifts/coverage', coverageRouter);

    // Admin navigation
    ctx.addAdminNav({
      title: 'Shifts',
      siteScoped: true,
      items: [
        { label: 'Calendar', icon: 'Calendar', href: 'shifts' },
        { label: 'Today', icon: 'Clock', href: 'shifts/today' },
        { label: 'Coverage Requests', icon: 'ArrowLeftRight', href: 'shifts/coverage' },
      ],
    });

    ctx.addAdminRoutes([
      { path: 'sites/:siteId/shifts', component: '@poppies/shifts/admin/ShiftsCalendar' },
      { path: 'sites/:siteId/shifts/today', component: '@poppies/shifts/admin/ShiftsToday' },
      { path: 'sites/:siteId/shifts/coverage', component: '@poppies/shifts/admin/CoverageRequests' },
    ]);

    logger.info({ plugin: 'poppies-shifts' }, 'Poppies shifts plugin loaded');
  },
};

export default shiftsPlugin;
