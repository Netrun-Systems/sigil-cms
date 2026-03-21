#!/usr/bin/env node
/**
 * Standalone Content Scheduler
 *
 * Runs a single scheduling cycle and exits. Suitable for cron jobs.
 *
 * Usage:
 *   npx tsx src/scheduler-cli.ts          # one-shot
 *   node dist/scheduler-cli.js            # production build
 *
 * Environment:
 *   DATABASE_URL  — PostgreSQL connection string (required)
 *
 * Exit codes:
 *   0 = success
 *   1 = error
 */

import 'dotenv/config';
import { createDbClient } from '@netrun-cms/db';
import { runSchedulerOnce } from './lib/scheduler.js';

const logger = {
  info: (obj: Record<string, unknown>, msg: string) => {
    console.log(JSON.stringify({ level: 'info', msg, ...obj, ts: new Date().toISOString() }));
  },
  warn: (obj: Record<string, unknown>, msg: string) => {
    console.warn(JSON.stringify({ level: 'warn', msg, ...obj, ts: new Date().toISOString() }));
  },
  error: (obj: Record<string, unknown>, msg: string) => {
    console.error(JSON.stringify({ level: 'error', msg, ...obj, ts: new Date().toISOString() }));
  },
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error({}, 'DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const db = createDbClient({
    connectionString,
    ssl: connectionString.includes('azure.com') ? 'require' : false,
    max: 2,
    idleTimeout: 5,
  });

  const result = await runSchedulerOnce(db, logger);

  logger.info(
    { published: result.published, unpublished: result.unpublished, errors: result.errors },
    'Scheduler run complete'
  );

  process.exit(result.errors > 0 ? 1 : 0);
}

main().catch((err) => {
  logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Scheduler fatal error');
  process.exit(1);
});
