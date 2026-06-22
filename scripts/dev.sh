#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Starting Pensum Cloud in development mode (local)..."
echo ""
echo "  Backend  → http://localhost:3000"
echo "  Frontend → http://localhost:5173"
echo "  Swagger  → http://localhost:3000/docs"
echo "  Debug    → attach VSCode on port 9229 (if running start:debug)"
echo ""

# ── PostgreSQL ────────────────────────────────────────────────────────────────
cd "$ROOT_DIR/infrastructure"

# Si el container está unhealthy, reiniciarlo antes de continuar
if docker ps -q --filter "name=pensum_postgres" --filter "health=unhealthy" | grep -q .; then
  echo "⚠️  Container pensum_postgres está unhealthy — reiniciando..."
  docker compose restart postgres
fi

docker compose up -d postgres

# Check desde el HOST: espera a que el puerto TCP 5432 esté accesible
echo "⏳ Esperando PostgreSQL en localhost:5432..."
TRIES=0
MAX_TRIES=60
until bash -c "echo > /dev/tcp/localhost/5432" 2>/dev/null; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge "$MAX_TRIES" ]; then
    echo "❌ Timeout: PostgreSQL no respondió en ${MAX_TRIES}s"
    echo "📋 Últimos logs del container:"
    docker compose logs postgres --tail=30
    exit 1
  fi
  sleep 1
done
sleep 1
echo "✅ PostgreSQL listo"

# ── Backend + Frontend en paralelo con Turbo ──────────────────────────────────
cd "$ROOT_DIR"
exec pnpm turbo run dev --parallel
