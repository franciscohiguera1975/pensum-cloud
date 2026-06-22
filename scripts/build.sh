#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔨 Building Pensum Cloud..."

cd "$ROOT_DIR"
pnpm turbo run build

echo "✅ Build complete"
echo "  Backend  → apps/backend/dist/"
echo "  Frontend → apps/frontend/dist/"
