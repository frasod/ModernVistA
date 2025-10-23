# ModernVista Backend Dockerfile
# Multi-stage build for production optimization

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files (include lock for deterministic installs)
COPY package*.json ./

# Install ALL dependencies (including dev) for build
RUN npm ci && npm cache clean --force

# Copy application source
COPY . .

# Build TypeScript -> dist
RUN npm run build

# Prune dev dependencies to reduce size for potential reuse
RUN npm prune --production

# Production stage  
FROM node:18-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S modernvista -u 1001

# Copy only the production node_modules (already pruned) and dist
COPY --from=builder --chown=modernvista:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=modernvista:nodejs /app/dist ./dist
COPY --from=builder --chown=modernvista:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p logs && chown modernvista:nodejs logs

# Switch to non-root user
USER modernvista

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]