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

    // Cloud SQL uses Unix socket paths: postgresql://user:pass@/db?host=/cloudsql/project:region:instance
    // The postgres.js driver can't parse this URL format — need to pass options directly
    const isCloudSql = connectionString.includes('/cloudsql/');

    if (isCloudSql) {
      const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@\/([^?]+)\?host=(.+)/);
      if (match) {
        // For Cloud SQL Unix sockets, construct a postgres.js-compatible URL
        // postgres.js accepts host as a path when it starts with /
        const cleanUrl = `postgresql://${match[1]}:${encodeURIComponent(match[2])}@localhost/${match[3]}`;
        db = createDbClient({
          connectionString: cleanUrl,
          ssl: false,
          max: parseInt(process.env.DB_POOL_SIZE || '24'),
          idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30'),
          // Pass the socket path via the connection string option
          host: match[4],
        });
      } else {
        db = createDbClient({
          connectionString,
          ssl: false,
          max: parseInt(process.env.DB_POOL_SIZE || '24'),
          idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30'),
        });
      }
    } else {
      db = createDbClient({
        connectionString,
        ssl: connectionString.includes('azure.com') || process.env.NODE_ENV === 'production' ? 'require' : false,
        max: parseInt(process.env.DB_POOL_SIZE || '10'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '20'),
      });
    }
  }

  return db;
}

/**
 * Reset the database client (for testing)
 */
export function resetDb(): void {
  db = null;
}
