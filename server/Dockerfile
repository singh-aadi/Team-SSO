### Multi-stage Dockerfile for the Startup Scout server
### Builder stage: install deps and compile TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Install build tools
RUN apk add --no-cache python3 make g++

# Copy package manifests and install all dependencies (including dev for tsc)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

### Runner stage: smaller image for production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy compiled output and static assets
COPY --from=builder /app/dist ./dist
# uploads are served from runtime storage or Cloud Storage; don't bake uploads into image

EXPOSE 3000

# Use a non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "dist/index.js"]
# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm install -D typescript @types/node
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Remove dev dependencies
RUN npm prune --production

# Expose port (Cloud Run uses PORT env variable, defaults to 8080)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Health check (uses PORT env variable)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
