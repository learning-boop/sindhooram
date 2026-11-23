# Sindhooram backend: the marketplace API (Mercur on Medusa), the owner panel (/dashboard)
# and the vendor panel (/seller). Started by docker-compose.yml in the project folder.
FROM node:24-bookworm-slim

# Bun installs the packages exactly as bun.lock says; Node runs the server.
RUN npm install -g bun@1.3.11 && npm cache clean --force

WORKDIR /app
ENV MERCUR_DISABLE_TELEMETRY=true \
    TURBO_TELEMETRY_DISABLED=1 \
    DO_NOT_TRACK=1

# 1) Packages. This step is cached until a package.json or bun.lock changes.
COPY package.json bun.lock bunfig.toml ./
COPY packages/api/package.json packages/api/
COPY apps/admin/package.json apps/admin/
COPY apps/vendor/package.json apps/vendor/
RUN NODE_ENV=development bun install --frozen-lockfile

# 2) Code and production build. The two panels remember the backend's address (as your
#    browser sees it) at build time, so it is a build setting.
COPY . .
ARG MERCUR_BACKEND_URL=http://localhost:9000
ENV MERCUR_BACKEND_URL=$MERCUR_BACKEND_URL
RUN NODE_ENV=production bun run build:ci

ENV NODE_ENV=production \
    PORT=9000
EXPOSE 9000
# Updates the database, loads the demo data the first time, then starts the server.
CMD ["sh", "/app/docker-entrypoint.sh"]
