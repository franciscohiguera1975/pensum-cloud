#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "⚙️  Setting up Pensum Cloud development environment..."

# Verify pnpm is available
if ! command -v pnpm &> /dev/null; then
  echo "📦 pnpm not found — enabling via corepack..."
  corepack enable
  corepack prepare pnpm@9 --activate
fi

# Install dependencies
cd "$ROOT_DIR"
pnpm install

# Copy env files if they don't exist
if [ ! -f "$ROOT_DIR/apps/backend/.env" ]; then
  cp "$ROOT_DIR/apps/backend/.env.example" "$ROOT_DIR/apps/backend/.env"
  echo "📄 Created apps/backend/.env — update your secrets!"
fi

if [ ! -f "$ROOT_DIR/apps/frontend/.env" ]; then
  cp "$ROOT_DIR/apps/frontend/.env.example" "$ROOT_DIR/apps/frontend/.env"
  echo "📄 Created apps/frontend/.env"
fi

if [ ! -f "$ROOT_DIR/infrastructure/.env" ]; then
  cp "$ROOT_DIR/infrastructure/.env.example" "$ROOT_DIR/infrastructure/.env"
  echo "📄 Created infrastructure/.env"
fi

# ── PostgreSQL ────────────────────────────────────────────────────────────────
cd "$ROOT_DIR/infrastructure"

# Si el container existe pero está unhealthy (ej: run anterior fallido), reiniciarlo
if docker ps -q --filter "name=pensum_postgres" --filter "health=unhealthy" | grep -q .; then
  echo "⚠️  Container pensum_postgres está unhealthy — reiniciando..."
  docker compose restart postgres
fi

docker compose up -d postgres

# Verificar desde el HOST que el puerto TCP 5432 está accesible.
# Más confiable que --wait: evita falsos positivos dentro del container
# cuando el port-mapping del host todavía no está listo.
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
# Pausa mínima para que postgres acepte conexiones (port abierto ≠ listo para queries)
sleep 1
echo "✅ PostgreSQL listo"

# ── Prisma: migrate → seed ────────────────────────────────────────────────────
# db:migrate:init usa --name init para no pedir input interactivo.
# Luego db:migrate (sin --name) se usa en el día a día para nuevas migraciones.
cd "$ROOT_DIR"
pnpm db:migrate:init
pnpm db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "  Opción A — local (backend + frontend en el host):"
echo "    pnpm dev"
echo ""
echo "  Opción B — Docker completo (hot-reload + debug):"
echo "    docker compose -f infrastructure/docker-compose.yml up"
echo ""
echo "  Swagger UI:    http://localhost:3000/docs"
echo "  Prisma Studio: pnpm db:studio  →  http://localhost:5555"
