# syntax=docker/dockerfile:1.7
#
# OnSig — production image.
#
# Build context: the `onsig/` directory (the monorepo root), so this Dockerfile
# can reach both `backend/` and `shared/`. The Next.js app lives in `backend/`
# but imports from `shared/` via the `@shared/*` path alias defined in
# `backend/tsconfig.json`. Building from a narrower `backend/` context would
# leave `shared/` invisible to webpack and the trace.
#
# Three stages:
#   1. `deps`    — install full dep tree (incl. native `argon2`,
#                  `@react-pdf/renderer`) using build-essential.
#   2. `builder` — copy both `shared/` and `backend/`, run `next build`. With
#                  `outputFileTracingRoot` pointing at the monorepo root,
#                  Next.js traces the cross-package imports into the
#                  standalone output.
#   3. `runner`  — minimal Debian slim runtime, non-root, only the standalone
#                  server + static + public.
#
# Final image size: ~180 MB.
#
# Build (local sanity check, from onsig/ directory):
#   docker build -t onsig-web:local .
# Run:
#   docker run --rm -p 3001:3001 --env-file backend/.env.local onsig-web:local

ARG NODE_VERSION=20.18.0

# ─── 1. dependencies ────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Only manifests first → docker layer cache survives source-only edits.
COPY backend/package.json backend/package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

# ─── 2. build ───────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build-time placeholders for env validation. The real values come from Fly
# secrets at runtime — these only satisfy Zod's "required" checks while
# Next.js compiles route modules during `next build`. They never reach the
# runtime image because the final stage doesn't carry the builder ENV.
ENV POSTGRES_URL="postgresql://build:build@localhost:5432/build"
ENV POSTGRES_URL_NON_POOLING="postgresql://build:build@localhost:5432/build"
ENV JWT_SECRET="build_time_only_placeholder_min_32_bytes_xxxxxxxxxxxxxxxxxxxxx"
ENV RESEND_API_KEY="re_build_time_only"
ENV MAIL_FROM="OnSig <build@onsig.dev>"

# Bring in the shared package alongside the backend so `@shared/*` resolves
# relative to `backend/tsconfig.json` → `../shared/*`.
COPY shared ./shared
COPY backend ./backend
COPY --from=deps /app/backend/node_modules ./backend/node_modules

WORKDIR /app/backend
RUN npm run build

# ─── 3. runtime ─────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# With `outputFileTracingRoot` set to the monorepo root in next.config.js,
# the standalone output lives under `.next/standalone/backend/server.js` and
# the hoisted node_modules sit at `.next/standalone/node_modules/`.
#
# The backend doesn't keep a `public/` directory today (assets live under
# `app/` / inside the standalone bundle).
# COPY --from=builder --chown=nextjs:nodejs /app/backend/public ./backend/public
COPY --from=builder --chown=nextjs:nodejs /app/backend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/backend/.next/static ./backend/.next/static

# Next.js' file-tracer sometimes misses native `.node` binaries shipped by
# `serverComponentsExternalPackages`. argon2 and @react-pdf/renderer's
# yoga-layout WASM rely on those binaries existing in node_modules at runtime,
# so we copy them straight from the deps stage. They get layered into the
# standalone tree at the exact path Node's resolver will look for them.
COPY --from=deps --chown=nextjs:nodejs /app/backend/node_modules/argon2 ./backend/node_modules/argon2
COPY --from=deps --chown=nextjs:nodejs /app/backend/node_modules/node-addon-api ./backend/node_modules/node-addon-api
COPY --from=deps --chown=nextjs:nodejs /app/backend/node_modules/node-gyp-build ./backend/node_modules/node-gyp-build
COPY --from=deps --chown=nextjs:nodejs /app/backend/node_modules/@phc ./backend/node_modules/@phc

USER nextjs
EXPOSE 3001

# Liveness probe: process up + Node can fetch. Container Apps / Fly proxy
# additionally checks /api/health/live via TCP+HTTP probes.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/server.js"]
