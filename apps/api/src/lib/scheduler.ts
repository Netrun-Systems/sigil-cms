/**
 * Content Scheduling Daemon
 *
 * Checks for pages with publishAt/unpublishAt timestamps and transitions
 * their status automatically:
 *   - publishAt <= now() AND status = 'scheduled' -> 'published'
 *   - unpublishAt <= now() AND status = 'published' -> 'archived'
 *
 * Can run as:
 *   1. Background interval in the API server (startScheduler)
 *   2. Standalone one-shot invocation (runSchedulerOnce)
 */

import { eq, and, lte, sql } from 'drizzle-orm';
import { pages } from '@netrun-cms/db';
import type { DbClient } from '@netrun-cms/db';

export interface SchedulerOptions {
  /** Interval in milliseconds between checks. Default: 60000 (1 minute) */
  intervalMs?: number;
  /** Logger instance (must have info/warn/error methods) */
  logger?: {
    info: (obj: Record<string, unknown>, msg: string) => void;
    warn: (obj: Record<string, unknown>, msg: string) => void;
    error: (obj: Record<string, unknown>, msg: string) => void;
  };
}

interface SchedulerResult {
  published: number;
  unpublished: number;
  errors: number;
}

/**
 * Process scheduled publishes: pages where publishAt <= now and status = 'scheduled'
 */
async function processScheduledPublishes(db: DbClient, logger?: SchedulerOptions['logger']): Promise<number> {
  const now = new Date();

  const toPublish = await db
    .select({ id: pages.id, title: pages.title, siteId: pages.siteId })
    .from(pages)
    .where(
      and(
        eq(pages.status, 'scheduled'),
        lte(pages.publishAt, now)
      )
    );

  if (toPublish.length === 0) return 0;

  for (const page of toPublish) {
    await db
      .update(pages)
      .set({
        status: 'published',
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(pages.id, page.id));

    logger?.info(
      { pageId: page.id, title: page.title, siteId: page.siteId },
      'Scheduled page published'
    );
  }

  return toPublish.length;
}

/**
 * Process scheduled unpublishes: pages where unpublishAt <= now and status = 'published'
 */
async function processScheduledUnpublishes(db: DbClient, logger?: SchedulerOptions['logger']): Promise<number> {
  const now = new Date();

  const toUnpublish = await db
    .select({ id: pages.id, title: pages.title, siteId: pages.siteId })
    .from(pages)
    .where(
      and(
        eq(pages.status, 'published'),
        lte(pages.unpublishAt, now)
      )
    );

  if (toUnpublish.length === 0) return 0;

  for (const page of toUnpublish) {
    await db
      .update(pages)
      .set({
        status: 'archived',
        unpublishAt: null, // Clear the unpublish time after processing
        updatedAt: now,
      })
      .where(eq(pages.id, page.id));

    logger?.info(
      { pageId: page.id, title: page.title, siteId: page.siteId },
      'Published page unpublished (archived) by schedule'
    );
  }

  return toUnpublish.length;
}

/**
 * Run a single scheduling cycle. Returns counts of transitions.
 */
export async function runSchedulerOnce(
  db: DbClient,
  logger?: SchedulerOptions['logger']
): Promise<SchedulerResult> {
  const result: SchedulerResult = { published: 0, unpublished: 0, errors: 0 };

  try {
    result.published = await processScheduledPublishes(db, logger);
  } catch (err) {
    result.errors++;
    logger?.error(
      { error: err instanceof Error ? err.message : String(err) },
      'Error processing scheduled publishes'
    );
  }

  try {
    result.unpublished = await processScheduledUnpublishes(db, logger);
  } catch (err) {
    result.errors++;
    logger?.error(
      { error: err instanceof Error ? err.message : String(err) },
      'Error processing scheduled unpublishes'
    );
  }

  if (result.published > 0 || result.unpublished > 0) {
    logger?.info(
      { published: result.published, unpublished: result.unpublished },
      'Scheduler cycle complete'
    );
  }

  return result;
}

/**
 * Start the scheduling daemon as a background interval.
 * Returns a stop function to clear the interval.
 */
export function startScheduler(
  db: DbClient,
  options: SchedulerOptions = {}
): { stop: () => void } {
  const { intervalMs = 60_000, logger } = options;

  logger?.info(
    { intervalMs },
    'Content scheduling daemon started'
  );

  const handle = setInterval(async () => {
    await runSchedulerOnce(db, logger);
  }, intervalMs);

  // Run once immediately on start
  runSchedulerOnce(db, logger).catch((err) => {
    logger?.error(
      { error: err instanceof Error ? err.message : String(err) },
      'Scheduler initial run failed'
    );
  });

  return {
    stop: () => {
      clearInterval(handle);
      logger?.info({}, 'Content scheduling daemon stopped');
    },
  };
}
