FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/

RUN bun install

# Copy source code
COPY . .

# Build the server
RUN cd apps/server && bun run build

# Start the server
WORKDIR /app/apps/server
EXPOSE 3000
CMD ["bun", "run", "dist/index.mjs"]
