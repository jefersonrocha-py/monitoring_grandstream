#!/bin/sh
set -e

echo "▶️  DATABASE_URL=$DATABASE_URL"
# tenta aplicar migrações; se não houver, faz db push (cria schema)
npx prisma migrate deploy || npx prisma db push

echo "🚀 starting Next.js on port ${PORT:-3000}"
npm run start -- -p ${PORT:-3000}
