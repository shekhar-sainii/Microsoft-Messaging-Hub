# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install ALL deps
COPY package*.json ./
RUN npm install

# Copy source and build TypeScript
COPY . .
RUN npm run build

# ---

# Stage 2: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production deps only
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Create keys directory and copy certs for crypto utils
RUN mkdir -p dist/keys
COPY certs/public.pem dist/keys/public.pem
COPY certs/private.pem dist/keys/private.pem
COPY certs/cert.pem dist/keys/cert.pem

# Copy cert files (for direct access if needed)
COPY certs/ ./certs/

EXPOSE 3000

CMD ["node", "dist/index.js"]
