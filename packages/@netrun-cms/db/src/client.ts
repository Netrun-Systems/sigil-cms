/**
 * Database client factory for NetrunCMS
 *
 * Supports PostgreSQL with optional SSL and connection pooling
 */

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type DbClient = PostgresJsDatabase<typeof schema>;

export interface DbConfig {
  connectionString: string;
  ssl?: boolean | 'require' | 'prefer';
  max?: number;
  idleTimeout?: number;
}

/**
 * Create a database client with the given configuration
 */
export function createDbClient(config: DbConfig): DbClient {
  const { connectionString, ssl = true, max = 10, idleTimeout = 20 } = config;

  const client = postgres(connectionString, {
    ssl: ssl === true ? 'require' : ssl === false ? false : ssl,
    max,
    idle_timeout: idleTimeout,
  });

  return drizzle(client, { schema });
}

/**
 * Set tenant context for Row-Level Security
 * Call this at the start of each request in a multi-tenant context
 */
export async function setTenantContext(
  db: DbClient,
  tenantId: string,
  userId?: string
): Promise<void> {
  // Set PostgreSQL session variables for RLS policies
  await db.execute(
    `SET LOCAL app.current_tenant_id = '${tenantId}'`
  );
  if (userId) {
    await db.execute(
      `SET LOCAL app.current_user_id = '${userId}'`
    );
  }
}

/**
 * Clear tenant context
 */
export async function clearTenantContext(db: DbClient): Promise<void> {
  await db.execute(`RESET app.current_tenant_id`);
  await db.execute(`RESET app.current_user_id`);
}
