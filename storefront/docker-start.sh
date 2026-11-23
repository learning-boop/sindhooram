#!/bin/sh
# Runs inside the storefront container every time it starts (see Dockerfile).
set -e
cd "$(dirname "$0")"
KEY_FILE="${MEDUSA_PUBLISHABLE_KEY_FILE:-/shared/publishable_key}"

# The backend writes the storefront key here once its demo data is ready.
tries=0
until [ -s "$KEY_FILE" ]; do
  tries=$((tries + 1))
  if [ "$tries" -gt 150 ]; then
    echo "[sindhooram] No storefront key at $KEY_FILE. Check the backend logs: docker compose logs backend"
    exit 1
  fi
  [ "$tries" -eq 1 ] && echo "[sindhooram] Waiting for the backend to share the storefront key..."
  sleep 2
done
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="$(cat "$KEY_FILE")"
export NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

# Build once per container (and again if the key changes, e.g. after a fresh database).
if [ ! -f .next/BUILD_ID ] || [ "$(cat .next/docker-key 2>/dev/null)" != "$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" ]; then
  echo "[sindhooram] Building the storefront (about a minute)..."
  ./node_modules/.bin/next build
  printf '%s' "$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY" > .next/docker-key
fi

echo "[sindhooram] Shop ready: http://localhost:3000"
exec ./node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
