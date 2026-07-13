# Stage 1: Build shared
FROM node:24-slim AS shared-build
WORKDIR /app/shared
COPY packages/shared/package*.json ./
RUN npm install
COPY packages/shared /app/shared 
ENV ROLLUP_NO_NATIVE=true;
RUN npm run build

# Stage 2: Build server
FROM node:24-slim AS server-build
WORKDIR /app/server

COPY packages/server/package*.json ./
RUN npm install
COPY packages/server /app/server

# Copy shared/dist into server
COPY --from=shared-build /app/shared/dist ../shared/dist

ENV ROLLUP_NO_NATIVE=true;
RUN npm run build

# Stage 3: Production image
FROM node:24-slim AS server
WORKDIR /app
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/package.json ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok?0:1))"
CMD ["node", "dist/server.js"]