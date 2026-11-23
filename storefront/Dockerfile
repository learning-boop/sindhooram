# Sindhooram storefront (Next.js). Started by docker-compose.yml in the project folder.
FROM node:24-bookworm-slim

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Packages. Cached until package.json or package-lock.json changes.
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .
EXPOSE 3000
# The shop pages are pre-built from the live catalogue, so the build runs when the container
# starts (once the backend is up), not while the image is made. See docker-start.sh.
CMD ["sh", "/app/docker-start.sh"]
