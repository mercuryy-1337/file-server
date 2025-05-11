#!/bin/sh
echo "Generating Prisma client..."
npx prisma generate --schema=./prisma/schema.prisma

# Check if database needs migrations
echo "Checking migrations..."
npx prisma migrate deploy

# Check if database is empty using Prisma
USER_COUNT=$(node ./scripts/check-db.mjs)

if [ "$USER_COUNT" -eq "0" ]; then
    echo "Database is empty, running seeds..."
    pnpm db:seed
else
    echo "Database already has data, skipping seeds..."
fi

echo "Starting application..."
pnpm start