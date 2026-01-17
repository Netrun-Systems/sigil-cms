# NetrunCMS API - Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/@netrun-cms/core/package.json ./packages/@netrun-cms/core/
COPY packages/@netrun-cms/db/package.json ./packages/@netrun-cms/db/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/@netrun-cms/core ./packages/@netrun-cms/core
COPY packages/@netrun-cms/db ./packages/@netrun-cms/db
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Build packages
RUN pnpm --filter @netrun-cms/core build
RUN pnpm --filter @netrun-cms/db build
RUN pnpm --filter @netrun-cms/api build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/@netrun-cms/core/dist ./packages/@netrun-cms/core/dist
COPY --from=builder /app/packages/@netrun-cms/core/package.json ./packages/@netrun-cms/core/
COPY --from=builder /app/packages/@netrun-cms/db/dist ./packages/@netrun-cms/db/dist
COPY --from=builder /app/packages/@netrun-cms/db/package.json ./packages/@netrun-cms/db/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

WORKDIR /app/apps/api

CMD ["node", "dist/index.js"]
