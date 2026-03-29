# Sigil CMS API — Cloud Run Deployment
# Multi-stage build with pnpm workspaces
#
# NOTE: Build context must be the repo root.
# The shared-ts packages (file: deps) are copied from the workspace.
# Run: docker build -f apps/api/Dockerfile -t sigil-api .

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./

# Copy shared-ts packages (file: references in apps/api/package.json)
COPY --from=netrun-shared-ts . ./netrun-shared-ts/ 2>/dev/null || true

# Copy all package.json files for install resolution
COPY packages/@netrun-cms/core/package.json ./packages/@netrun-cms/core/
COPY packages/@netrun-cms/db/package.json ./packages/@netrun-cms/db/
COPY packages/@netrun-cms/theme/package.json ./packages/@netrun-cms/theme/
COPY packages/@netrun-cms/ui/package.json ./packages/@netrun-cms/ui/
COPY packages/@netrun-cms/blocks/package.json ./packages/@netrun-cms/blocks/
COPY packages/@netrun-cms/embeds/package.json ./packages/@netrun-cms/embeds/
COPY packages/@netrun-cms/plugin-runtime/package.json ./packages/@netrun-cms/plugin-runtime/
COPY apps/api/package.json ./apps/api/

# Copy plugin package.jsons
COPY plugins/seo/package.json ./plugins/seo/
COPY plugins/artist/package.json ./plugins/artist/
COPY plugins/mailing-list/package.json ./plugins/mailing-list/
COPY plugins/contact/package.json ./plugins/contact/
COPY plugins/photos/package.json ./plugins/photos/
COPY plugins/advisor/package.json ./plugins/advisor/
COPY plugins/store/package.json ./plugins/store/
COPY plugins/printful/package.json ./plugins/printful/
COPY plugins/paypal/package.json ./plugins/paypal/
COPY plugins/booking/package.json ./plugins/booking/
COPY plugins/docs/package.json ./plugins/docs/
COPY plugins/resonance/package.json ./plugins/resonance/
COPY plugins/migrate/package.json ./plugins/migrate/
COPY plugins/webhooks/package.json ./plugins/webhooks/
COPY plugins/kamera/package.json ./plugins/kamera/
COPY plugins/kog/package.json ./plugins/kog/
COPY plugins/intirkast/package.json ./plugins/intirkast/
COPY plugins/charlotte/package.json ./plugins/charlotte/
COPY plugins/support/package.json ./plugins/support/

# Install dependencies (--no-frozen-lockfile to handle file: path differences)
RUN pnpm install --no-frozen-lockfile

# Copy all source
COPY packages/ ./packages/
COPY plugins/ ./plugins/
COPY apps/api/ ./apps/api/
COPY turbo.json ./

# Build via turbo
RUN npx turbo build --filter=@netrun-cms/api...

# --- Production stage ---
FROM node:20-alpine

WORKDIR /app

# Copy the bundled API (tsup bundles everything into dist/index.js)
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

# Install only production runtime deps needed by the bundled output
# Install runtime deps that tsup marks as external.
# IMPORTANT: drizzle-orm version MUST match the workspace version (^0.39.0 → 0.39.3)
# to avoid "getSQL is not a function" errors from prototype mismatches.
RUN npm install --omit=dev \
    express cors dotenv postgres zod helmet jsonwebtoken \
    drizzle-orm@0.39.3 drizzle-zod@0.7.1 \
    2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/index.js"]
