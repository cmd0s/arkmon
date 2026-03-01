FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create data directory for SQLite
RUN mkdir -p data

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Default env vars (override via Dokploy environment settings)
ENV DATABASE_PATH=/app/data/arkmon.db
ENV MONITOR_INTERVAL_MS=60000
ENV ENABLED_TESTNETS=mendoza
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install wget for healthcheck
RUN apk add --no-cache wget

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy worker and monitoring files
COPY --from=builder --chown=nextjs:nodejs /app/worker.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Create data directory with correct permissions
RUN mkdir -p data && chown nextjs:nodejs data

USER nextjs

EXPOSE 3000

# Healthcheck for Dokploy
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/testnets || exit 1

# Start both the Next.js server and the monitoring worker
# Server runs in background, worker in foreground
# If worker crashes → container exits → Dokploy restarts it
# If server crashes → healthcheck fails → Dokploy restarts it
CMD ["sh", "-c", "node server.js & node node_modules/.bin/tsx worker.ts"]
