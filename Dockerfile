# Stage 1: Build the client PWA using Node.js 22 Alpine
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies using clean install from lockfile
COPY package*.json ./
RUN npm ci

# Copy full application source
COPY . .

# Run production build and generate precache manifest
RUN npm run build

# Stage 2: Minimal unprivileged Nginx static runtime
FROM nginx:alpine

# Remove default configuration and copy custom SPA config
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
