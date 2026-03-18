#!/bin/sh
set -e

echo "→ Pushing schema to database..."
node_modules/.bin/prisma db push --accept-data-loss

if [ "$PRISMA_RUN_SEED" = "true" ]; then
  echo "→ Seeding database..."
  node_modules/.bin/tsx prisma/seed.ts
fi

echo "→ Starting application..."
exec "$@"
