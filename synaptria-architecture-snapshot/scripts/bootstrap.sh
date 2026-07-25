#!/usr/bin/env bash
set -euo pipefail

cp -n .env.example .env || true
pnpm install
docker compose up -d postgres minio
pnpm db:generate

echo "Bootstrap complete."
echo "Run: pnpm db:migrate"
echo "Then: pnpm dev"
