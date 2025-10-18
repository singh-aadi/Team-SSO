### Multi-stage Dockerfile at repo root
### It builds the server located in ./server using TypeScript build
FROM node:20-alpine AS builder
WORKDIR /workspace

RUN apk add --no-cache python3 make g++

# Copy server package.json and install
COPY server/package.json server/package-lock.json* ./server/
WORKDIR /workspace/server
RUN npm ci

# Copy server source and build
COPY server/ ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY server/package.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /workspace/server/dist ./dist

EXPOSE 3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "dist/index.js"]
