# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY package.json package-lock.json ./
RUN npm ci

# Vite bakes env vars into the JS bundle at build time.
# Accept them as build args so docker-compose (or CI) can inject them.
ARG VITE_JOBS_URL=http://localhost:8002
ARG VITE_APPLICATIONS_URL=http://localhost:8001
ARG VITE_CANDIDATES_URL=http://localhost:3000

ENV VITE_JOBS_URL=$VITE_JOBS_URL
ENV VITE_APPLICATIONS_URL=$VITE_APPLICATIONS_URL
ENV VITE_CANDIDATES_URL=$VITE_CANDIDATES_URL

COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
