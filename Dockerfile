# Sigil CMS API — Production Cloud Run Image
# Uses pre-built tsup bundle (apps/api/dist/index.js).
# Build steps:
#   1. pnpm build --filter=@netrun-cms/api...
#   2. docker build -t sigil-api .

FROM node:20-alpine
WORKDIR /app

# Install exactly the external packages required by the tsup bundle.
# These are packages the bundle requires() at runtime but does NOT inline.
# (Node built-ins like crypto, fs, path are excluded — they're built into Node.)
RUN npm install --no-save --legacy-peer-deps \
    cors \
    dotenv \
    "drizzle-orm@0.39.3" \
    encoding \
    "express@4.22.1" \
    express-async-errors \
    express-validator \
    googleapis \
    graphql \
    graphql-http \
    helmet \
    jsonwebtoken \
    multer \
    pg \
    postgres \
    stripe \
    uuid \
    zod \
    supports-color \
    && echo "Runtime deps installed"

# Copy the pre-built bundle
COPY apps/api/dist/index.js ./dist/index.js

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -q --spider http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/index.js"]
