# NetrunCMS API - Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/@netrun-cms/core/package.json ./packages/@netrun-cms/core/
COPY packages/@netrun-cms/db/package.json ./packages/@netrun-cms/db/
COPY packages/@netrun-cms/theme/package.json ./packages/@netrun-cms/theme/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/@netrun-cms/core ./packages/@netrun-cms/core
COPY packages/@netrun-cms/db ./packages/@netrun-cms/db
COPY packages/@netrun-cms/theme ./packages/@netrun-cms/theme
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Build packages
RUN pnpm --filter @netrun-cms/core build
RUN pnpm --filter @netrun-cms/db build
RUN pnpm --filter @netrun-cms/theme build
RUN pnpm --filter @netrun-cms/api build

# Deploy API with production deps using pnpm deploy
RUN pnpm --filter @netrun-cms/api deploy --prod /prod

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy deployed artifacts
COPY --from=builder /prod ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
