# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production Runtime Stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean default nginx assets
RUN rm -rf ./*

# Copy built assets and custom nginx configuration
COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
