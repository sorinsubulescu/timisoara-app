FROM node:20-alpine AS base
RUN apk update && apk add --no-cache openssl ca-certificates && update-ca-certificates

# --- Dependencies stage ---
# Build context is apps/api; root-level package.json and lock file are one level up
FROM base AS deps
WORKDIR /app
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
COPY ../package.json ./
COPY ../package-lock.json ./
COPY prisma ./prisma/
RUN npm install && npx prisma generate

# --- Build stage ---
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY tsconfig.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma
RUN npx nest build

# --- Production stage ---
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY ../package.json ./

USER nestjs

EXPOSE 4000
CMD ["sh", "-c", "if [ -d prisma/migrations ] && [ \"$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')\" -gt 0 ]; then npx prisma migrate deploy; else npx prisma db push --skip-generate; fi && node dist/src/main"]
