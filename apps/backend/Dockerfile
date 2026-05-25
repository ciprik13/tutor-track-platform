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

# Use local prisma binary (v5.22.0) not npx which downloads latest
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

RUN pnpm install --filter backend --frozen-lockfile --prod

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY apps/backend/prisma ./apps/backend/prisma

# Use local prisma binary (v5.22.0) not npx
RUN cd apps/backend && ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]