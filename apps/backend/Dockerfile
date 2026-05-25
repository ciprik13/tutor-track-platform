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

# Generate prisma client and verify it was created
RUN cd apps/backend && npx prisma generate --schema=./prisma/schema.prisma
RUN ls -la /app/apps/backend/node_modules/.prisma || echo "WARNING: .prisma not found"
RUN ls -la /app/node_modules/.prisma || echo "WARNING: root .prisma not found"

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

RUN pnpm install --filter backend --frozen-lockfile --prod

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY apps/backend/prisma ./apps/backend/prisma

# Regenerate prisma client directly in production (simplest approach)
RUN cd apps/backend && npx prisma generate --schema=./prisma/schema.prisma

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]