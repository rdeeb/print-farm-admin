#!/bin/sh
set -e

echo "→ Running database migrations..."
node_modules/.bin/prisma migrate deploy

if [ "$PRISMA_RUN_SEED" = "true" ]; then
  echo "→ Seeding database..."
  node_modules/.bin/tsx prisma/seed.ts
fi

echo "→ Starting application..."
exec node_modules/.bin/next start
