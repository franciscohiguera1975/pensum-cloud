# Pensum Cloud

Multi-Tenant SaaS para gestión de planes de estudio universitarios.

**Stack:** NestJS · React 18 · PostgreSQL · Prisma · pnpm · Docker · Kubernetes

---

## Inicio rápido

### Pre-requisitos

| Herramienta | Versión mínima |
|-------------|---------------|
| Node.js | 20+ |
| pnpm | 9+ |
| Docker + Compose | 24+ |

```bash
# Activar pnpm (viene con Node.js via corepack)
corepack enable
```

---

## Modo A — Local (procesos en el host)

Ideal para desarrollo diario. Solo PostgreSQL corre en Docker.

```bash
# 1. Setup inicial (solo la primera vez)
pnpm setup

# 2. Desarrollar
pnpm dev
```

| URL | Descripción |
|-----|-------------|
| http://localhost:3000 | Backend API |
| http://localhost:5173 | Frontend (Vite HMR) |
| http://localhost:3000/docs | Swagger UI |

---

## Modo B — Docker completo (dev con hot-reload)

Todo corre en contenedores. El código se monta como volumen → hot-reload activo.

```bash
# 1. Copiar env (solo la primera vez)
cp infrastructure/.env.example infrastructure/.env
cp apps/backend/.env.example apps/backend/.env

# 2. Levantar todo
docker compose -f infrastructure/docker-compose.yml up

# 3. Migraciones y seed (primera vez)
docker compose -f infrastructure/docker-compose.yml exec backend \
  sh -c "pnpm exec prisma migrate dev && pnpm exec prisma db seed"
```

| URL | Descripción |
|-----|-------------|
| http://localhost:3000 | Backend API |
| http://localhost:5173 | Frontend (Vite HMR) |
| http://localhost:3000/docs | Swagger UI |
| localhost:9229 | Node.js debugger (attach VSCode) |

```bash
# Con PgAdmin
docker compose -f infrastructure/docker-compose.yml --profile tools up
# → http://localhost:5050  (admin@pensum.local / admin)
```

---

## Modo C — Docker producción (servidor / VPS)

Imágenes compiladas. Frontend servido por nginx.

```bash
# Editar variables en infrastructure/.env (POSTGRES_PASSWORD, etc.)
cp infrastructure/.env.example infrastructure/.env

docker compose \
  -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.prod.yml \
  up -d

# Migraciones (primera vez en servidor)
docker compose -f infrastructure/docker-compose.yml \
  -f infrastructure/docker-compose.prod.yml \
  exec backend npx prisma migrate deploy
```

> Desde la raíz del proyecto:
> ```bash
> pnpm docker:prod    # levantar producción
> pnpm docker:down    # parar
> ```

---

## Debugging con VSCode

1. Levantar con **Modo B** (expone puerto 9229 automáticamente)
2. En VSCode → pestaña **Run & Debug** → seleccionar **"🐛 Docker — Attach Backend"**
3. Poner breakpoints en cualquier archivo `.ts` del backend → funciona de inmediato

También disponible: **"🚀 Local — Launch Backend (debug)"** para lanzar sin Docker.

---

## Comandos útiles

```bash
# Base de datos
pnpm db:generate    # regenerar cliente Prisma
pnpm db:migrate     # aplicar migraciones (dev)
pnpm db:seed        # seed inicial
pnpm db:studio      # Prisma Studio → http://localhost:5555

# Tests
pnpm test:backend   # Jest (NestJS)
pnpm test:frontend  # Vitest (React)

# Docker
pnpm docker:dev     # Modo B (docker compose up dev)
pnpm docker:prod    # Modo C (docker compose prod)
pnpm docker:down    # parar containers
```

---

## Estructura del proyecto

```
pensum-cloud/
├── apps/
│   ├── backend/           # NestJS — Clean Architecture + DDD + CQRS
│   └── frontend/          # React 18 + Vite + Zustand + React Query
├── infrastructure/
│   ├── docker-compose.yml          # base (postgres siempre)
│   ├── docker-compose.override.yml # dev auto (hot-reload + debug :9229)
│   ├── docker-compose.prod.yml     # producción (nginx + built images)
│   └── k8s/                        # manifiestos Kubernetes (Kustomize)
├── scripts/               # setup.sh / dev.sh / build.sh
├── tests/                 # backend/ + frontend/
├── .vscode/               # launch.json (debug) + settings.json
└── docs/                  # arquitectura, contratos API, roadmap
```

---

## Kubernetes

```bash
nano infrastructure/k8s/secret.yaml   # reemplazar valores base64
kubectl apply -k infrastructure/k8s/
```
