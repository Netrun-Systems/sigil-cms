/**
 * GraphQL Endpoint
 *
 * Mounts a read-only GraphQL API at /graphql using graphql-http.
 * Public queries (pageBySlug, pageTree, publicTheme, siteByDomain) work without auth.
 * Admin queries require a valid JWT Bearer token.
 */

import type { Express, Request as ExpressRequest } from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import jwt from 'jsonwebtoken';
import { schema } from './schema.js';
import { resolvers } from './resolvers.js';
import type { AuthUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'netrun-cms-dev-secret-change-in-production';

/**
 * Mount the GraphQL handler on the Express app.
 *
 * graphql-http is a thin, spec-compliant handler (~4KB) that avoids the
 * weight of Apollo Server while supporting all standard GraphQL operations.
 */
export function mountGraphQL(app: Express): void {
  app.all(
    '/graphql',
    createHandler({
      schema,
      rootValue: resolvers,
      context: async (req) => {
        const ctx: Record<string, unknown> = {};

        // graphql-http wraps the Express request; access the raw request for headers
        const raw = req.raw as ExpressRequest;
        const authHeader = raw.headers?.authorization;

        if (authHeader) {
          const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

          try {
            const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
            ctx.tenantId = decoded.tenantId;
          } catch {
            // Invalid token -- proceed without auth (public queries still work)
          }
        }

        return ctx;
      },
    }),
  );
}
