# syntax=docker/dockerfile:1

# Use pinned Node.js 20 Alpine base image
FROM node:20-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666 AS builder

# Add metadata labels
LABEL org.opencontainers.image.title="SYMBI Symphony"
LABEL org.opencontainers.image.description="W3C-compliant trust infrastructure for AI agents"
LABEL org.opencontainers.image.source="https://github.com/s8ken/SYMBI-Symphony"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="SYMBI Team"

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev for build)
RUN npm ci --ignore-scripts

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666

# Add metadata labels
LABEL org.opencontainers.image.title="SYMBI Symphony"
LABEL org.opencontainers.image.description="W3C-compliant trust infrastructure for AI agents"
LABEL org.opencontainers.image.source="https://github.com/s8ken/SYMBI-Symphony"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="SYMBI Team"

# Install runtime dependencies only
RUN apk add --no-cache \
    tini \
    wget

# Create non-root user
RUN addgroup -g 1001 -S symbi && \
    adduser -u 1001 -S symbi -G symbi

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy necessary runtime files
COPY LICENSE README.md ./

# Set ownership
RUN chown -R symbi:symbi /app

# Switch to non-root user
USER symbi

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5001

# Expose port
EXPOSE ${PORT}

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "dist/index.js"]
