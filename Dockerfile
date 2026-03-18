FROM node:18-alpine AS base
# openssl is required by Prisma's query engine on Alpine (musl libc)
RUN apk add --no-cache libc6-compat openssl

# ── deps ──────────────────────────────────────────────────────────────────────
# Install all dependencies (including devDeps — prisma CLI and tsx are needed
# at runtime for migrations and seeding, and are devDependencies).
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client — does NOT require DATABASE_URL
RUN node_modules/.bin/prisma generate

# Build Next.js — DATABASE_URL is not required at build time
RUN node_modules/.bin/next build

# ── runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy full node_modules so prisma CLI and tsx are available for the
# entrypoint (migrate deploy + optional seed).
# DATABASE_URL and REDIS_URL must be provided by the host environment
# (via dokku config:set) — they are never baked into this image.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --chown=nextjs:nodejs public ./public
COPY --chown=nextjs:nodejs package.json ./

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown nextjs:nodejs docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Entrypoint runs migrations (and optionally seeds) before handing off to CMD.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node_modules/.bin/next", "start"]
