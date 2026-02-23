/**
 * Database Client Singleton
 *
 * Provides a single database client instance for the API
 */

import { createDbClient, type DbClient } from '@netrun-cms/db';

let db: DbClient | null = null;

/**
 * Get the database client instance
 *
 * Creates a new client on first call, reuses on subsequent calls
 */
export function getDb(): DbClient {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    db = createDbClient({
      connectionString,
      ssl: connectionString.includes('azure.com') || process.env.NODE_ENV === 'production' ? 'require' : false,
      max: parseInt(process.env.DB_POOL_SIZE || '10'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '20'),
    });
  }

  return db;
}

/**
 * Reset the database client (for testing)
 */
export function resetDb(): void {
  db = null;
}
