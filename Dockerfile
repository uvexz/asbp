# syntax=docker/dockerfile:1

# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies using bun
RUN npm i -g bun
COPY package*.json ./
RUN bun install --frozen-lockfile

# Copy the rest of the source code and build
COPY . .
RUN bun run build

# Runner stage
FROM node:24-alpine AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Next.js defaults to port 3000
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "run", "start"]
