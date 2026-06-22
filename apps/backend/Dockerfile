# =============================================================================
# Pensum Cloud — Backend Dockerfile
# Build context: repo root  (docker compose sets context: ..)
# =============================================================================

# ── Stage 1: base ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

# ── Stage 2: deps (install — layer cached until lockfile changes) ─────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
RUN pnpm install --frozen-lockfile

# ── Stage 3: development (hot-reload + debugger on :9229) ────────────────────
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY . .
RUN cd apps/backend && pnpm exec prisma generate
WORKDIR /app/apps/backend
# Enable file-watch polling for Docker volume mounts on Linux/Mac
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
EXPOSE 3000 9229
CMD ["sh", "-c", "pnpm exec prisma generate && pnpm start:debug"]

# ── Stage 4: builder (compile TypeScript) ────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY . .
RUN cd apps/backend && pnpm exec prisma generate && pnpm build

# ── Stage 5: production (minimal runtime) ─────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 3000
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/package.json ./package.json
CMD ["sh", "-c", "apps/backend/node_modules/.bin/prisma migrate deploy && node dist/main"]
