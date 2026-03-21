# Sigil CMS API — Cloud Run Deployment
# Multi-stage build with pnpm workspaces
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace config first (for dependency caching)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./

# Copy all package.json files for install
COPY packages/@netrun-cms/core/package.json ./packages/@netrun-cms/core/
COPY packages/@netrun-cms/db/package.json ./packages/@netrun-cms/db/
COPY packages/@netrun-cms/theme/package.json ./packages/@netrun-cms/theme/
COPY packages/@netrun-cms/ui/package.json ./packages/@netrun-cms/ui/
COPY packages/@netrun-cms/blocks/package.json ./packages/@netrun-cms/blocks/
COPY packages/@netrun-cms/embeds/package.json ./packages/@netrun-cms/embeds/
COPY packages/@netrun-cms/plugin-runtime/package.json ./packages/@netrun-cms/plugin-runtime/
COPY apps/api/package.json ./apps/api/

# Copy all plugin package.json files
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

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy all source code
COPY packages/ ./packages/
COPY plugins/ ./plugins/
COPY apps/api/ ./apps/api/

# Build everything via turbo (respects dependency order)
RUN npx turbo build --filter=@netrun-cms/api...

# --- Production stage ---
FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy built output
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/index.js"]
