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
# Copy source schemas ensuring complete JSDoc OpenAPI parsing block availability at runtime
COPY --from=builder /app/src/docs ./src/docs

# Create cert directory. Private keys are provided at runtime, never baked into the image.
RUN mkdir -p certs
COPY certs/cert.pem certs/public.pem ./certs/

EXPOSE 3000

CMD ["node", "dist/index.js"]
