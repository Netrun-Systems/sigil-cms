// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * POS Routes — Stripe Terminal, sessions, transactions, products, reports
 *
 * All routes are site-scoped: mounted under /api/v1/sites/:siteId/pos/*
 * Auth is handled by the platform middleware before these routes.
 */

import { Router } from 'express';
import type { Request, Response, Router as IRouter } from 'express';
import type { PluginLogger } from '@netrun-cms/plugin-runtime';
import {
  createConnectionToken,
  createPaymentIntent,
  refundPayment,
  listReaders,
  registerReader,
} from './stripe-terminal.js';
import { generateReceipt, generateReceiptNumber } from './receipt.js';

// Default Ojai CA tax rate — configurable per-site in the future
const DEFAULT_TAX_RATE = 0.0775;

export function createPosRoutes(db: any, logger: PluginLogger): IRouter {
  const router = Router({ mergeParams: true });
  const d = db as any;

  // ── Stripe Terminal ──────────────────────────────────────────────

  /** POST /connection-token — Generate Stripe Terminal connection token */
  router.post('/connection-token', async (_req: Request, res: Response) => {
    try {
      const secret = await createConnectionToken();
      res.json({ success: true, data: { secret } });
    } catch (err) {
      logger.error({ err }, 'Failed to create connection token');
      res.status(500).json({ success: false, error: { message: 'Failed to create connection token' } });
    }
  });

  /** POST /readers — List registered readers */
  router.post('/readers', async (_req: Request, res: Response) => {
    try {
      const readers = await listReaders();
      res.json({ success: true, data: readers });
    } catch (err) {
      logger.error({ err }, 'Failed to list readers');
      res.status(500).json({ success: false, error: { message: 'Failed to list readers' } });
    }
  });

  /** POST /readers/register — Register a new reader */
  router.post('/readers/register', async (req: Request, res: Response) => {
    try {
      const { registrationCode, label, locationId } = req.body;
      if (!registrationCode || !label) {
        return res.status(400).json({ success: false, error: { message: 'registrationCode and label are required' } });
      }
      const reader = await registerReader(registrationCode, label, locationId);
      res.json({ success: true, data: reader });
    } catch (err) {
      logger.error({ err }, 'Failed to register reader');
      res.status(500).json({ success: false, error: { message: 'Failed to register reader' } });
    }
  });

  // ── Sessions ─────────────────────────────────────────────────────

  /** POST /sessions/open — Open a new register session */
  router.post('/sessions/open', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { cashierName, openingCash } = req.body;

      if (!cashierName) {
        return res.status(400).json({ success: false, error: { message: 'cashierName is required' } });
      }

      // Check for existing open session
      const existing = await d.execute({
        text: `SELECT id FROM pos_sessions WHERE site_id = $1 AND status = 'open' LIMIT 1`,
        values: [siteId],
      });
      const existingRows = existing.rows ?? existing;
      if (existingRows && existingRows.length > 0) {
        return res.status(409).json({
          success: false,
          error: { message: 'A session is already open. Close it before opening a new one.' },
        });
      }

      const result = await d.execute({
        text: `
          INSERT INTO pos_sessions (site_id, cashier_name, opening_cash)
          VALUES ($1, $2, $3)
          RETURNING *
        `,
        values: [siteId, cashierName, openingCash ?? 0],
      });

      const rows = result.rows ?? result;
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      logger.error({ err }, 'Failed to open session');
      res.status(500).json({ success: false, error: { message: 'Failed to open session' } });
    }
  });

  /** POST /sessions/close — Close the current register session */
  router.post('/sessions/close', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { closingCash, notes } = req.body;

      const result = await d.execute({
        text: `
          UPDATE pos_sessions
          SET status = 'closed', closed_at = NOW(), closing_cash = $2, notes = $3
          WHERE site_id = $1 AND status = 'open'
          RETURNING *
        `,
        values: [siteId, closingCash ?? null, notes ?? null],
      });

      const rows = result.rows ?? result;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'No open session found' } });
      }
      res.json({ success: true, data: rows[0] });
    } catch (err) {
      logger.error({ err }, 'Failed to close session');
      res.status(500).json({ success: false, error: { message: 'Failed to close session' } });
    }
  });

  /** GET /sessions/current — Get current open session */
  router.get('/sessions/current', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const result = await d.execute({
        text: `SELECT * FROM pos_sessions WHERE site_id = $1 AND status = 'open' LIMIT 1`,
        values: [siteId],
      });

      const rows = result.rows ?? result;
      if (!rows || rows.length === 0) {
        return res.json({ success: true, data: null });
      }
      res.json({ success: true, data: rows[0] });
    } catch (err) {
      logger.error({ err }, 'Failed to get current session');
      res.status(500).json({ success: false, error: { message: 'Failed to get current session' } });
    }
  });

  /** GET /sessions/:id/summary — Session summary with totals */
  router.get('/sessions/:id/summary', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;
      const result = await d.execute({
        text: `
          SELECT
            s.*,
            COALESCE(t.tx_count, 0)::int as transaction_count,
            COALESCE(t.total_sales, 0) as total_sales,
            COALESCE(t.total_card, 0) as total_card,
            COALESCE(t.total_cash, 0) as total_cash,
            COALESCE(t.total_tax, 0) as total_tax,
            COALESCE(t.total_refunds, 0) as total_refunds
          FROM pos_sessions s
          LEFT JOIN LATERAL (
            SELECT
              COUNT(*) FILTER (WHERE type = 'sale') as tx_count,
              SUM(total) FILTER (WHERE type = 'sale') as total_sales,
              SUM(card_amount) FILTER (WHERE type = 'sale') as total_card,
              SUM(cash_amount) FILTER (WHERE type = 'sale') as total_cash,
              SUM(tax_amount) FILTER (WHERE type = 'sale') as total_tax,
              SUM(total) FILTER (WHERE type = 'refund') as total_refunds
            FROM pos_transactions WHERE session_id = s.id
          ) t ON true
          WHERE s.id = $1 AND s.site_id = $2
        `,
        values: [id, siteId],
      });

      const rows = result.rows ?? result;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Session not found' } });
      }

      const session = rows[0];
      const expectedCash = Number(session.opening_cash || 0) + Number(session.total_cash || 0);
      const variance = session.closing_cash != null
        ? Number(session.closing_cash) - expectedCash
        : null;

      res.json({
        success: true,
        data: {
          ...session,
          expected_cash: expectedCash.toFixed(2),
          variance: variance != null ? variance.toFixed(2) : null,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to get session summary');
      res.status(500).json({ success: false, error: { message: 'Failed to get session summary' } });
    }
  });

  // ── Transactions ─────────────────────────────────────────────────

  /** POST /transactions — Create a new transaction */
  router.post('/transactions', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const {
        lineItems,
        paymentMethod,
        cashAmount,
        discountAmount,
        customerName,
        customerEmail,
        taxRate: customTaxRate,
      } = req.body;

      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ success: false, error: { message: 'lineItems array is required' } });
      }

      // Get current open session
      const sessionResult = await d.execute({
        text: `SELECT id, cashier_name FROM pos_sessions WHERE site_id = $1 AND status = 'open' LIMIT 1`,
        values: [siteId],
      });
      const sessionRows = sessionResult.rows ?? sessionResult;
      if (!sessionRows || sessionRows.length === 0) {
        return res.status(400).json({ success: false, error: { message: 'No open session. Open a register first.' } });
      }
      const session = sessionRows[0];

      const taxRate = customTaxRate ?? DEFAULT_TAX_RATE;
      const discount = Number(discountAmount) || 0;

      // Calculate subtotal from line items (cents-based arithmetic)
      let subtotalCents = 0;
      const processedItems = lineItems.map((item: any) => {
        const qty = item.quantity ?? 1;
        const unitPriceCents = Math.round(Number(item.unitPrice) * 100);
        const lineTotalCents = unitPriceCents * qty;
        subtotalCents += lineTotalCents;

        // Commission split
        const commRate = item.commissionRate != null ? Number(item.commissionRate) : null;
        let commissionAmount: number | null = null;
        let storeAmount: number | null = null;
        if (commRate != null) {
          commissionAmount = Math.round(lineTotalCents * commRate) / 100;
          storeAmount = (lineTotalCents / 100) - commissionAmount;
        }

        return {
          productName: item.productName,
          artistId: item.artistId ?? null,
          artistName: item.artistName ?? null,
          sku: item.sku ?? null,
          quantity: qty,
          unitPrice: (unitPriceCents / 100).toFixed(2),
          lineTotal: (lineTotalCents / 100).toFixed(2),
          commissionRate: commRate,
          commissionAmount: commissionAmount?.toFixed(2) ?? null,
          storeAmount: storeAmount?.toFixed(2) ?? null,
        };
      });

      const subtotal = subtotalCents / 100;
      const taxableAmount = subtotal - discount;
      const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
      const total = Math.round((taxableAmount + taxAmount) * 100) / 100;

      // Payment split
      let cardAmount = 0;
      let cashAmt = 0;
      let changeDue = 0;

      if (paymentMethod === 'cash') {
        cashAmt = Number(cashAmount) || total;
        changeDue = Math.max(0, Math.round((cashAmt - total) * 100) / 100);
      } else if (paymentMethod === 'split') {
        cashAmt = Number(cashAmount) || 0;
        cardAmount = Math.round((total - cashAmt) * 100) / 100;
      } else {
        cardAmount = total;
      }

      // Generate receipt number
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const countResult = await d.execute({
        text: `SELECT COUNT(*)::int as cnt FROM pos_transactions WHERE site_id = $1 AND receipt_number LIKE $2`,
        values: [siteId, `POP-${dateStr}-%`],
      });
      const countRows = countResult.rows ?? countResult;
      const seqNum = (Number(countRows[0]?.cnt) || 0) + 1;
      const receiptNumber = generateReceiptNumber(today, seqNum);

      // Create Stripe PaymentIntent if card payment
      let stripePaymentIntentId: string | null = null;
      if (paymentMethod === 'card' || (paymentMethod === 'split' && cardAmount > 0)) {
        try {
          const pi = await createPaymentIntent(cardAmount, {
            receipt_number: receiptNumber,
            site_id: siteId,
            session_id: session.id,
          });
          stripePaymentIntentId = pi.id;
        } catch (stripeErr) {
          logger.error({ err: stripeErr }, 'Stripe PaymentIntent creation failed');
          return res.status(502).json({
            success: false,
            error: { message: 'Failed to create card payment. Try cash or retry.' },
          });
        }
      }

      // Insert transaction
      const txResult = await d.execute({
        text: `
          INSERT INTO pos_transactions
            (session_id, site_id, type, subtotal, tax_amount, tax_rate, discount_amount,
             total, payment_method, cash_amount, card_amount, change_due,
             stripe_payment_intent_id, receipt_number, customer_name, customer_email)
          VALUES ($1, $2, 'sale', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *
        `,
        values: [
          session.id, siteId, subtotal.toFixed(2), taxAmount.toFixed(2), taxRate,
          discount.toFixed(2), total.toFixed(2), paymentMethod ?? 'card',
          cashAmt.toFixed(2), cardAmount.toFixed(2), changeDue.toFixed(2),
          stripePaymentIntentId, receiptNumber, customerName ?? null, customerEmail ?? null,
        ],
      });
      const txRows = txResult.rows ?? txResult;
      const transaction = txRows[0];

      // Insert line items
      for (const item of processedItems) {
        await d.execute({
          text: `
            INSERT INTO pos_line_items
              (transaction_id, product_name, artist_id, artist_name, sku, quantity,
               unit_price, line_total, commission_rate, commission_amount, store_amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `,
          values: [
            transaction.id, item.productName, item.artistId, item.artistName, item.sku,
            item.quantity, item.unitPrice, item.lineTotal, item.commissionRate,
            item.commissionAmount, item.storeAmount,
          ],
        });
      }

      // Build receipt
      const receipt = generateReceipt(
        { ...transaction, cashier_name: session.cashier_name },
        processedItems.map((i: any) => ({
          product_name: i.productName,
          artist_name: i.artistName,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          line_total: i.lineTotal,
        })),
      );

      res.status(201).json({
        success: true,
        data: { transaction, lineItems: processedItems, receipt },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to create transaction');
      res.status(500).json({ success: false, error: { message: 'Failed to create transaction' } });
    }
  });

  /** GET /transactions — List transactions with filters */
  router.get('/transactions', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { sessionId, from, to, type, limit: limitStr } = req.query;

      let query = `
        SELECT t.*, s.cashier_name
        FROM pos_transactions t
        JOIN pos_sessions s ON s.id = t.session_id
        WHERE t.site_id = $1
      `;
      const params: unknown[] = [siteId];

      if (sessionId) {
        params.push(sessionId);
        query += ` AND t.session_id = $${params.length}`;
      }
      if (type) {
        params.push(type);
        query += ` AND t.type = $${params.length}`;
      }
      if (from) {
        params.push(from);
        query += ` AND t.created_at >= $${params.length}`;
      }
      if (to) {
        params.push(to);
        query += ` AND t.created_at <= $${params.length}`;
      }

      query += ' ORDER BY t.created_at DESC';

      const limit = Math.min(Number(limitStr) || 100, 500);
      params.push(limit);
      query += ` LIMIT $${params.length}`;

      const result = await d.execute({ text: query, values: params });
      const rows = result.rows ?? result;
      res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
      logger.error({ err }, 'Failed to list transactions');
      res.status(500).json({ success: false, error: { message: 'Failed to list transactions' } });
    }
  });

  /** POST /transactions/:id/refund — Refund a transaction (full or partial) */
  router.post('/transactions/:id/refund', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;
      const { amount, reason } = req.body;

      // Get original transaction
      const txResult = await d.execute({
        text: `SELECT * FROM pos_transactions WHERE id = $1 AND site_id = $2`,
        values: [id, siteId],
      });
      const txRows = txResult.rows ?? txResult;
      if (!txRows || txRows.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Transaction not found' } });
      }
      const original = txRows[0];

      if (original.type === 'refund' || original.type === 'void') {
        return res.status(400).json({ success: false, error: { message: 'Cannot refund a refund or void' } });
      }

      const refundAmount = amount ? Number(amount) : Number(original.total);

      // Stripe refund if card payment
      let stripeRefundId: string | null = null;
      if (original.stripe_payment_intent_id && Number(original.card_amount) > 0) {
        try {
          const cardRefundAmount = amount ? Math.min(Number(amount), Number(original.card_amount)) : Number(original.card_amount);
          const refund = await refundPayment(original.stripe_payment_intent_id, cardRefundAmount);
          stripeRefundId = refund.id;
        } catch (stripeErr) {
          logger.error({ err: stripeErr }, 'Stripe refund failed');
          return res.status(502).json({ success: false, error: { message: 'Stripe refund failed' } });
        }
      }

      // Get current session
      const sessionResult = await d.execute({
        text: `SELECT id FROM pos_sessions WHERE site_id = $1 AND status = 'open' LIMIT 1`,
        values: [siteId],
      });
      const sessionRows = sessionResult.rows ?? sessionResult;
      if (!sessionRows || sessionRows.length === 0) {
        return res.status(400).json({ success: false, error: { message: 'No open session for refund' } });
      }

      // Generate refund receipt number
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const countResult = await d.execute({
        text: `SELECT COUNT(*)::int as cnt FROM pos_transactions WHERE site_id = $1 AND receipt_number LIKE $2`,
        values: [siteId, `POP-${dateStr}-%`],
      });
      const countRows = countResult.rows ?? countResult;
      const seqNum = (Number(countRows[0]?.cnt) || 0) + 1;
      const receiptNumber = generateReceiptNumber(today, seqNum);

      // Insert refund transaction
      const refundResult = await d.execute({
        text: `
          INSERT INTO pos_transactions
            (session_id, site_id, type, subtotal, tax_amount, tax_rate, total,
             payment_method, stripe_payment_intent_id, receipt_number, customer_name)
          VALUES ($1, $2, 'refund', $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `,
        values: [
          sessionRows[0].id, siteId, refundAmount.toFixed(2), '0', original.tax_rate,
          refundAmount.toFixed(2), original.payment_method, stripeRefundId,
          receiptNumber, reason ?? `Refund for ${original.receipt_number}`,
        ],
      });

      const refundRows = refundResult.rows ?? refundResult;
      res.json({ success: true, data: refundRows[0] });
    } catch (err) {
      logger.error({ err }, 'Failed to refund transaction');
      res.status(500).json({ success: false, error: { message: 'Failed to refund transaction' } });
    }
  });

  /** POST /transactions/:id/void — Void a transaction (before settlement) */
  router.post('/transactions/:id/void', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;

      const txResult = await d.execute({
        text: `SELECT * FROM pos_transactions WHERE id = $1 AND site_id = $2`,
        values: [id, siteId],
      });
      const txRows = txResult.rows ?? txResult;
      if (!txRows || txRows.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Transaction not found' } });
      }
      const original = txRows[0];

      if (original.type !== 'sale') {
        return res.status(400).json({ success: false, error: { message: 'Can only void sale transactions' } });
      }

      // Cancel Stripe PaymentIntent if applicable
      if (original.stripe_payment_intent_id) {
        try {
          await refundPayment(original.stripe_payment_intent_id);
        } catch (stripeErr) {
          logger.error({ err: stripeErr }, 'Stripe void/refund failed');
        }
      }

      // Mark as void
      const result = await d.execute({
        text: `UPDATE pos_transactions SET type = 'void' WHERE id = $1 AND site_id = $2 RETURNING *`,
        values: [id, siteId],
      });
      const rows = result.rows ?? result;
      res.json({ success: true, data: rows[0] });
    } catch (err) {
      logger.error({ err }, 'Failed to void transaction');
      res.status(500).json({ success: false, error: { message: 'Failed to void transaction' } });
    }
  });

  /** GET /transactions/:id/receipt — Get receipt data */
  router.get('/transactions/:id/receipt', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;

      const txResult = await d.execute({
        text: `
          SELECT t.*, s.cashier_name
          FROM pos_transactions t
          JOIN pos_sessions s ON s.id = t.session_id
          WHERE t.id = $1 AND t.site_id = $2
        `,
        values: [id, siteId],
      });
      const txRows = txResult.rows ?? txResult;
      if (!txRows || txRows.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Transaction not found' } });
      }

      const itemsResult = await d.execute({
        text: `SELECT * FROM pos_line_items WHERE transaction_id = $1 ORDER BY id`,
        values: [id],
      });
      const itemRows = itemsResult.rows ?? itemsResult;

      const receipt = generateReceipt(txRows[0], itemRows);
      res.json({ success: true, data: receipt });
    } catch (err) {
      logger.error({ err }, 'Failed to get receipt');
      res.status(500).json({ success: false, error: { message: 'Failed to get receipt' } });
    }
  });

  // ── Products ─────────────────────────────────────────────────────

  /** GET /products — List POS products */
  router.get('/products', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { search, category, active } = req.query;

      let query = `SELECT * FROM pos_products WHERE site_id = $1`;
      const params: unknown[] = [siteId];

      if (active !== undefined) {
        params.push(active === 'true');
        query += ` AND is_active = $${params.length}`;
      } else {
        query += ` AND is_active = true`;
      }

      if (category) {
        params.push(category);
        query += ` AND category = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (name ILIKE $${params.length} OR artist_name ILIKE $${params.length} OR sku ILIKE $${params.length})`;
      }

      query += ' ORDER BY sort_order ASC, name ASC';

      const result = await d.execute({ text: query, values: params });
      const rows = result.rows ?? result;
      res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
      logger.error({ err }, 'Failed to list products');
      res.status(500).json({ success: false, error: { message: 'Failed to list products' } });
    }
  });

  /** POST /products — Create a POS product */
  router.post('/products', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { name, sku, price, category, artistId, artistName, commissionRate, imageUrl, barcode, sortOrder } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({ success: false, error: { message: 'name and price are required' } });
      }

      const result = await d.execute({
        text: `
          INSERT INTO pos_products
            (site_id, name, sku, price, category, artist_id, artist_name, commission_rate, image_url, barcode, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `,
        values: [
          siteId, name, sku ?? null, Number(price).toFixed(2), category ?? null,
          artistId ?? null, artistName ?? null, commissionRate ?? 0.60,
          imageUrl ?? null, barcode ?? null, sortOrder ?? 0,
        ],
      });

      const rows = result.rows ?? result;
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      logger.error({ err }, 'Failed to create product');
      res.status(500).json({ success: false, error: { message: 'Failed to create product' } });
    }
  });

  /** PUT /products/:id — Update a POS product */
  router.put('/products/:id', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;
      const { name, sku, price, category, artistId, artistName, commissionRate, imageUrl, barcode, isActive, sortOrder } = req.body;

      const result = await d.execute({
        text: `
          UPDATE pos_products SET
            name = COALESCE($3, name),
            sku = COALESCE($4, sku),
            price = COALESCE($5, price),
            category = COALESCE($6, category),
            artist_id = COALESCE($7, artist_id),
            artist_name = COALESCE($8, artist_name),
            commission_rate = COALESCE($9, commission_rate),
            image_url = COALESCE($10, image_url),
            barcode = COALESCE($11, barcode),
            is_active = COALESCE($12, is_active),
            sort_order = COALESCE($13, sort_order)
          WHERE id = $1 AND site_id = $2
          RETURNING *
        `,
        values: [
          id, siteId, name, sku, price != null ? Number(price).toFixed(2) : null,
          category, artistId, artistName, commissionRate, imageUrl, barcode,
          isActive, sortOrder,
        ],
      });

      const rows = result.rows ?? result;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Product not found' } });
      }
      res.json({ success: true, data: rows[0] });
    } catch (err) {
      logger.error({ err }, 'Failed to update product');
      res.status(500).json({ success: false, error: { message: 'Failed to update product' } });
    }
  });

  /** DELETE /products/:id — Soft-delete (deactivate) a POS product */
  router.delete('/products/:id', async (req: Request, res: Response) => {
    try {
      const { siteId, id } = req.params;

      const result = await d.execute({
        text: `UPDATE pos_products SET is_active = false WHERE id = $1 AND site_id = $2 RETURNING *`,
        values: [id, siteId],
      });

      const rows = result.rows ?? result;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Product not found' } });
      }
      res.json({ success: true, data: rows[0] });
    } catch (err) {
      logger.error({ err }, 'Failed to deactivate product');
      res.status(500).json({ success: false, error: { message: 'Failed to deactivate product' } });
    }
  });

  /** POST /products/scan — Lookup product by barcode or SKU */
  router.post('/products/scan', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, error: { message: 'code is required' } });
      }

      const result = await d.execute({
        text: `SELECT * FROM pos_products WHERE site_id = $1 AND is_active = true AND (barcode = $2 OR sku = $2) LIMIT 1`,
        values: [siteId, code],
      });

      const rows = result.rows ?? result;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, error: { message: 'Product not found' } });
      }
      res.json({ success: true, data: rows[0] });
    } catch (err) {
      logger.error({ err }, 'Failed to scan product');
      res.status(500).json({ success: false, error: { message: 'Failed to scan product' } });
    }
  });

  // ── Reports ──────────────────────────────────────────────────────

  /** GET /reports/daily — Daily sales summary */
  router.get('/reports/daily', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { from, to } = req.query;

      const startDate = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const endDate = to || new Date().toISOString().split('T')[0];

      const result = await d.execute({
        text: `
          SELECT
            DATE(t.created_at AT TIME ZONE 'America/Los_Angeles') as sale_date,
            COUNT(*) FILTER (WHERE t.type = 'sale')::int as sale_count,
            COUNT(*) FILTER (WHERE t.type = 'refund')::int as refund_count,
            COALESCE(SUM(t.total) FILTER (WHERE t.type = 'sale'), 0) as total_sales,
            COALESCE(SUM(t.total) FILTER (WHERE t.type = 'refund'), 0) as total_refunds,
            COALESCE(SUM(t.tax_amount) FILTER (WHERE t.type = 'sale'), 0) as total_tax,
            COALESCE(SUM(t.card_amount) FILTER (WHERE t.type = 'sale'), 0) as card_total,
            COALESCE(SUM(t.cash_amount) FILTER (WHERE t.type = 'sale'), 0) as cash_total
          FROM pos_transactions t
          WHERE t.site_id = $1
            AND DATE(t.created_at AT TIME ZONE 'America/Los_Angeles') >= $2
            AND DATE(t.created_at AT TIME ZONE 'America/Los_Angeles') <= $3
          GROUP BY DATE(t.created_at AT TIME ZONE 'America/Los_Angeles')
          ORDER BY sale_date DESC
        `,
        values: [siteId, startDate, endDate],
      });

      const rows = result.rows ?? result;
      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to get daily report');
      res.status(500).json({ success: false, error: { message: 'Failed to get daily report' } });
    }
  });

  /** GET /reports/artist — Per-artist sales and commission report */
  router.get('/reports/artist', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { from, to } = req.query;

      let dateFilter = '';
      const params: unknown[] = [siteId];

      if (from) {
        params.push(from);
        dateFilter += ` AND t.created_at >= $${params.length}`;
      }
      if (to) {
        params.push(to);
        dateFilter += ` AND t.created_at <= $${params.length}`;
      }

      const result = await d.execute({
        text: `
          SELECT
            li.artist_id,
            li.artist_name,
            COUNT(DISTINCT t.id)::int as transaction_count,
            SUM(li.quantity)::int as items_sold,
            SUM(li.line_total) as total_sales,
            SUM(li.commission_amount) as total_commission,
            SUM(li.store_amount) as total_store_share,
            AVG(li.commission_rate) as avg_commission_rate
          FROM pos_line_items li
          JOIN pos_transactions t ON t.id = li.transaction_id
          WHERE t.site_id = $1 AND t.type = 'sale' AND li.artist_id IS NOT NULL
            ${dateFilter}
          GROUP BY li.artist_id, li.artist_name
          ORDER BY total_sales DESC
        `,
        values: params,
      });

      const rows = result.rows ?? result;
      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to get artist report');
      res.status(500).json({ success: false, error: { message: 'Failed to get artist report' } });
    }
  });

  /** GET /reports/settlement — Settlement report for artist payouts */
  router.get('/reports/settlement', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({ success: false, error: { message: 'from and to date params are required' } });
      }

      const result = await d.execute({
        text: `
          SELECT
            li.artist_id,
            li.artist_name,
            json_agg(json_build_object(
              'date', t.created_at,
              'receipt', t.receipt_number,
              'product', li.product_name,
              'quantity', li.quantity,
              'line_total', li.line_total,
              'commission_rate', li.commission_rate,
              'commission_amount', li.commission_amount,
              'store_amount', li.store_amount
            ) ORDER BY t.created_at) as line_items,
            SUM(li.line_total) as total_sales,
            SUM(li.commission_amount) as total_owed,
            SUM(li.store_amount) as total_store_share,
            COUNT(*)::int as item_count
          FROM pos_line_items li
          JOIN pos_transactions t ON t.id = li.transaction_id
          WHERE t.site_id = $1
            AND t.type = 'sale'
            AND li.artist_id IS NOT NULL
            AND t.created_at >= $2
            AND t.created_at <= $3
          GROUP BY li.artist_id, li.artist_name
          ORDER BY li.artist_name
        `,
        values: [siteId, from, to],
      });

      const rows = result.rows ?? result;
      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to get settlement report');
      res.status(500).json({ success: false, error: { message: 'Failed to get settlement report' } });
    }
  });

  // ── Square Terminal Integration ──────────────────────────────────
  // Uses existing Square hardware — sends payment requests to Square reader

  /** GET /square/status — Check Square Terminal configuration */
  router.get('/square/status', async (_req: Request, res: Response) => {
    try {
      const { isSquareConfigured, isDeviceConfigured } = await import('./square-terminal.js');
      res.json({
        success: true,
        data: {
          configured: isSquareConfigured(),
          deviceConfigured: isDeviceConfigured(),
          environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
        },
      });
    } catch (err) {
      res.json({ success: true, data: { configured: false, deviceConfigured: false } });
    }
  });

  /** GET /square/devices — List available Square Terminal devices */
  router.get('/square/devices', async (_req: Request, res: Response) => {
    try {
      const { listDevices } = await import('./square-terminal.js');
      const devices = await listDevices();
      res.json({ success: true, data: devices });
    } catch (err) {
      logger.error({ err }, 'Failed to list Square devices');
      res.status(500).json({ success: false, error: { message: 'Failed to list Square devices' } });
    }
  });

  /** POST /square/checkout — Send payment request to Square reader */
  router.post('/square/checkout', async (req: Request, res: Response) => {
    try {
      const { createTerminalCheckout } = await import('./square-terminal.js');
      const { amountCents, receiptNumber, note, deviceId } = req.body;

      if (!amountCents || !receiptNumber) {
        return res.status(400).json({ success: false, error: { message: 'amountCents and receiptNumber required' } });
      }

      const checkout = await createTerminalCheckout(amountCents, receiptNumber, note, deviceId);
      logger.info({ checkoutId: checkout.id, amount: amountCents, receipt: receiptNumber }, 'Square Terminal checkout created');

      res.json({ success: true, data: checkout });
    } catch (err) {
      logger.error({ err }, 'Failed to create Square checkout');
      res.status(500).json({ success: false, error: { message: String(err) } });
    }
  });

  /** GET /square/checkout/:checkoutId — Poll checkout status */
  router.get('/square/checkout/:checkoutId', async (req: Request, res: Response) => {
    try {
      const { getCheckoutStatus } = await import('./square-terminal.js');
      const checkout = await getCheckoutStatus(req.params.checkoutId);
      res.json({ success: true, data: checkout });
    } catch (err) {
      logger.error({ err }, 'Failed to get checkout status');
      res.status(500).json({ success: false, error: { message: String(err) } });
    }
  });

  /** POST /square/checkout/:checkoutId/cancel — Cancel pending checkout */
  router.post('/square/checkout/:checkoutId/cancel', async (req: Request, res: Response) => {
    try {
      const { cancelCheckout } = await import('./square-terminal.js');
      const checkout = await cancelCheckout(req.params.checkoutId);
      res.json({ success: true, data: checkout });
    } catch (err) {
      logger.error({ err }, 'Failed to cancel checkout');
      res.status(500).json({ success: false, error: { message: String(err) } });
    }
  });

  /** POST /square/checkout/:checkoutId/complete — Get payment details after completion */
  router.post('/square/checkout/:checkoutId/complete', async (req: Request, res: Response) => {
    try {
      const { getCheckoutStatus, getPaymentDetails } = await import('./square-terminal.js');
      const checkout = await getCheckoutStatus(req.params.checkoutId);

      if (checkout.status !== 'COMPLETED') {
        return res.status(400).json({ success: false, error: { message: `Checkout is ${checkout.status}, not COMPLETED` } });
      }

      const paymentId = checkout.payment_ids?.[0];
      if (!paymentId) {
        return res.status(400).json({ success: false, error: { message: 'No payment ID on completed checkout' } });
      }

      const payment = await getPaymentDetails(paymentId);
      res.json({ success: true, data: { checkout, payment } });
    } catch (err) {
      logger.error({ err }, 'Failed to complete checkout');
      res.status(500).json({ success: false, error: { message: String(err) } });
    }
  });

  /** POST /square/refund — Refund a Square payment */
  router.post('/square/refund', async (req: Request, res: Response) => {
    try {
      const { refundPayment: squareRefund } = await import('./square-terminal.js');
      const { paymentId, amountCents, reason } = req.body;

      if (!paymentId || !amountCents) {
        return res.status(400).json({ success: false, error: { message: 'paymentId and amountCents required' } });
      }

      const refund = await squareRefund(paymentId, amountCents, reason);
      res.json({ success: true, data: refund });
    } catch (err) {
      logger.error({ err }, 'Failed to refund Square payment');
      res.status(500).json({ success: false, error: { message: String(err) } });
    }
  });

  return router;
}
