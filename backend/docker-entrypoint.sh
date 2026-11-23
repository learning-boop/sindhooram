#!/bin/sh
# Runs inside the backend container every time it starts (see Dockerfile).
set -e
APP="$(cd "$(dirname "$0")" && pwd)"
export PATH="$APP/node_modules/.bin:$PATH"
cd "$APP/packages/api/.medusa/server"

echo "[sindhooram] Updating the database tables..."
medusa db:migrate

# First start: creates the store, 10% commission, owner login, 3 demo vendors and their sarees.
# Later starts: finds the data and only shares the storefront key with the storefront container.
# (STOREFRONT_REVALIDATE_URL is blanked here because the storefront is not running yet.)
echo "[sindhooram] Checking the demo data..."
if ! STOREFRONT_REVALIDATE_URL= medusa exec ./src/scripts/seed.js; then
  echo "[sindhooram] The demo data step failed (details above). Starting the server anyway."
fi

echo "[sindhooram] Starting the backend: http://localhost:9000 (owner panel /dashboard, vendor panel /seller)"
exec medusa start
