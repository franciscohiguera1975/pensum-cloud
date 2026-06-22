# Changelog

All notable changes will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [SemVer](https://semver.org/)

---

## [Unreleased]

---

## [0.16.0] — 2026-06-13

### Added — Seeders: Pensum Desarrollo de Software (V1 y V2)
- Nuevos datos de seed en `apps/backend/prisma/seed.ts`
- Facultad: `Facultad de Tecnología e Innovación` (código `FTI`) bajo `Demo University`
- Carrera: `Ingeniería en Desarrollo de Software` (código `DS`)
- **Curriculum V1 (Pensum 2024-1 — Verde)**:
  - 4 semestres × 6 materias = 24 materias en total
  - Materias: Matemáticas, Estadística I, Programación I, Sistemas Operativos, TIC, Contabilidad, Base de Datos I, Estadística II (BI y Big Data), Programación II, Metodología Dev SW, Redes, Arquitectura de Computadores, Base de Datos II, UX/UI, Programación III, Calidad de Software, Seguridad Informática I, Proyectos de Investigación, ML, IA, Programación IV, Gestión de Proyectos, Seguridad Informática II, Seminario de Integración
  - 5 prerrequisitos: PRG-201→PRG-101, BDII-301→BDI-201, PRG-301→PRG-201, PRG-401→PRG-301, SEII-401→SEI-301
- **Curriculum V2 (Pensum 2024-2 — Cyan)**:
  - 4 semestres × 6 materias = 24 materias en total
  - Materias: Matemática para DS, Base de Datos I, Fundamentos de Programación, Sistemas Operativos, Tecnología Aplicada, Gestión Organizacional, Desarrollo Web, Base de Datos II, Frameworks Backend, Infraestructura y Redes, Testing de Software, Analítica Predictiva, Frameworks Frontend, Fundamentos IA, Ecosistemas Corporativos, Modelado y Diseño SW, Seguridad Informática, DevOps y Cloud, Diseño y Gestión de Proyectos, Machine Learning, Desarrollo Móvil, Desarrollo Asistido por IA, Arquitectura de Software, Seminario de Integración
  - 6 prerrequisitos: DWE-201→FPR-101, BDII-201→BDI-101, FBK-201→FPR-101, FFR-301→DWE-201, DMV-401→FBK-201, DAI-401→FIA-301
- Créditos calculados como `(horasClaseDirecta + horasPráctica) / 16`
- Seed idempotente: usa `upsert` en todos los registros (seguro de ejecutar múltiples veces)

---

## [0.15.0] — 2026-06-13

### Added — EPIC 15: Kubernetes Manifests
- `infrastructure/k8s/namespace.yaml` — `pensum-cloud` namespace
- `infrastructure/k8s/configmap.yaml` — env config for backend + frontend
- `infrastructure/k8s/secret.yaml` — DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, POSTGRES credentials (base64, replace before deploy)
- `infrastructure/k8s/postgres/` — PersistentVolumeClaim (10Gi), Deployment (postgres:18-alpine, liveness/readiness probes, strategy=Recreate), ClusterIP Service
- `infrastructure/k8s/backend/` — Deployment (2 replicas, RollingUpdate, initContainer for `prisma migrate deploy`, liveness/readiness probes), ClusterIP Service
- `infrastructure/k8s/frontend/` — Deployment (2 replicas, RollingUpdate, liveness/readiness probes), ClusterIP Service
- `infrastructure/k8s/ingress.yaml` — nginx Ingress routing `/api` → backend, `/` → frontend; TLS-ready (cert-manager annotations commented)
- `infrastructure/k8s/kustomization.yaml` — Kustomize entrypoint listing all resources

---

## [0.14.0] — 2026-06-13

### Added — EPIC 14: Curriculum Audit
- `CurriculumCompareResponseDto`, `CurriculumRedundanciesResponseDto`, `SubjectDiffDto`, `RedundancyGroupDto` DTOs
- `ICurriculumAuditRepository` (`CURRICULUM_AUDIT_REPOSITORY` symbol) — `loadSubjectsWithCompetencies`
- `CompareCurriculaUseCase` — diffs two curricula by subject code (ADDED/REMOVED/MODIFIED/UNCHANGED), detects field-level changes (name, credits, semesterNumber)
- `FindRedundanciesUseCase` — detects subjects sharing identical competency sets (SAME_COMPETENCIES)
- `PrismaCurriculumAuditRepository` — single nested Prisma query loading subjects with competency pivot
- `GET /curricula/:id/compare?with=:otherId` — compare endpoint
- `GET /curricula/:id/redundancies` — redundancy detection endpoint
- `CurriculumModule` updated with audit repository + use cases
- Tests: `curriculum-audit.use-cases.spec.ts` — 12 cases (compare: 7, redundancies: 5)

---

## [0.13.0] — 2026-06-13

### Added — EPIC 13: Academic Path Simulation
- `CurriculumPathResponseDto`, `SubjectPathDto` DTOs
- `ICurriculumPathRepository` (`CURRICULUM_PATH_REPOSITORY` symbol) — `loadSubjectGraph`
- `GetCurriculumPathUseCase` — classifies each subject as COMPLETED / AVAILABLE / LOCKED based on `completedIds`; pure in-memory graph traversal (O(n), Set lookups)
- `PrismaCurriculumPathRepository` — single nested Prisma query (semesters → subjects → prerequisites)
- `GET /curricula/:id/path?completed[]=subjectId` — path simulation endpoint
- `CurriculumModule` updated with path repository + use case
- Tests: `curriculum-path.use-case.spec.ts` — 9 cases

---

## [0.12.0] — 2026-06-13

### Fixed — EPIC 10 controller bugs
- Corrected `JwtAuthGuard` import path in EPIC 10 controllers (was `@modules/auth/infrastructure/...`, now relative `../../../auth/presentation/guards/...`)
- Replaced non-existent `@TenantId()` decorator with `@Req() req: Request` + `req.tenantId!`
- Removed non-existent `SharedModule` import from `CompetencyModule` and `LearningOutcomeModule`

### Added — EPIC 11: User Management
- `User` entity extended with `create()`, `update()`, `deactivate()`, `softDelete()`
- `IUserRepository` extended with `findAll`, `existsByEmail`, `save`, `update`, `delete`
- Use cases: CreateUser (bcrypt + email dedup), GetUser, ListUsers, UpdateUser, DeactivateUser, DeleteUser
- `UsersController` at `/users` (CRUD + `PATCH /:id/deactivate`)
- Tests: `user.use-cases.spec.ts` — 12 cases

### Added — EPIC 12: GitHub Actions CI/CD
- `.github/workflows/ci.yml` — lint + test on PR/push (postgres service, prisma migrate)
- `.github/workflows/build.yml` — Docker build + push to GHCR on main/tags (backend + frontend)

---

## [0.10.0] — 2026-06-13

### Added — EPIC 10: Competencies & Learning Outcomes

#### CompetencyModule (`apps/backend/src/modules/competency/`)
- `Competency` entity: `create()`, `update()`, `softDelete()` — code auto-uppercased
- `ICompetencyRepository` (COMPETENCY_REPOSITORY symbol) + `PrismaCompetencyRepository`
- `ISubjectCompetencyRepository` (SUBJECT_COMPETENCY_REPOSITORY) + `PrismaSubjectCompetencyRepository`
- Use cases: Create (duplicate code check), Get, List, Update, Delete
- Use cases: AddCompetencyToSubject, RemoveCompetencyFromSubject, ListSubjectCompetencies
- `CompetenciesController`: full CRUD at `/competencies`
- `SubjectCompetenciesController`: link/unlink/list at `/subjects/:subjectId/competencies`

#### LearningOutcomeModule (`apps/backend/src/modules/learning-outcome/`)
- `LearningOutcome` entity: linked to optional `subjectId` and/or `competencyId`
- `ILearningOutcomeRepository` + `PrismaLearningOutcomeRepository`
- Use cases: Create, Get, ListBySubject, ListByCompetency, Update, Delete
- `LearningOutcomesController`: CRUD at `/learning-outcomes`
- `NestedLearningOutcomesController`: list at `/subjects/:id/learning-outcomes` and `/competencies/:id/learning-outcomes`

#### Tests
- `competency.use-cases.spec.ts` — 13 cases
- `learning-outcome.use-cases.spec.ts` — 10 cases

---

## [0.9.0] — 2026-06-13

### Added — DevOps / Infrastructure

- `turbo.json` — pipeline tasks: `build`, `dev` (persistent), `test`, `lint`, `clean`
- `apps/frontend/Dockerfile` — 3-stage build (deps → builder → nginx:alpine)
- `apps/frontend/nginx.conf` — SPA fallback, `/api/` reverse proxy → backend, gzip, static cache
- `infrastructure/docker-compose.yml` — `frontend` service (profile: `app`, port 5173:80)
- `scripts/setup.sh` — full env setup (install, .env copy, postgres start, prisma generate/migrate/seed)
- `scripts/dev.sh` — starts postgres + turbo dev in parallel
- `scripts/build.sh` — runs turbo build
- Root `package.json` — added `setup`, `test:frontend`, `docker:dev`, `docker:app`, `docker:down` scripts

---

## [0.8.0] — 2026-06-12

### Added — EPIC 7 + EPIC 8: Frontend React Flow + Three.js

#### Frontend Setup (`apps/frontend/`)
- `package.json` con React 18, Vite 5, TypeScript strict, Vitest
- `vite.config.ts` — proxy `/api` → `http://localhost:3000`, path alias `@/`
- `tailwind.config.ts` + CSS variables para tema ShadCN-compatible
- `index.html`, `main.tsx`, `App.tsx`

#### Shared Infrastructure (`src/shared/`)
- `apiClient` (axios) — interceptors: Bearer token + `X-Tenant-ID` header automático, refresh token 401 handler
- `queryClient` — React Query v5, staleTime 5 min
- `useAuthStore` (Zustand + persist) — login/logout, access+refresh tokens
- `useTenantStore` (Zustand + persist) — tenantId
- Tipos: `CurriculumResponse`, `SemesterResponse`, `SubjectResponse`, `PrerequisiteResponse`, `AuthTokens`

#### Auth Module (`modules/auth/`)
- `authApi` — login, refresh
- `LoginPage` — formulario con Zod + React Hook Form, campo Tenant ID, email, password
- `ProtectedRoute` — redirect a `/login` si no autenticado

#### Pensum Page (`modules/dashboard/`)
- `PensumPage` — switch 2D/3D en topbar, logout, configurable via `VITE_DEMO_CURRICULUM_ID`

#### EPIC 7: React Flow Editor (`modules/reactflow-editor/`)
- `buildFlowGraph(semesters, subjects, prerequisites)` — genera nodes + edges para `@xyflow/react`
  - Header nodes por semestre (tipo `semesterHeader`)
  - Subject nodes con posición por columna/fila (tipo `subject`)
  - Prerequisite edges (`smoothstep`, animados, color indigo)
- `SubjectNode` — nodo custom: código, nombre, créditos, horas, color por semestre
- `SemesterHeaderNode` — cabecera de columna oscura
- `usePensumFlow(curriculumId)` — carga paralela: semesters → subjects → prerequisites (deduplicados)
- `PensumFlowEditor` — ReactFlow con Background, Controls, MiniMap

#### EPIC 8: Three.js Viewer (`modules/threejs-viewer/`)
- `buildScene(semesters, subjects, prerequisites)` — posiciona subjects en 3D (x=semestre, y=fila centrada)
  - Colores únicos por semestre, radio de esfera proporcional a créditos
- `SubjectSphere` — esfera R3F con hover state (emissive), etiqueta de código `<Text>`
- `PrerequisiteEdge3D` — `THREE.BufferGeometry` line entre dos posiciones
- `useViewerScene(curriculumId)` — reutiliza `usePensumFlow`
- `PensumViewer3D` — Canvas R3F: `OrbitControls`, `Environment city`, `Grid`, tooltip HTML overlay al hover

#### Tests (`tests/frontend/utils/`)
- `buildFlowGraph.spec.ts` — 5 casos (nodos, aristas, orden, posición)
- `buildScene.spec.ts` — 5 casos (nodos, aristas, posición 3D, colores)

---

## [0.6.0] — 2026-06-12

### Added — EPIC 6: Pensum (Curricula)

#### CurriculumModule (`modules/curriculum/`)
- `Curriculum` entity: `create()` (status DRAFT), `activate()`, `archive()` con guards de estado, `softDelete()`, `update(name, description)`
- `ICurriculumRepository` + `PrismaCurriculumRepository` (filtra `careerId + tenantId + deletedAt`) + `CurriculumMapper`
- 7 use cases: Create (verifica version única por career), Get, ListByCareer, Update, Activate, Archive, Delete
- `CurriculaController`: rutas mixtas — `POST|GET /careers/:careerId/curricula`, `GET|PUT|DELETE|PATCH /curricula/:id`, `PATCH /curricula/:id/activate`, `PATCH /curricula/:id/archive`
- `CurriculumModule` registrado en `AppModule`

#### SemesterModule (`modules/semester/`)
- `Semester` entity: `create()`, `update(name)`, `softDelete()`
- `ISemesterRepository` + `PrismaSemesterRepository` (filtra `curriculumId + tenantId + deletedAt`) + `SemesterMapper`
- 5 use cases: Create (verifica number único por curriculum), Get, ListByCurriculum, Update, Delete
- `SemestersController`: `POST|GET /curricula/:curriculumId/semesters`, `GET|PUT|DELETE /semesters/:id`
- `SemesterModule` registrado en `AppModule`

#### SubjectModule (`modules/subject/`)
- `Subject` entity: `create()` (uppercase code, trim), `update()` (name, credits, hours, description), `softDelete()`
- `ISubjectRepository` + `PrismaSubjectRepository` (filtra `semesterId + tenantId + deletedAt`) + `SubjectMapper`
- 5 use cases: Create (verifica code único por semester), Get, ListBySemester, Update, Delete
- `SubjectsController`: `POST|GET /semesters/:semesterId/subjects`, `GET|PUT|DELETE /subjects/:id`
- `SubjectModule` registrado en `AppModule`

#### PrerequisiteModule (`modules/prerequisite/`)
- `Prerequisite` entity: `create()` (valida subjectId ≠ requiresId), `reconstitute()`
- `IPrerequisiteRepository` + `PrismaPrerequisiteRepository` (composite PK `subjectId_requiresId`) + `PrerequisiteMapper`
- 3 use cases: Add (verifica duplicados), Remove (verifica existencia), List
- `PrerequisitesController`: `POST|GET|DELETE /:requiresId` en `/subjects/:subjectId/prerequisites`
- `PrerequisiteModule` registrado en `AppModule`

#### Tests (`tests/backend/modules/`)
- `curriculum/curriculum.use-cases.spec.ts` — 14 casos (7 use cases + 6 entity rules)
- `semester/semester.use-cases.spec.ts` — 9 casos (5 use cases + entity rules)
- `subject/subject.use-cases.spec.ts` — 10 casos (5 use cases + entity rules)
- `prerequisite/prerequisite.use-cases.spec.ts` — 7 casos (3 use cases + entity rules)

---

## [0.5.0] — 2026-06-12

### Added — EPIC 5: Faculty + Career

#### FacultyModule (`modules/faculty/`)
- `Faculty` entity: `create()` (uppercase code), `update(name)`, `softDelete()`
- `IFacultyRepository` + `PrismaFacultyRepository` (filtra `universityId + tenantId + deletedAt`)
- 5 use cases: Create (verifica code único por university), Get, ListByUniversity, Update, Delete
- `FacultiesController`: rutas anidadas `POST|GET|GET/:id|PUT/:id|DELETE/:id /universities/:universityId/faculties`
- `FacultyModule` exporta use cases y token de repositorio

#### CareerModule (`modules/career/`)
- `Career` entity: `create()` (uppercase code), `update(name, description)`, `softDelete()`
- `ICareerRepository` + `PrismaCareerRepository` (filtra `facultyId + tenantId + deletedAt`)
- 5 use cases: Create (verifica code único por faculty), Get, ListByFaculty, Update, Delete
- `CareersController`: rutas anidadas `POST|GET|GET/:id|PUT/:id|DELETE/:id /faculties/:facultyId/careers`
- `CareerModule` exporta use cases y token de repositorio

#### AppModule
- Registra `FacultyModule` y `CareerModule`

#### Tests
- `faculty.use-cases.spec.ts` — 10 casos
- `career.use-cases.spec.ts` — 12 casos (use cases + entity rules)

---

## [0.4.0] — 2026-06-12

### Added — EPIC 4: Universities

#### Domain (`modules/university/domain/`)
- `University` entity: `create()` (uppercases code, trim), `update()` (name, country, website), `softDelete()` (idempotency guard)
- `IUniversityRepository` con token `UNIVERSITY_REPOSITORY` y `existsByCode(code, tenantId, excludeId?)`

#### Application (`modules/university/application/`)
- `CreateUniversityUseCase` — verifica code único por tenant antes de persistir
- `GetUniversityUseCase`, `ListUniversitiesUseCase`, `UpdateUniversityUseCase`, `DeleteUniversityUseCase`
- `CreateUniversityDto`, `UpdateUniversityDto` (todos los campos opcionales), `UniversityResponseDto`

#### Infrastructure
- `UniversityMapper` — bidireccional dominio ↔ Prisma
- `PrismaUniversityRepository` — filtra `tenantId` + `deletedAt: null`; `existsByCode` soporta `excludeId`

#### Presentation
- `UniversitiesController`: `POST /universities`, `GET /universities`, `GET /universities/:id`, `PUT /universities/:id`, `DELETE /universities/:id` (204)
- Protegido con `JwtAuthGuard`; `tenantId` desde `TenantMiddleware`
- `UniversityModule` registrado en `AppModule`

#### Tests
- `university.entity.spec.ts` — 9 casos
- `create-university.use-case.spec.ts` — 2 casos
- `get-update-delete.use-cases.spec.ts` — 7 casos

---

## [0.3.0] — 2026-06-12

### Added — EPIC 3: Auth

#### Dependencies
- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`

#### User Domain (auth dependency — `modules/user/`)
- `User` entity con `reconstitute()`, getters (id, tenantId, email, password, fullName, roles)
- `IUserRepository` con token `USER_REPOSITORY`
- `PrismaUserRepository` — queries filtran por `tenantId`, `isActive`, `deletedAt`
- `UserMapper` — incluye roles via `Prisma.UserGetPayload`
- `UserModule` — exporta `USER_REPOSITORY`

#### Auth Domain (`modules/auth/domain/`)
- `IPasswordService` + token `PASSWORD_SERVICE`
- `IAuthTokenService` + token `AUTH_TOKEN_SERVICE` — tipos `JwtPayload`, `AuthTokens`

#### Auth Application (`modules/auth/application/`)
- `LoginUseCase` — busca user por email+tenant, verifica bcrypt, emite access+refresh token
- `RefreshTokenUseCase` — verifica refresh token, valida existencia del user, emite nuevo access token
- `LoginDto`, `RefreshTokenDto`, `AuthResponseDto`, `AuthUserDto`

#### Auth Infrastructure (`modules/auth/infrastructure/`)
- `BcryptPasswordService` — 12 rondas de salt
- `JwtTokenService` — `generateTokens()` (access + refresh con secrets separados), `verifyRefreshToken()`
- `JwtStrategy` — Passport strategy `'jwt'`, valida payload

#### Auth Presentation (`modules/auth/presentation/`)
- `AuthController`:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
- `JwtAuthGuard` — extiende `AuthGuard('jwt')`, listo para usar en cualquier endpoint protegido
- `@CurrentUser()` — param decorator que extrae `JwtPayload` del request

#### Shared Middleware
- `TenantMiddleware` — lee header `X-Tenant-ID`, adjunta `req.tenantId`; excluye rutas `/auth/*`
- `AppModule` — implementa `NestModule`, aplica `TenantMiddleware` globalmente

#### Configuration
- `.env.example` — agrega `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION`, ajusta expiración a `15m`

#### Tests (`tests/backend/modules/auth/`)
- `login.use-case.spec.ts` — 3 casos (credenciales válidas, user no existe, password incorrecto)
- `refresh-token.use-case.spec.ts` — 3 casos (token válido, token inválido, user no existe)
- `bcrypt-password.service.spec.ts` — 3 casos (hash, compare correcto, compare incorrecto)

---

## [0.2.0] — 2026-06-12

### Added — EPIC 2: Tenant Management

#### Domain Layer (`modules/tenant/domain/`)
- `TenantId` — Value Object con generación UUID, validación de vacío y comparación por valor
- `TenantSlug` — Value Object con normalización automática (lowercase, trim, sanitize), validación de longitud (3–63 chars)
- `Tenant` — Entidad con reglas de negocio: `create()`, `reconstitute()`, `deactivate()`, `activate()`
- `ITenantRepository` — Interfaz de repositorio con token `TENANT_REPOSITORY` para inyección de dependencias

#### Application Layer (`modules/tenant/application/`)
- `CreateTenantUseCase` — verifica slug único antes de persistir; lanza `ConflictException` si ya existe
- `GetTenantBySlugUseCase` — lanza `NotFoundException` si no existe
- `ListTenantsUseCase` — soporta filtro `onlyActive` (default `true`)
- `DeactivateTenantUseCase` — aplica regla de dominio antes de persistir; lanza `NotFoundException`
- `CreateTenantDto` — validado con `class-validator` (IsString, IsNotEmpty, MinLength, MaxLength)
- `TenantResponseDto` — con método estático `fromDomain(tenant)` para mapeo limpio

#### Infrastructure Layer (`modules/tenant/infrastructure/`)
- `TenantMapper` — convierte entre dominio y Prisma en ambas direcciones
- `PrismaTenantRepository` — implementa `ITenantRepository` sobre `PrismaService`; todas las queries filtran por `deletedAt: null`

#### Presentation Layer (`modules/tenant/presentation/`)
- `TenantsController`:
  - `POST /api/v1/tenants` — crea tenant
  - `GET /api/v1/tenants?onlyActive=true` — lista tenants
  - `GET /api/v1/tenants/:slug` — busca por slug
  - `PATCH /api/v1/tenants/:id/deactivate` — desactiva tenant
- Decoradores Swagger en todos los endpoints (ApiOperation, ApiResponse, ApiParam, ApiQuery)
- `TenantModule` — registra use cases, repositorio (via token DI) y controller

#### Wiring
- `AppModule` — incorpora `TenantModule`
- `package.json` (jest) — agrega `moduleNameMapper` para path aliases `@shared/*`, `@modules/*`

#### Tests (`tests/backend/modules/tenant/`)
- `domain/value-objects/tenant-slug.value-object.spec.ts` — 8 casos (normalización, errores de validación, igualdad)
- `domain/entities/tenant.entity.spec.ts` — 7 casos (create, deactivate, activate, validaciones)
- `application/use-cases/create-tenant.use-case.spec.ts` — 2 casos
- `application/use-cases/get-tenant-by-slug.use-case.spec.ts` — 2 casos
- `application/use-cases/list-tenants.use-case.spec.ts` — 3 casos
- `application/use-cases/deactivate-tenant.use-case.spec.ts` — 3 casos

### Changed
- `infrastructure/docker-compose.yml` — PostgreSQL actualizado de 16-alpine a 18-alpine

---

## [0.1.0] — 2026-06-12

### Added — EPIC 1: Monorepo, Docker, PostgreSQL

#### Monorepo
- Root `package.json` with Yarn workspaces and Turbo
- `apps/backend` workspace with NestJS 10 + Prisma 5 + TypeScript 5

#### Backend Configuration
- `apps/backend/package.json` — dependencias de producción y desarrollo
- `apps/backend/tsconfig.json` — strict mode, path aliases `@shared/*`, `@modules/*`
- `apps/backend/tsconfig.build.json` — config de compilación para producción
- `apps/backend/nest-cli.json` — configuración de NestJS CLI
- `apps/backend/.env.example` — variables de entorno documentadas

#### Database — Prisma Schema
- Schema completo con todos los modelos del dominio:
  - `Tenant`, `University`, `Faculty`, `Career`
  - `Curriculum` (con enum `CurriculumStatus`: DRAFT / ACTIVE / ARCHIVED)
  - `Semester`, `Subject`, `Prerequisite`
  - `Competency`, `SubjectCompetency` (pivot), `LearningOutcome`
  - `User`, `Role`, `UserRole` (pivot)
- Convenciones: UUID PKs, `snake_case` columns, soft-delete (`deleted_at`), `tenant_id` en todas las tablas
- Índices en `tenant_id` para consultas multi-tenant eficientes
- `prisma/seed.ts` — seed inicial con Roles, Tenant, University, Faculty y Career de demo

#### Shared Infrastructure
- `PrismaService` — extiende `PrismaClient`, implementa `OnModuleInit`/`OnModuleDestroy`
- `PrismaModule` — módulo `@Global()` que exporta `PrismaService`
- `AppConfigService` — configuración centralizada vía `@nestjs/config`

#### NestJS Bootstrap
- `main.ts` — arranque con: prefijo global `api/v1`, `ValidationPipe` (whitelist + transform), CORS, Swagger/OpenAPI
- `AppModule` — importa `ConfigModule` (global) y `PrismaModule`
- Swagger UI disponible en `/docs` (solo en entornos no-productivos)

#### Docker
- `infrastructure/docker-compose.yml`:
  - Servicio `postgres` (PostgreSQL 16-alpine) con healthcheck
  - Servicio `pgadmin` (PgAdmin 4) con perfil `dev`
  - Servicio `backend` con recarga en caliente (perfil `app`)
  - Red `pensum_network`, volumen persistente `postgres_data`
- `infrastructure/.env.example` — variables de entorno de infraestructura
- `apps/backend/Dockerfile` — multi-stage build (deps → development → builder → production)

#### Tests
- `tests/backend/shared/infrastructure/database/prisma.service.spec.ts` — tests unitarios de `PrismaService`
- `tests/backend/shared/infrastructure/database/prisma.module.spec.ts` — tests de `PrismaModule`
- `apps/backend/jest.e2e.config.js` — configuración de tests e2e

#### Documentation
- `docs/09-roadmap.md` — EPIC 1 marcado como completado, desglose de EPICs 2–8
- `docs/08-api-contracts.md` — contratos de API documentados para todos los EPICs planificados
- `CHANGELOG.md` — este archivo
