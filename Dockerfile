# syntax=docker/dockerfile:1

# Node 24 matters: the app stores RSVPs and gift claims through node:sqlite,
# which is built into the Node binary from 22+. Nothing is compiled at install
# time, so there is no build-tools layer and the image works on Alpine's musl.

# ---------- dependencies ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    WEDDING_DB_PATH=/app/data/wedding.db

# Run as a non-root user. Anything reachable from the public internet should
# not be able to write outside its own data directory even if it is breached.
RUN addgroup -g 1001 -S nodejs \
 && adduser -u 1001 -S nextjs -G nodejs

# `output: "standalone"` produces server.js plus only the node_modules actually
# reached, so the runtime image carries no build toolchain. static/ and public/
# are NOT included in that trace and must be copied separately.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# SQLite in WAL mode writes wedding.db plus -wal and -shm siblings, so the
# DIRECTORY has to be writable by the runtime user, not just the file.
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000

# Hits the health route rather than the homepage: it answers "is the server
# accepting requests", which is the question a restart policy should act on.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
