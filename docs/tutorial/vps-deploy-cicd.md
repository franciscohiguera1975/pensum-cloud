# Despliegue en VPS + CI/CD con GitHub Actions

Guía paso a paso para llevar Pensum Cloud a producción en un VPS Ubuntu y automatizar los despliegues con GitHub Actions.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Preparar el VPS](#2-preparar-el-vps)
3. [Instalar Docker y Docker Compose](#3-instalar-docker-y-docker-compose)
4. [Clonar el repositorio en el VPS](#4-clonar-el-repositorio-en-el-vps)
5. [Configurar variables de entorno](#5-configurar-variables-de-entorno)
6. [Elegir puertos (evitar conflictos)](#6-elegir-puertos-evitar-conflictos)
7. [Primer despliegue manual](#7-primer-despliegue-manual)
8. [HTTPS con Nginx + Certbot](#8-https-con-nginx--certbot)
9. [Configurar CI/CD con GitHub Actions](#9-configurar-cicd-con-github-actions)
10. [Verificar el pipeline completo](#10-verificar-el-pipeline-completo)
11. [Operaciones de mantenimiento](#11-operaciones-de-mantenimiento)

---

## 1. Requisitos previos

### En tu máquina local
- Git configurado con acceso al repositorio
- Cuenta en GitHub con permisos de administrador sobre el repo

### VPS recomendado
| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disco | 20 GB | 40 GB SSD |
| SO | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Puertos que necesita la aplicación
| Servicio | Puerto interno (container) | Puerto host (configurable) |
|----------|---------------------------|---------------------------|
| Frontend (nginx) | 80 | `FRONTEND_PORT` (default 80) |
| Backend (NestJS) | 3000 | `BACKEND_PORT` (default 3000) |
| PostgreSQL | 5432 | `POSTGRES_PORT` (default 5432) |
| Nginx reverse proxy | 80 / 443 | fijo en el host |

> Todos los puertos del host son configurables mediante variables de entorno. Ver sección 6.

---

## 2. Preparar el VPS

Conéctate al VPS como root o con un usuario con `sudo`:

```bash
ssh root@<IP_DEL_VPS>
```

### Actualizar el sistema

```bash
apt update && apt upgrade -y
```

### Crear un usuario de despliegue (no usar root)

```bash
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy   # se agrega después de instalar Docker
```

### Configurar acceso SSH por clave (desde tu máquina local)

```bash
# En tu máquina local — genera una clave si no tienes una
ssh-keygen -t ed25519 -C "deploy@pensum-cloud" -f ~/.ssh/pensum_deploy

# Copia la clave pública al VPS
ssh-copy-id -i ~/.ssh/pensum_deploy.pub deploy@<IP_DEL_VPS>

# Verifica que puedes entrar sin contraseña
ssh -i ~/.ssh/pensum_deploy deploy@<IP_DEL_VPS>
```

### Abrir los puertos necesarios en el firewall

```bash
# En el VPS
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
# Si expones el backend directamente (no recomendado en producción con reverse proxy):
# ufw allow 3001/tcp   ← tu BACKEND_PORT personalizado
ufw enable
ufw status
```

---

## 3. Instalar Docker y Docker Compose

```bash
# Instalar dependencias
apt install -y ca-certificates curl gnupg lsb-release

# Agregar el repositorio oficial de Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalación
docker --version
docker compose version

# Agregar el usuario deploy al grupo docker (si aún no lo hiciste)
usermod -aG docker deploy
```

> Cierra y vuelve a abrir la sesión SSH como `deploy` para que el grupo tome efecto.

---

## 4. Clonar el repositorio en el VPS

```bash
# Como usuario deploy
ssh deploy@<IP_DEL_VPS>

# Crear directorio de la aplicación
mkdir -p /opt/pensum-cloud
cd /opt/pensum-cloud

# Clonar el repositorio
git clone https://github.com/<TU_ORG>/<TU_REPO>.git .
```

Si el repositorio es privado, usa un **Deploy Key** de GitHub:

```bash
# En el VPS — generar clave para el repo
ssh-keygen -t ed25519 -C "vps-deploy-key" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```

Copia la clave pública y agrégala en GitHub:
`Repositorio → Settings → Deploy keys → Add deploy key` (solo lectura).

Luego clona con SSH:
```bash
GIT_SSH_COMMAND="ssh -i ~/.ssh/github_deploy" git clone git@github.com:<TU_ORG>/<TU_REPO>.git .
```

> **Importante:** Esta misma deploy key (o la SSH key del usuario `deploy`) también es la que permite que `git pull` funcione desde el VPS en los deploys automatizados. Configura el host de GitHub en `~/.ssh/config` para que `git pull` use la clave correcta automáticamente:
>
> ```bash
> cat >> ~/.ssh/config << 'EOF'
> Host github.com
>   IdentityFile ~/.ssh/github_deploy
>   StrictHostKeyChecking no
> EOF
> ```

---

## 5. Configurar variables de entorno

### Backend — `apps/backend/.env`

```bash
cd /opt/pensum-cloud
cp apps/backend/.env.example apps/backend/.env
nano apps/backend/.env
```

Contenido mínimo para producción:

```dotenv
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# La URL la sobreescribe docker-compose.prod.yml automáticamente
DATABASE_URL="postgresql://postgres:CAMBIA_ESTA_CONTRASEÑA@postgres:5432/pensum_cloud?schema=public"

# ⚠️ Generar con: openssl rand -base64 64
JWT_SECRET=GENERA_UN_SECRETO_ALEATORIO_LARGO
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=GENERA_OTRO_SECRETO_ALEATORIO_LARGO
JWT_REFRESH_EXPIRATION=7d
```

### Variables de infraestructura — `infrastructure/.env`

```bash
cp infrastructure/.env.example infrastructure/.env 2>/dev/null || touch infrastructure/.env
nano infrastructure/.env
```

```dotenv
# ── Base de datos ──────────────────────────────────────────────────────────
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CAMBIA_ESTA_CONTRASEÑA_DB
POSTGRES_DB=pensum_cloud

# ── Puertos del host (ver sección 6) ──────────────────────────────────────
POSTGRES_PORT=5433        # cambiar si el 5432 está ocupado
BACKEND_PORT=3001         # cambiar si el 3000 está ocupado
FRONTEND_PORT=8080        # cambiar si el 80 está ocupado

# ── JWT (debe coincidir con apps/backend/.env) ─────────────────────────────
JWT_SECRET=GENERA_UN_SECRETO_ALEATORIO_LARGO
JWT_REFRESH_SECRET=GENERA_OTRO_SECRETO_ALEATORIO_LARGO
```

> Genera secretos seguros con: `openssl rand -base64 64`

---

## 6. Elegir puertos (evitar conflictos)

Si el VPS ya tiene otros servicios activos (otro sitio web, API, base de datos, panel de control como Plesk/cPanel), los puertos por defecto pueden estar ocupados.

### Verificar qué puertos están en uso

```bash
# Qué está escuchando en los puertos que nos interesan
ss -tlnp | grep -E ':80|:443|:3000|:5432'

# O de forma más detallada
lsof -i :80
lsof -i :3000
lsof -i :5432
```

### Estrategia recomendada para VPS compartido

```
┌─────────────────────────────────────────────────────┐
│  Host VPS                                           │
│                                                     │
│  :80  / :443  ←── Nginx del VPS (reverse proxy)    │
│       │                                             │
│       ├──/api/→  localhost:3001  (backend NestJS)   │
│       └──/    →  localhost:8080  (frontend nginx)   │
│                                                     │
│  :5433  ←──────── PostgreSQL (no expuesto a inet)   │
└─────────────────────────────────────────────────────┘
```

### Configuración de puertos en `infrastructure/.env`

```dotenv
# Ejemplo con puertos alternativos
FRONTEND_PORT=8080    # el reverse proxy del VPS apuntará aquí
BACKEND_PORT=3001     # el reverse proxy del VPS apuntará aquí
POSTGRES_PORT=5433    # solo accesible localmente
```

> El puerto de PostgreSQL **nunca debe exponerse a Internet**. Solo los containers internos lo usan. Si no necesitas acceso externo a la DB, establece `POSTGRES_PORT=5432` solo en la red Docker interna (ver nota abajo).

**Nota:** Para que PostgreSQL no sea accesible desde fuera del host en absoluto, cambia el mapeo de puertos en `docker-compose.yml` de:
```yaml
ports:
  - '${POSTGRES_PORT:-5432}:5432'
```
a:
```yaml
ports:
  - '127.0.0.1:${POSTGRES_PORT:-5432}:5432'
```
Esto hace que el puerto solo escuche en loopback.

---

## 7. Primer despliegue manual

```bash
cd /opt/pensum-cloud/infrastructure

# Construir imágenes y levantar todos los servicios
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  --env-file .env \
  up -d --build

# Verificar que los containers están corriendo
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Migraciones y seed inicial

> **Las migraciones se ejecutan automáticamente** al iniciar el container backend — el `CMD` del Dockerfile corre `prisma migrate deploy` antes de levantar la app. No es necesario correrlas manualmente.

```bash
# (Opcional) Cargar datos de ejemplo — solo después de que el container esté Running
docker exec pensum_backend node apps/backend/dist/prisma/seed.js
```

Para verificar que las migraciones corrieron correctamente:
```bash
docker logs pensum_backend | grep -E "migrat|error|Error" | head -20
```

### Verificar que funciona

```bash
# Health check del backend (ajusta el puerto si cambiaste BACKEND_PORT)
curl http://localhost:3001/api/v1

# Ver logs en tiempo real
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend
```

---

## 8. HTTPS con Nginx + Certbot

Esta sección configura Nginx en el **host** del VPS como reverse proxy, terminando SSL antes de llegar a los containers.

### Instalar Nginx y Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
```

### Configurar el sitio en Nginx

```bash
nano /etc/nginx/sites-available/pensum-cloud
```

```nginx
# /etc/nginx/sites-available/pensum-cloud
# Ajusta el puerto si cambiaste FRONTEND_PORT en infrastructure/.env

server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Todo el tráfico va al frontend container.
    # El nginx interno del frontend ya hace proxy de /api/ → backend:3000
    # dentro de la red Docker, así que NO se necesita un bloque /api/ aquí.
    location / {
        proxy_pass         http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activar el sitio
ln -s /etc/nginx/sites-available/pensum-cloud /etc/nginx/sites-enabled/
nginx -t          # verificar sintaxis
systemctl reload nginx
```

### Obtener certificado SSL

```bash
# Sustituye con tu dominio real
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Certbot modifica el archivo de Nginx automáticamente para agregar el bloque `443` con SSL y la redirección `80 → 443`.

### Renovación automática

```bash
# Verificar que el timer de renovación está activo
systemctl status certbot.timer

# Probar la renovación en modo simulado
certbot renew --dry-run
```

---

## 9. Configurar CI/CD con GitHub Actions

El pipeline tiene tres etapas:

```
Push a main
    │
    ├── 1. CI (ci.yml)      — lint + tests
    │
    ├── 2. Build (build.yml) — construye imágenes Docker → las sube a GHCR
    │
    └── 3. Deploy (deploy.yml) — SSH al VPS → pull imágenes → reinicia containers
```

### 9.1 Configurar GitHub Secrets

Ve a `Repositorio → Settings → Secrets and variables → Actions → New repository secret`:

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | IP pública del VPS (ej. `203.0.113.10`) |
| `VPS_USER` | Usuario SSH (ej. `deploy`) |
| `VPS_SSH_KEY` | Contenido completo de `~/.ssh/pensum_deploy` (la clave **privada**) |
| `VPS_PORT` | Puerto SSH del VPS (generalmente `22`) |
| `VPS_DEPLOY_PATH` | Ruta en el VPS (ej. `/opt/pensum-cloud`) |

Para copiar la clave privada:
```bash
cat ~/.ssh/pensum_deploy
# Copia todo el contenido incluyendo -----BEGIN y -----END-----
```

### 9.2 Crear el workflow de deploy

Crea el archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  workflow_run:
    workflows: ["Build & Push Docker Images"]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    # Solo despliega si el build anterior fue exitoso
    if: ${{ github.event.workflow_run.conclusion == 'success' }}

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            set -e
            cd ${{ secrets.VPS_DEPLOY_PATH }}

            # Actualizar el código fuente
            git pull origin main

            # Iniciar sesión en GitHub Container Registry
            echo "${{ secrets.GITHUB_TOKEN }}" \
              | docker login ghcr.io -u ${{ github.actor }} --password-stdin

            # Descargar las nuevas imágenes
            docker pull ghcr.io/${{ github.repository_owner }}/pensum-cloud-backend:main
            docker pull ghcr.io/${{ github.repository_owner }}/pensum-cloud-frontend:main

            # Reiniciar los servicios con las nuevas imágenes
            cd infrastructure
            docker compose \
              -f docker-compose.yml \
              -f docker-compose.prod.yml \
              --env-file .env \
              up -d --no-build

            # Las migraciones corren automáticamente al iniciar el container
            # (el CMD del Dockerfile ejecuta prisma migrate deploy antes de node dist/main)

            # Limpiar imágenes antiguas
            docker image prune -f

            echo "✅ Deploy completado: $(date)"
```

> **Nota sobre `GITHUB_TOKEN`:** Este token es generado automáticamente por GitHub Actions para el workflow de build. Sin embargo, el workflow de deploy se dispara por `workflow_run`, por lo que no tiene acceso directo a ese token. Una alternativa más robusta es usar un **Personal Access Token (PAT)** o configurar el VPS para que haga login en GHCR con un token guardado en el servidor.

### 9.3 Alternativa: login a GHCR preconfigurado en el VPS

Para evitar pasar el token por SSH, configura el login en el VPS una sola vez:

```bash
# En el VPS — crear un PAT en GitHub con permiso read:packages
# GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
# Permiso: Packages → Read

echo "TU_PAT_TOKEN" | docker login ghcr.io -u TU_USUARIO_GITHUB --password-stdin
```

Luego en el `deploy.yml` elimina el paso de login y simplifica el script:

```yaml
script: |
  set -e
  cd ${{ secrets.VPS_DEPLOY_PATH }}
  git pull origin main
  docker pull ghcr.io/${{ github.repository_owner }}/pensum-cloud-backend:main
  docker pull ghcr.io/${{ github.repository_owner }}/pensum-cloud-frontend:main
  cd infrastructure
  docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --no-build
  # Las migraciones corren automáticamente al iniciar el container
  docker image prune -f
  echo "✅ Deploy completado: $(date)"
```

### 9.4 Usar imágenes preconstruidas en lugar de build local

Para que el `docker-compose.prod.yml` use las imágenes de GHCR en vez de hacer `build:`, crea un override adicional `infrastructure/docker-compose.ghcr.yml`:

```yaml
# infrastructure/docker-compose.ghcr.yml
# Sustituye el build local por imágenes preconstruidas de GHCR
services:
  backend:
    image: ghcr.io/<TU_ORG>/pensum-cloud-backend:main
    build: !reset null

  frontend:
    image: ghcr.io/<TU_ORG>/pensum-cloud-frontend:main
    build: !reset null
```

Y en el script del deploy:
```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.ghcr.yml \
  --env-file .env \
  up -d
```

---

## 10. Verificar el pipeline completo

### Flujo esperado al hacer push a `main`

```
git push origin main
       │
       ▼
[GitHub Actions]
  1. CI (ci.yml)
     ✅ lint backend
     ✅ lint frontend
     ✅ tests (con postgres efímero)
       │
       ▼
  2. Build (build.yml)  ← se dispara en push a main
     ✅ build imagen backend → ghcr.io/…/pensum-cloud-backend:main
     ✅ build imagen frontend → ghcr.io/…/pensum-cloud-frontend:main
       │
       ▼
  3. Deploy (deploy.yml)  ← se dispara cuando build termina
     ✅ SSH al VPS
     ✅ git pull
     ✅ docker pull (imágenes nuevas)
     ✅ docker compose up -d
     ✅ prisma migrate deploy
     ✅ limpieza de imágenes viejas
```

### Verificar en GitHub

- `Repositorio → Actions` → ver que los 3 workflows corren en orden
- Cada workflow muestra logs detallados de cada step

### Verificar en el VPS tras el primer deploy automático

```bash
ssh deploy@<IP_DEL_VPS>
cd /opt/pensum-cloud/infrastructure

# Estado de los containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Logs del backend
docker logs pensum_backend --tail 50

# Confirmar que la app responde
curl -s http://localhost:3001/api/v1 | head -c 100
```

---

## 11. Operaciones de mantenimiento

### Ver logs en tiempo real

```bash
cd /opt/pensum-cloud/infrastructure

# Todos los servicios
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Solo backend
docker logs -f pensum_backend

# Solo frontend
docker logs -f pensum_frontend
```

### Actualizar manualmente (sin CI/CD)

```bash
cd /opt/pensum-cloud
git pull origin main

cd infrastructure
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  --env-file .env \
  up -d --build

# Las migraciones corren automáticamente al iniciar el container backend
docker image prune -f
```

### Rollback a una versión anterior

Las imágenes en GHCR se etiquetan por commit SHA (`sha-xxxxxxx`). Para hacer rollback:

```bash
# En el VPS — editar infrastructure/.env o usar variable temporal
BACKEND_TAG=sha-abc1234
FRONTEND_TAG=sha-abc1234

docker pull ghcr.io/<TU_ORG>/pensum-cloud-backend:$BACKEND_TAG
docker pull ghcr.io/<TU_ORG>/pensum-cloud-frontend:$FRONTEND_TAG

# Editar docker-compose.ghcr.yml para apuntar al tag deseado, luego:
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ghcr.yml up -d
```

### Backup de la base de datos

```bash
# Crear dump
docker exec pensum_postgres pg_dump \
  -U postgres \
  -d pensum_cloud \
  -Fc \
  > /opt/backups/pensum_$(date +%Y%m%d_%H%M%S).dump

# Restaurar desde dump
docker exec -i pensum_postgres pg_restore \
  -U postgres \
  -d pensum_cloud \
  --clean \
  < /opt/backups/pensum_YYYYMMDD_HHMMSS.dump
```

Script de backup automático con cron:

```bash
# Crear directorio de backups
mkdir -p /opt/backups

# Agregar al crontab del usuario deploy
crontab -e
```

```cron
# Backup diario a las 3 AM, mantener últimos 7 días
0 3 * * * docker exec pensum_postgres pg_dump -U postgres -d pensum_cloud -Fc > /opt/backups/pensum_$(date +\%Y\%m\%d).dump && find /opt/backups -name "*.dump" -mtime +7 -delete
```

### Reiniciar un servicio sin downtime

```bash
cd /opt/pensum-cloud/infrastructure

# Solo reinicia el backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend

# Detener todo y volver a levantar
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Monitorear uso de recursos

```bash
# Uso de CPU/RAM por container
docker stats

# Espacio en disco usado por Docker
docker system df

# Limpiar recursos no usados (imágenes, redes, volumes huérfanos)
docker system prune -f
```

### Verificar que el deploy funcionó correctamente

```bash
# 1. Containers en estado "Running" (no "Restarting")
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 2. Logs del backend: migraciones aplicadas + app arrancada
docker logs pensum_backend --tail 30

# 3. API responde
curl -s http://localhost:3001/api/v1/

# 4. Frontend devuelve 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/

# 5. Tablas de DB creadas correctamente
docker exec pensum_postgres psql -U postgres -d pensum_cloud -c "\dt" | head -20
```

---

## 12. Troubleshooting

### Backend en estado "Restarting" al primer deploy

**Causa:** Las migraciones de Prisma no se aplicaron antes de que la app intentara conectarse a la DB.

**Fix:** El `CMD` del Dockerfile ya corre `prisma migrate deploy` antes de `node dist/main`. Si el container sigue reiniciando, revisar los logs:
```bash
docker logs pensum_backend --tail 50
```

### `Error: Could not parse schema engine response` / Prisma + Alpine

**Causa:** `node:20-alpine` usa musl libc + OpenSSL 3.x, pero Prisma no detecta la versión automáticamente y usa un binario incompatible.

**Fix aplicado en el código:**
1. `apps/backend/prisma/schema.prisma` — `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`
2. `apps/backend/Dockerfile` — `RUN apk add --no-cache openssl` en los stages `base` y `production`

Después de aplicar estos cambios, reconstruir la imagen:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend
```

### `git pull` falla: `Permission denied (publickey)`

El VPS no tiene una SSH key autorizada en GitHub. Ver sección 4 para configurar una deploy key.

Alternativa rápida: copiar los archivos modificados via `scp` desde la máquina local:
```bash
scp apps/backend/Dockerfile root@<IP_VPS>:/opt/pensum-cloud/apps/backend/Dockerfile
scp apps/backend/prisma/schema.prisma root@<IP_VPS>:/opt/pensum-cloud/apps/backend/prisma/schema.prisma
```

---

## Resumen de comandos clave

| Acción | Comando |
|--------|---------|
| Levantar en producción | `docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d` |
| Ver estado | `docker compose … ps` |
| Ver logs | `docker compose … logs -f [servicio]` |
| Migraciones | Automáticas al iniciar el container (ver logs: `docker logs pensum_backend`) |
| Seed | `docker exec pensum_backend node apps/backend/dist/prisma/seed.js` |
| Apagar todo | `docker compose … down` |
| Limpiar imágenes viejas | `docker image prune -f` |
| Backup DB | `docker exec pensum_postgres pg_dump -U postgres -d pensum_cloud -Fc > backup.dump` |
