// @ts-nocheck — plugin routes use dynamic drizzle queries with `any` db client
/**
 * Resonance Analytics Routes
 *
 * Admin routes: score retrieval, heatmap, experiments, AI suggestions, dashboard
 * Public routes: event ingestion, snippet serving, experiment assignment
 */

import { Router, type Request, type Response } from 'express';
import { eq, and, desc, asc, sql, lt, inArray } from 'drizzle-orm';
import { sites } from '@netrun-cms/db';
import {
  resonanceEvents,
  resonanceScores,
  resonanceExperiments,
  resonanceSuggestions,
} from './schema.js';
import { computeResonanceScore, evaluateExperiment } from './lib/scoring.js';
import { generateTrackingSnippet } from './lib/snippet.js';
import type { PluginLogger } from '@netrun-cms/plugin-runtime';
import type { Router as RouterType } from 'express';

interface ResonanceRoutes {
  adminRouter: RouterType;
  publicRouter: RouterType;
}

// Simple in-memory rate limiter for event ingestion
const rateLimitMap = new Map<string, number>();
setInterval(() => rateLimitMap.clear(), 60000);

export function createRoutes(db: any, logger: PluginLogger): ResonanceRoutes {
  const adminRouter = Router({ mergeParams: true });
  const publicRouter = Router({ mergeParams: true });

  const d = db as any;

  // ===========================================================================
  // Admin routes — mounted under /api/v1/sites/:siteId/resonance
  // ===========================================================================

  /**
   * GET /scores — get resonance scores for blocks on a page
   * Query: ?pageId=<uuid>&period=daily|weekly|monthly|alltime
   */
  adminRouter.get('/scores', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { pageId, period } = req.query;

      const conditions = [eq(resonanceScores.siteId, siteId)];
      if (pageId) conditions.push(eq(resonanceScores.pageId, pageId as string));
      if (period) conditions.push(eq(resonanceScores.period, period as string));

      const rows = await d.select().from(resonanceScores)
        .where(and(...conditions))
        .orderBy(desc(resonanceScores.resonanceScore));

      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to fetch resonance scores');
      res.status(500).json({ success: false, error: { message: 'Failed to fetch scores' } });
    }
  });

  /**
   * GET /scores/heatmap — scores formatted for heatmap overlay
   * Query: ?pageId=<uuid>
   */
  adminRouter.get('/scores/heatmap', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { pageId } = req.query;
      if (!pageId) {
        res.status(400).json({ success: false, error: { message: 'pageId is required' } });
        return;
      }

      const rows = await d.select({
        blockId: resonanceScores.blockId,
        blockType: resonanceScores.blockType,
        resonanceScore: resonanceScores.resonanceScore,
        impressions: resonanceScores.impressions,
        avgViewportTimeMs: resonanceScores.avgViewportTimeMs,
        clickCount: resonanceScores.clickCount,
      }).from(resonanceScores)
        .where(and(
          eq(resonanceScores.siteId, siteId),
          eq(resonanceScores.pageId, pageId as string),
          eq(resonanceScores.period, 'alltime'),
        ))
        .orderBy(desc(resonanceScores.resonanceScore));

      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to fetch heatmap data');
      res.status(500).json({ success: false, error: { message: 'Failed to fetch heatmap data' } });
    }
  });

  /**
   * POST /scores/compute — trigger score computation from raw events
   */
  adminRouter.post('/scores/compute', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { period, periodStart } = req.body;
      const computePeriod = period || 'alltime';
      const computeStart = periodStart || '1970-01-01';

      // Aggregate raw events per block
      const aggregation = await d.execute(sql`
        SELECT
          page_id,
          block_id,
          block_type,
          COUNT(*) FILTER (WHERE event_type = 'impression') AS impressions,
          COUNT(DISTINCT session_hash) AS unique_sessions,
          COALESCE(AVG(value) FILTER (WHERE event_type = 'viewport_time'), 0)::int AS avg_viewport_time_ms,
          COALESCE(AVG(value) FILTER (WHERE event_type = 'scroll_depth'), 0)::int AS avg_scroll_depth,
          COUNT(*) FILTER (WHERE event_type = 'click') AS click_count,
          COUNT(*) FILTER (WHERE event_type = 'bounce_point') AS bounce_point_count
        FROM cms_resonance_events
        WHERE site_id = ${siteId}
          AND created_at >= ${computeStart}::date
        GROUP BY page_id, block_id, block_type
      `);

      const rows = aggregation.rows || aggregation || [];
      let computed = 0;

      for (const row of rows) {
        const impressions = Number(row.impressions) || 0;
        const uniqueSessions = Number(row.unique_sessions) || 0;
        const avgViewportTimeMs = Number(row.avg_viewport_time_ms) || 0;
        const avgScrollDepth = Number(row.avg_scroll_depth) || 0;
        const clickCount = Number(row.click_count) || 0;
        const bouncePointCount = Number(row.bounce_point_count) || 0;

        const clickRate = impressions > 0 ? clickCount / impressions : 0;
        const scrollContinuationRate = uniqueSessions > 0
          ? (uniqueSessions - bouncePointCount) / uniqueSessions
          : 0;
        const bounceRate = impressions > 0 ? bouncePointCount / impressions : 0;

        const score = computeResonanceScore({
          avgViewportTimeMs,
          clickRate,
          scrollContinuationRate,
          bounceRate,
        });

        // Upsert score
        await d.execute(sql`
          INSERT INTO cms_resonance_scores (
            id, site_id, page_id, block_id, block_type,
            impressions, unique_sessions, avg_viewport_time_ms, avg_scroll_depth,
            click_count, bounce_point_count, resonance_score,
            period, period_start, computed_at
          ) VALUES (
            gen_random_uuid(), ${siteId}, ${row.page_id}, ${row.block_id}, ${row.block_type},
            ${impressions}, ${uniqueSessions}, ${avgViewportTimeMs}, ${avgScrollDepth},
            ${clickCount}, ${bouncePointCount}, ${score},
            ${computePeriod}, ${computeStart}::date, NOW()
          )
          ON CONFLICT ON CONSTRAINT uq_res_scores_site_block_period
          DO UPDATE SET
            impressions = EXCLUDED.impressions,
            unique_sessions = EXCLUDED.unique_sessions,
            avg_viewport_time_ms = EXCLUDED.avg_viewport_time_ms,
            avg_scroll_depth = EXCLUDED.avg_scroll_depth,
            click_count = EXCLUDED.click_count,
            bounce_point_count = EXCLUDED.bounce_point_count,
            resonance_score = EXCLUDED.resonance_score,
            computed_at = NOW(),
            updated_at = NOW()
        `);
        computed++;
      }

      logger.info({ siteId, computed, period: computePeriod }, 'Resonance scores computed');
      res.json({ success: true, data: { blocksComputed: computed, period: computePeriod } });
    } catch (err) {
      logger.error({ err }, 'Failed to compute resonance scores');
      res.status(500).json({ success: false, error: { message: 'Failed to compute scores' } });
    }
  });

  // ---------------------------------------------------------------------------
  // Experiments
  // ---------------------------------------------------------------------------

  /** GET /experiments — list A/B experiments */
  adminRouter.get('/experiments', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { pageId } = req.query;

      const conditions = [eq(resonanceExperiments.siteId, siteId)];
      if (pageId) conditions.push(eq(resonanceExperiments.pageId, pageId as string));

      const rows = await d.select().from(resonanceExperiments)
        .where(and(...conditions))
        .orderBy(desc(resonanceExperiments.createdAt));

      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to list experiments');
      res.status(500).json({ success: false, error: { message: 'Failed to list experiments' } });
    }
  });

  /** POST /experiments — create an experiment */
  adminRouter.post('/experiments', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { pageId, name, originalBlockId, variantBlockId, trafficSplit, minSessions, metadata } = req.body;

      if (!pageId || !name || !originalBlockId || !variantBlockId) {
        res.status(400).json({ success: false, error: { message: 'pageId, name, originalBlockId, and variantBlockId are required' } });
        return;
      }

      const [experiment] = await d.insert(resonanceExperiments).values({
        siteId,
        pageId,
        name,
        originalBlockId,
        variantBlockId,
        trafficSplit: trafficSplit ?? 50,
        minSessions: minSessions ?? 100,
        metadata: metadata ?? {},
      }).returning();

      res.status(201).json({ success: true, data: experiment });
    } catch (err) {
      logger.error({ err }, 'Failed to create experiment');
      res.status(500).json({ success: false, error: { message: 'Failed to create experiment' } });
    }
  });

  /** PATCH /experiments/:id — update experiment (start, pause, conclude) */
  adminRouter.patch('/experiments/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates: Record<string, any> = {};

      if (req.body.status !== undefined) updates.status = req.body.status;
      if (req.body.trafficSplit !== undefined) updates.trafficSplit = req.body.trafficSplit;
      if (req.body.winnerBlockId !== undefined) updates.winnerBlockId = req.body.winnerBlockId;
      if (req.body.winnerLift !== undefined) updates.winnerLift = req.body.winnerLift;

      if (req.body.status === 'running') updates.startedAt = new Date();
      if (req.body.status === 'concluded') updates.concludedAt = new Date();

      updates.updatedAt = new Date();

      const [updated] = await d.update(resonanceExperiments)
        .set(updates)
        .where(eq(resonanceExperiments.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ success: false, error: { message: 'Experiment not found' } });
        return;
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to update experiment');
      res.status(500).json({ success: false, error: { message: 'Failed to update experiment' } });
    }
  });

  /** GET /experiments/:id/results — compare original vs variant */
  adminRouter.get('/experiments/:id/results', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [experiment] = await d.select().from(resonanceExperiments)
        .where(eq(resonanceExperiments.id, id));

      if (!experiment) {
        res.status(404).json({ success: false, error: { message: 'Experiment not found' } });
        return;
      }

      // Get scores for both arms
      const [originalScore] = await d.select().from(resonanceScores)
        .where(and(
          eq(resonanceScores.siteId, experiment.siteId),
          eq(resonanceScores.blockId, experiment.originalBlockId),
          eq(resonanceScores.period, 'alltime'),
        ));

      const [variantScore] = await d.select().from(resonanceScores)
        .where(and(
          eq(resonanceScores.siteId, experiment.siteId),
          eq(resonanceScores.blockId, experiment.variantBlockId),
          eq(resonanceScores.period, 'alltime'),
        ));

      const original = {
        impressions: originalScore?.impressions ?? 0,
        resonanceScore: originalScore?.resonanceScore ?? 0,
        avgViewportTimeMs: originalScore?.avgViewportTimeMs ?? 0,
        clickCount: originalScore?.clickCount ?? 0,
      };

      const variant = {
        impressions: variantScore?.impressions ?? 0,
        resonanceScore: variantScore?.resonanceScore ?? 0,
        avgViewportTimeMs: variantScore?.avgViewportTimeMs ?? 0,
        clickCount: variantScore?.clickCount ?? 0,
      };

      const result = evaluateExperiment(
        { impressions: original.impressions, resonanceScore: original.resonanceScore },
        { impressions: variant.impressions, resonanceScore: variant.resonanceScore },
        experiment.minSessions,
      );

      res.json({
        success: true,
        data: {
          experiment,
          original,
          variant,
          result,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to get experiment results');
      res.status(500).json({ success: false, error: { message: 'Failed to get experiment results' } });
    }
  });

  // ---------------------------------------------------------------------------
  // AI Suggestions
  // ---------------------------------------------------------------------------

  /** GET /suggestions — list AI suggestions */
  adminRouter.get('/suggestions', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { pageId, status } = req.query;

      const conditions = [eq(resonanceSuggestions.siteId, siteId)];
      if (pageId) conditions.push(eq(resonanceSuggestions.pageId, pageId as string));
      if (status) conditions.push(eq(resonanceSuggestions.status, status as string));

      const rows = await d.select().from(resonanceSuggestions)
        .where(and(...conditions))
        .orderBy(desc(resonanceSuggestions.createdAt));

      res.json({ success: true, data: rows });
    } catch (err) {
      logger.error({ err }, 'Failed to list suggestions');
      res.status(500).json({ success: false, error: { message: 'Failed to list suggestions' } });
    }
  });

  /** POST /suggestions/generate — generate AI suggestions for low-scoring blocks */
  adminRouter.post('/suggestions/generate', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;
      const { pageId, threshold } = req.body;
      const scoreThreshold = threshold ?? 40;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(400).json({ success: false, error: { message: 'GEMINI_API_KEY not configured — AI suggestions unavailable' } });
        return;
      }

      // Find low-scoring blocks
      const conditions = [
        eq(resonanceScores.siteId, siteId),
        eq(resonanceScores.period, 'alltime'),
        lt(resonanceScores.resonanceScore, scoreThreshold),
      ];
      if (pageId) conditions.push(eq(resonanceScores.pageId, pageId as string));

      const lowBlocks = await d.select().from(resonanceScores)
        .where(and(...conditions))
        .orderBy(asc(resonanceScores.resonanceScore))
        .limit(10);

      if (lowBlocks.length === 0) {
        res.json({ success: true, data: { generated: 0, message: 'No low-scoring blocks found' } });
        return;
      }

      const generated: any[] = [];

      for (const block of lowBlocks) {
        const prompt = `You are a content optimization expert analyzing a website content block.

Block type: ${block.blockType}
Current metrics:
- Resonance score: ${block.resonanceScore}/100
- Average viewport time: ${block.avgViewportTimeMs}ms
- Click count: ${block.clickCount}
- Impressions: ${block.impressions}
- Bounce point count: ${block.bouncePointCount}

The resonance score measures engagement: viewport time (40%), click-through rate (30%), scroll continuation (20%), bounce avoidance (10%).

This block is underperforming. Provide ONE specific, actionable suggestion to improve engagement. Also specify a category (copy, cta, layout, imagery, or removal) and priority (low, medium, high).

Respond in JSON format: {"suggestion": "...", "reason": "...", "category": "...", "priority": "..."}`;

        try {
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
              }),
            },
          );

          if (!geminiResponse.ok) {
            logger.warn({ status: geminiResponse.status, blockId: block.blockId }, 'Gemini API error');
            continue;
          }

          const geminiData = await geminiResponse.json();
          const textContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

          // Parse JSON from response (handle markdown code fences)
          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          if (!jsonMatch) continue;

          const parsed = JSON.parse(jsonMatch[0]);

          const [suggestion] = await d.insert(resonanceSuggestions).values({
            siteId,
            pageId: block.pageId,
            blockId: block.blockId,
            suggestion: parsed.suggestion || 'Review this block for engagement improvements',
            reason: parsed.reason || 'Low resonance score',
            category: parsed.category || 'copy',
            priority: parsed.priority || 'medium',
            resonanceScoreBefore: block.resonanceScore,
          }).returning();

          generated.push(suggestion);
        } catch (aiErr) {
          logger.warn({ err: aiErr, blockId: block.blockId }, 'Failed to generate suggestion for block');
        }
      }

      logger.info({ siteId, generated: generated.length }, 'AI suggestions generated');
      res.json({ success: true, data: { generated: generated.length, suggestions: generated } });
    } catch (err) {
      logger.error({ err }, 'Failed to generate suggestions');
      res.status(500).json({ success: false, error: { message: 'Failed to generate suggestions' } });
    }
  });

  /** PATCH /suggestions/:id — update suggestion status */
  adminRouter.patch('/suggestions/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['pending', 'applied', 'dismissed'].includes(status)) {
        res.status(400).json({ success: false, error: { message: 'status must be pending, applied, or dismissed' } });
        return;
      }

      const [updated] = await d.update(resonanceSuggestions)
        .set({ status, updatedAt: new Date() })
        .where(eq(resonanceSuggestions.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ success: false, error: { message: 'Suggestion not found' } });
        return;
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      logger.error({ err }, 'Failed to update suggestion');
      res.status(500).json({ success: false, error: { message: 'Failed to update suggestion' } });
    }
  });

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------

  /** GET /dashboard — site-wide analytics summary */
  adminRouter.get('/dashboard', async (req: Request, res: Response) => {
    try {
      const { siteId } = req.params;

      // Total events count
      const [eventStats] = await d.execute(sql`
        SELECT COUNT(*)::int AS total_events
        FROM cms_resonance_events
        WHERE site_id = ${siteId}
      `).then((r: any) => r.rows || r || []);

      // Average resonance and block breakdown (alltime)
      const blockStats = await d.execute(sql`
        SELECT
          block_id,
          block_type,
          page_id,
          resonance_score,
          impressions,
          avg_viewport_time_ms,
          click_count,
          bounce_point_count
        FROM cms_resonance_scores
        WHERE site_id = ${siteId} AND period = 'alltime'
        ORDER BY resonance_score DESC
      `).then((r: any) => r.rows || r || []);

      const scores = blockStats.map((b: any) => Number(b.resonance_score));
      const avgResonance = scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0;

      const topBlocks = blockStats.slice(0, 5);
      const bottomBlocks = blockStats.slice(-5).reverse();

      // Recent trend (last 7 days event count)
      const [trend] = await d.execute(sql`
        SELECT COUNT(*)::int AS recent_events
        FROM cms_resonance_events
        WHERE site_id = ${siteId}
          AND created_at >= NOW() - INTERVAL '7 days'
      `).then((r: any) => r.rows || r || []);

      res.json({
        success: true,
        data: {
          totalEvents: eventStats?.total_events ?? 0,
          totalBlocks: blockStats.length,
          avgResonance,
          recentEvents7d: trend?.recent_events ?? 0,
          topBlocks,
          bottomBlocks,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to fetch dashboard');
      res.status(500).json({ success: false, error: { message: 'Failed to fetch dashboard' } });
    }
  });

  // ===========================================================================
  // Public routes — mounted under /api/v1/public/resonance/:siteSlug
  // ===========================================================================

  /**
   * POST /events — ingest engagement events (batch)
   * Rate limit: max 50 events per request, max 1 req/sec per sessionHash
   */
  publicRouter.post('/events', async (req: Request, res: Response) => {
    try {
      const { siteSlug } = req.params;
      const { sessionHash, events: incomingEvents } = req.body;

      if (!sessionHash || !Array.isArray(incomingEvents) || incomingEvents.length === 0) {
        res.status(400).json({ error: 'sessionHash and events[] required' });
        return;
      }

      // Rate limit: 1 request per second per session
      const now = Date.now();
      const lastRequest = rateLimitMap.get(sessionHash);
      if (lastRequest && now - lastRequest < 1000) {
        res.status(429).send();
        return;
      }
      rateLimitMap.set(sessionHash, now);

      // Cap at 50 events per request
      const batch = incomingEvents.slice(0, 50);

      // Resolve siteSlug → siteId
      const [site] = await d.select({ id: sites.id }).from(sites)
        .where(eq(sites.slug, siteSlug))
        .limit(1);

      if (!site) {
        res.status(404).json({ error: 'Site not found' });
        return;
      }

      const validEventTypes = ['impression', 'viewport_time', 'scroll_depth', 'click', 'bounce_point'];
      const referrer = req.get('referer') || null;
      const userAgent = req.get('user-agent') || null;

      const values = batch
        .filter((e: any) => e.blockId && e.eventType && validEventTypes.includes(e.eventType))
        .map((e: any) => ({
          siteId: site.id,
          pageId: e.pageId || 'unknown',
          blockId: e.blockId,
          blockType: e.blockType || 'unknown',
          eventType: e.eventType,
          value: typeof e.value === 'number' ? e.value : 1,
          sessionHash,
          referrer,
          userAgent,
        }));

      if (values.length > 0) {
        await d.insert(resonanceEvents).values(values);
      }

      res.status(204).send();
    } catch (err) {
      logger.error({ err }, 'Failed to ingest resonance events');
      res.status(500).json({ error: 'Ingestion failed' });
    }
  });

  /**
   * GET /snippet.js — serves the tracking snippet JavaScript
   */
  publicRouter.get('/snippet.js', (req: Request, res: Response) => {
    const { siteSlug } = req.params;
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3001';
    const apiBase = `${protocol}://${host}`;

    const snippet = generateTrackingSnippet(siteSlug, apiBase);

    res.set('Content-Type', 'application/javascript');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(snippet);
  });

  /**
   * GET /experiment/:pageId/:blockId — returns which variant to show
   */
  publicRouter.get('/experiment/:pageId/:blockId', async (req: Request, res: Response) => {
    try {
      const { siteSlug, pageId, blockId } = req.params;
      const sessionHash = req.query.sessionHash as string;

      // Resolve siteSlug
      const [site] = await d.select({ id: sites.id }).from(sites)
        .where(eq(sites.slug, siteSlug))
        .limit(1);

      if (!site) {
        res.status(404).json({ error: 'Site not found' });
        return;
      }

      // Find running experiment for this block
      const [experiment] = await d.select().from(resonanceExperiments)
        .where(and(
          eq(resonanceExperiments.siteId, site.id),
          eq(resonanceExperiments.pageId, pageId),
          eq(resonanceExperiments.originalBlockId, blockId),
          eq(resonanceExperiments.status, 'running'),
        ))
        .limit(1);

      if (!experiment) {
        res.status(404).json({ error: 'No running experiment for this block' });
        return;
      }

      // Deterministic assignment based on session hash
      // Hash the session to get a consistent 0-99 value
      let hashValue = 0;
      const hashInput = sessionHash || 'default';
      for (let i = 0; i < hashInput.length; i++) {
        hashValue = ((hashValue << 5) - hashValue + hashInput.charCodeAt(i)) | 0;
      }
      const bucket = Math.abs(hashValue) % 100;

      const assignedBlockId = bucket < experiment.trafficSplit
        ? experiment.variantBlockId
        : experiment.originalBlockId;

      res.json({ blockId: assignedBlockId });
    } catch (err) {
      logger.error({ err }, 'Failed to resolve experiment assignment');
      res.status(500).json({ error: 'Experiment resolution failed' });
    }
  });

  return { adminRouter, publicRouter };
}
