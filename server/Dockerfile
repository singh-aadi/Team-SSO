# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the application
# Cloud Run will inject PORT environment variable
CMD ["node", "dist/index.js"]
