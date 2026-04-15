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
CMD ["npm", "run", "start"]