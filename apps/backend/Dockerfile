# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests first (for layer caching)
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy only backend package.json (so pnpm can resolve the workspace)
COPY apps/backend/package.json ./apps/backend/

# Install only backend dependencies (skip other workspace packages)
RUN pnpm install --filter backend --frozen-lockfile

# Copy backend source
COPY apps/backend/ ./apps/backend/

# Generate Prisma client
RUN pnpm --filter backend exec prisma generate

# Build NestJS
RUN pnpm --filter backend run build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/

# Install production-only deps
RUN pnpm install --filter backend --frozen-lockfile --prod

# Copy built dist and generated prisma client
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma
COPY --from=builder /app/apps/backend/node_modules/@prisma ./apps/backend/node_modules/@prisma

# Copy prisma schema (needed for migrate deploy at startup)
COPY apps/backend/prisma ./apps/backend/prisma

WORKDIR /app/apps/backend

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]