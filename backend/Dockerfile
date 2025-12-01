# ==================== BUILD STAGE ====================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# ==================== PRODUCTION STAGE ====================
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy from builder (FIX: Destination MUST end with / for multiple files!)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/ ./node_modules/
COPY --from=builder --chown=nodejs:nodejs /app/ ./

# Create necessary directories
RUN mkdir -p logs uploads temp backups && \
    chown -R nodejs:nodejs logs uploads temp backups && \
    chmod -R 755 logs uploads temp backups

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]
