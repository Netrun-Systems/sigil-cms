/**
 * Database migration utilities
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import type { DbClient } from './client';

/**
 * Run pending database migrations
 */
export async function runMigrations(db: DbClient, migrationsFolder = './migrations'): Promise<void> {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder });
  console.log('Migrations complete.');
}
