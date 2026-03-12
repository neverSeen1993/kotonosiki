# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && \
    npm install tsx && \
    npm cache clean --force

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy server source (executed at runtime via tsx)
COPY server ./server

# Persist data directory as a volume
VOLUME /app/server/data

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["npx", "tsx", "server/index.ts"]
