FROM node:20-alpine AS base

# --- Dependencies stage ---
FROM base AS deps
WORKDIR /app
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
COPY package.json ./
RUN npm install

# --- Build stage ---
FROM base AS build
WORKDIR /app
ARG NEXT_PUBLIC_STANDALONE_TRANSIT=false
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_STANDALONE_TRANSIT=$NEXT_PUBLIC_STANDALONE_TRANSIT
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Normalize the standalone output path (varies in monorepo vs standalone setups)
RUN STANDALONE_SERVER=$(find .next/standalone -name "server.js" -not -path "*/node_modules/*" | head -1) && \
    STANDALONE_DIR=$(dirname "$STANDALONE_SERVER") && \
    echo "Standalone at: $STANDALONE_DIR" && \
    mkdir -p /standalone && \
    cp -r "$STANDALONE_DIR"/. /standalone/ && \
    if [ -d ".next/standalone/node_modules" ]; then \
      cp -r .next/standalone/node_modules /standalone/node_modules; \
    fi

# --- Production stage ---
FROM base AS production
WORKDIR /app
ARG NEXT_PUBLIC_STANDALONE_TRANSIT=false
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_STANDALONE_TRANSIT=$NEXT_PUBLIC_STANDALONE_TRANSIT

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /standalone ./
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
