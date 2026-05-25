# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@9

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --filter backend --frozen-lockfile

COPY apps/backend/ ./apps/backend/

RUN cd apps/backend && ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

RUN pnpm --filter backend run build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-slim AS production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@9

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/

# Install ALL deps (not --prod) so prisma CLI is available for generate
RUN pnpm install --filter backend --frozen-lockfile

COPY apps/backend/prisma ./apps/backend/prisma

# Generate prisma client
RUN cd apps/backend && ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

# Copy built dist from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]