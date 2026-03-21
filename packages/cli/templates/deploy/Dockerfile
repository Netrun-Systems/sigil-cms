FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/content ./content
COPY --from=builder /app/public ./public
COPY --from=builder /app/sigil.config.ts ./sigil.config.ts

EXPOSE 3000

CMD ["node", "dist/index.js"]
