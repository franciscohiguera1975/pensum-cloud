# Roadmap

## EPIC 1 — Monorepo, Docker, PostgreSQL ✅

- [x] Monorepo (`package.json` workspaces, Turbo)
- [x] Docker (`infrastructure/docker-compose.yml` con PostgreSQL + PgAdmin + Backend)
- [x] PostgreSQL — Prisma schema completo (todos los modelos del dominio)
- [x] `PrismaService` + `PrismaModule` (shared/infrastructure/database)
- [x] NestJS bootstrap (`main.ts`, `AppModule`, Swagger, ValidationPipe, CORS)
- [x] Seed inicial (Roles, Tenant, University, Faculty, Career demo)
- [x] Tests unitarios para `PrismaService` y `PrismaModule`

## EPIC 2 — Tenant Management ✅

- [x] Dominio: entidad `Tenant` con Value Objects (`TenantSlug`, `TenantId`)
- [x] Repositorio: `ITenantRepository` + `PrismaTenantRepository` + `TenantMapper`
- [x] Use Cases: `CreateTenantUseCase`, `GetTenantBySlugUseCase`, `ListTenantsUseCase`, `DeactivateTenantUseCase`
- [x] DTOs: `CreateTenantDto`, `TenantResponseDto`
- [x] Controller: `TenantsController` (`POST /tenants`, `GET /tenants`, `GET /tenants/:slug`, `PATCH /tenants/:id/deactivate`) con decoradores Swagger
- [x] `TenantModule` registrado en `AppModule`
- [x] Tests unitarios: 4 use cases + entity + value objects (8 archivos spec)

## EPIC 3 — Auth ✅

- [x] Estrategia JWT con `@nestjs/passport` + `passport-jwt`
- [x] `LoginUseCase` (verifica email, bcrypt compare, emite access + refresh tokens)
- [x] `RefreshTokenUseCase` (verifica refresh token, emite nuevo access token)
- [x] Guard `JwtAuthGuard`, Decorator `@CurrentUser`
- [x] `TenantMiddleware` — resuelve `tenantId` desde header `X-Tenant-ID` (excluye `/auth/*`)
- [x] Interfaces de dominio: `IPasswordService`, `IAuthTokenService`
- [x] `BcryptPasswordService` (12 rondas), `JwtTokenService`
- [x] `JwtStrategy` (Passport), `AuthController` con Swagger
- [x] `UserModule` mínimo con `PrismaUserRepository` (auth dependency)
- [x] Variables: `JWT_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION`
- [x] Tests: `LoginUseCase` (3 casos), `RefreshTokenUseCase` (3 casos), `BcryptPasswordService` (3 casos)

## EPIC 4 — Universities ✅

- [x] Módulo `university` completo (Domain → Application → Infrastructure → Presentation)
- [x] `University` entity: `create()`, `update()`, `softDelete()`, validaciones (code ≤20, name ≤255, uppercase)
- [x] `IUniversityRepository` con `existsByCode(code, tenantId, excludeId?)`
- [x] Use Cases: `CreateUniversityUseCase`, `GetUniversityUseCase`, `ListUniversitiesUseCase`, `UpdateUniversityUseCase`, `DeleteUniversityUseCase`
- [x] DTOs: `CreateUniversityDto`, `UpdateUniversityDto`, `UniversityResponseDto`
- [x] `UniversitiesController` con `JwtAuthGuard` + `tenantId` desde middleware
- [x] Endpoints: `POST`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` (soft-delete 204)
- [x] `UniversityModule` registrado en `AppModule`
- [x] Tests: entity (9 casos) + 5 use cases (9 casos)

## EPIC 5 — Careers ✅

### Faculty (prerequisito de Career)
- [x] `Faculty` entity: `create()`, `update()`, `softDelete()`
- [x] `IFacultyRepository` → `PrismaFacultyRepository`
- [x] Use Cases: Create, Get, ListByUniversity, Update, Delete
- [x] `FacultiesController`: `POST /universities/:universityId/faculties`, `GET`, `GET /:id`, `PUT /:id`, `DELETE /:id`
- [x] `FacultyModule` registrado en `AppModule`
- [x] Tests: 10 casos

### Career
- [x] `Career` entity: `create()`, `update()` (name + description), `softDelete()`
- [x] `ICareerRepository` → `PrismaCareerRepository`
- [x] Use Cases: Create, Get, ListByFaculty, Update, Delete
- [x] `CareersController`: `POST /faculties/:facultyId/careers`, `GET`, `GET /:id`, `PUT /:id`, `DELETE /:id`
- [x] `CareerModule` registrado en `AppModule`
- [x] Tests: 12 casos (use cases + entity)

## EPIC 6 — Pensum (Curricula) ✅

### CurriculumModule
- [x] `Curriculum` entity: `create()` (status DRAFT), `activate()`, `archive()`, `softDelete()`, `update()`
- [x] `ICurriculumRepository` + `PrismaCurriculumRepository` + `CurriculumMapper`
- [x] Use Cases: Create (verifica version única por career), Get, ListByCareer, Update, Activate, Archive, Delete
- [x] `CurriculaController`: `POST /careers/:careerId/curricula`, `GET`, `GET /curricula/:id`, `PUT`, `PATCH /activate`, `PATCH /archive`, `DELETE`
- [x] `CurriculumModule` registrado en `AppModule`

### SemesterModule
- [x] `Semester` entity: `create()`, `update(name)`, `softDelete()`
- [x] `ISemesterRepository` + `PrismaSemesterRepository` + `SemesterMapper`
- [x] Use Cases: Create (verifica number único por curriculum), Get, ListByCurriculum, Update, Delete
- [x] `SemestersController`: `POST /curricula/:curriculumId/semesters`, `GET`, `GET /semesters/:id`, `PUT`, `DELETE`
- [x] `SemesterModule` registrado en `AppModule`

### SubjectModule
- [x] `Subject` entity: `create()` (uppercase code), `update()`, `softDelete()`
- [x] `ISubjectRepository` + `PrismaSubjectRepository` + `SubjectMapper`
- [x] Use Cases: Create (verifica code único por semester), Get, ListBySemester, Update, Delete
- [x] `SubjectsController`: `POST /semesters/:semesterId/subjects`, `GET`, `GET /subjects/:id`, `PUT`, `DELETE`
- [x] `SubjectModule` registrado en `AppModule`

### PrerequisiteModule
- [x] `Prerequisite` entity: `create()` (valida que subjectId ≠ requiresId), `reconstitute()`
- [x] `IPrerequisiteRepository` + `PrismaPrerequisiteRepository` + `PrerequisiteMapper`
- [x] Use Cases: Add (verifica duplicados), Remove (verifica existencia), List
- [x] `PrerequisitesController`: `POST /subjects/:subjectId/prerequisites`, `GET`, `DELETE /:requiresId`
- [x] `PrerequisiteModule` registrado en `AppModule`

### Tests
- [x] `curriculum.use-cases.spec.ts` — 14 casos (use cases + entity rules)
- [x] `semester.use-cases.spec.ts` — 9 casos
- [x] `subject.use-cases.spec.ts` — 10 casos (use cases + entity rules)
- [x] `prerequisite.use-cases.spec.ts` — 7 casos (use cases + entity rules)

## EPIC 7 — React Flow ✅

- [x] Frontend setup: `apps/frontend/` (Vite + React 18 + TypeScript strict)
- [x] Dependencias: `@tanstack/react-query`, `zustand`, `axios`, `react-router-dom`, `react-hook-form` + `zod`
- [x] Shared infrastructure: `apiClient` (axios + interceptors JWT + X-Tenant-ID auto), `queryClient`
- [x] Stores: `useAuthStore` (JWT access+refresh), `useTenantStore` (tenantId)
- [x] API layer: `curriculumApi`, `semesterApi`, `subjectApi`, `prerequisiteApi`, `authApi`
- [x] Login page con validación Zod + React Hook Form
- [x] `ProtectedRoute` — redirect a `/login` si no autenticado
- [x] `PensumPage` — switch 2D / 3D con topbar
- [x] `buildFlowGraph()` — convierte semesters + subjects + prerequisites a nodes/edges de React Flow
- [x] `PensumFlowEditor` — editor interactivo con zoom/pan/minimap, nodos custom `SubjectNode` y `SemesterHeaderNode`
- [x] Tests: `buildFlowGraph.spec.ts` — 5 casos (vitest)

## EPIC 8 — Three.js ✅

- [x] `buildScene()` — posiciona subjects como esferas en 3D por columnas de semestre
- [x] `SubjectSphere` — esfera interactiva con color por semestre, radio proporcional a créditos, hover state
- [x] `PrerequisiteEdge3D` — línea THREE.Line entre subjects con prerrequisito
- [x] `PensumViewer3D` — Canvas R3F con `OrbitControls`, `Environment`, `Grid`, tooltip HTML overlay
- [x] `useViewerScene` — reutiliza datos de `usePensumFlow` para la escena 3D
- [x] Tests: `buildScene.spec.ts` — 5 casos (vitest)

## EPIC 9 — DevOps / Infrastructure ✅

- [x] `turbo.json` — pipeline tasks: `build`, `dev` (persistent), `test`, `lint`, `clean`
- [x] `apps/frontend/Dockerfile` — 3-stage (deps → builder → nginx:alpine)
- [x] `apps/frontend/nginx.conf` — SPA fallback, `/api/` proxy → backend, gzip, cache headers
- [x] `infrastructure/docker-compose.yml` — frontend service (profile: `app`, port 5173:80)
- [x] `scripts/setup.sh` — install, .env copy, postgres start, prisma generate/migrate/seed
- [x] `scripts/dev.sh` — postgres health-check + turbo dev parallel
- [x] `scripts/build.sh` — turbo build
- [x] Root `package.json` — `setup`, `test:frontend`, `docker:dev`, `docker:app`, `docker:down`
- [x] `apps/frontend/.env.example`
- [x] Module index.ts exports for all frontend modules

## EPIC 10 — Competencies & Learning Outcomes ✅

### CompetencyModule
- [x] `Competency` entity: `create()` (uppercase code), `update()`, `softDelete()`
- [x] `ICompetencyRepository` + `PrismaCompetencyRepository` + `CompetencyMapper`
- [x] Use Cases: Create (verifica code único por tenant), Get, List, Update, Delete
- [x] `ISubjectCompetencyRepository` + `PrismaSubjectCompetencyRepository` (pivot)
- [x] Use Cases: AddCompetencyToSubject (dedup), RemoveCompetencyFromSubject, ListSubjectCompetencies
- [x] `CompetenciesController`: `POST|GET /competencies`, `GET|PUT|DELETE /competencies/:id`
- [x] `SubjectCompetenciesController`: `POST|GET /subjects/:subjectId/competencies`, `DELETE /:competencyId`
- [x] `CompetencyModule` registrado en `AppModule`

### LearningOutcomeModule
- [x] `LearningOutcome` entity: `create()` (uppercase code), `update()`, `softDelete()`; links a subject y/o competency
- [x] `ILearningOutcomeRepository` + `PrismaLearningOutcomeRepository` + `LearningOutcomeMapper`
- [x] Use Cases: Create, Get, ListBySubject, ListByCompetency, Update, Delete
- [x] `LearningOutcomesController`: `POST /learning-outcomes`, `GET|PUT|DELETE /learning-outcomes/:id`
- [x] `NestedLearningOutcomesController`: `GET /subjects/:subjectId/learning-outcomes`, `GET /competencies/:competencyId/learning-outcomes`
- [x] `LearningOutcomeModule` registrado en `AppModule`

### Tests
- [x] `competency.use-cases.spec.ts` — 13 casos (CRUD + link/unlink)
- [x] `learning-outcome.use-cases.spec.ts` — 10 casos (CRUD + list by subject/competency)

## EPIC 11 — User Management ✅

- [x] `User` entity: extendido con `create()`, `update(firstName, lastName)`, `deactivate()`, `softDelete()`
- [x] `IUserRepository`: extendido con `findAll`, `existsByEmail`, `save`, `update`, `delete`
- [x] `PrismaUserRepository`: implementa todos los métodos nuevos
- [x] Use Cases: CreateUser (bcrypt hash + dedup email), GetUser, ListUsers, UpdateUser, DeactivateUser, DeleteUser
- [x] `UsersController`: `POST|GET /users`, `GET|PUT /users/:id`, `PATCH /users/:id/deactivate`, `DELETE /users/:id`
- [x] Tests: `user.use-cases.spec.ts` — 12 casos (entity + 6 use cases)
- [x] Nota: UserModule no importa AuthModule (evita dependencia circular; AuthModule ya importa UserModule)

## EPIC 12 — GitHub Actions CI/CD ✅

- [x] `.github/workflows/ci.yml` — lint + test (backend + frontend) en PR y push a main/develop
  - Servicio postgres en CI, migrations automáticas, `--passWithNoTests`
- [x] `.github/workflows/build.yml` — build + push Docker images a GHCR en push a main o tag `v*`
  - Backend image: `ghcr.io/<owner>/pensum-cloud-backend`
  - Frontend image: `ghcr.io/<owner>/pensum-cloud-frontend`
  - Tags automáticos: branch, semver, sha
  - Cache Docker layers con GitHub Actions cache

## EPIC 13 — Simulación de Ruta Académica ✅

- [x] `ICurriculumPathRepository` + `CURRICULUM_PATH_REPOSITORY` symbol
- [x] `GetCurriculumPathUseCase` — clasifica cada materia como `COMPLETED | AVAILABLE | LOCKED` según `completedIds[]`
  - `COMPLETED`: la materia ya fue cursada (id está en el set)
  - `AVAILABLE`: todos los prerrequisitos completados
  - `LOCKED`: prerrequisitos faltantes → devuelve `missingPrerequisites[]`
- [x] `PrismaCurriculumPathRepository` — una sola query Prisma anidada (semesters → subjects → prerequisites)
- [x] `GET /curricula/:id/path?completed[]=uuid` — endpoint de simulación
- [x] Tests: `curriculum-path.use-case.spec.ts` — 9 casos

## EPIC 14 — Auditoría Curricular ✅

- [x] `ICurriculumAuditRepository` + `CURRICULUM_AUDIT_REPOSITORY` symbol — `loadSubjectsWithCompetencies`
- [x] `CompareCurriculaUseCase` — diff por `code` de materia entre dos currículos
  - Estados: `ADDED | REMOVED | MODIFIED | UNCHANGED`
  - Para `MODIFIED`: lista de `FieldChangeDto` con `{ field, from, to }` (name, credits, semesterNumber)
- [x] `FindRedundanciesUseCase` — detecta grupos de materias con el mismo conjunto de competencias
  - Motivo: `SAME_COMPETENCIES` — potencial redundancia curricular
- [x] `PrismaCurriculumAuditRepository` — query anidada semesters → subjects → competencies
- [x] `GET /curricula/:id/compare?with=:otherId` — comparación entre versiones
- [x] `GET /curricula/:id/redundancies` — detección de redundancias
- [x] Tests: `curriculum-audit.use-cases.spec.ts` — 12 casos

## EPIC 15 — Kubernetes ✅

- [x] `infrastructure/k8s/namespace.yaml` — namespace `pensum-cloud`
- [x] `infrastructure/k8s/configmap.yaml` — ConfigMaps para backend y frontend
- [x] `infrastructure/k8s/secret.yaml` — Secrets (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, credenciales Postgres)
- [x] `infrastructure/k8s/postgres/` — PVC (10Gi) + Deployment (postgres:18-alpine, Recreate) + ClusterIP Service
- [x] `infrastructure/k8s/backend/` — Deployment (2 réplicas, RollingUpdate, initContainer `prisma migrate deploy`, probes) + ClusterIP Service
- [x] `infrastructure/k8s/frontend/` — Deployment (2 réplicas, RollingUpdate, probes) + ClusterIP Service
- [x] `infrastructure/k8s/ingress.yaml` — nginx Ingress: `/api` → backend, `/` → frontend; TLS-ready
- [x] `infrastructure/k8s/kustomization.yaml` — Kustomize entrypoint

## EPIC 16 — Seed Data: Carrera Desarrollo de Software ✅

- [x] Facultad `FTI` — Facultad de Tecnología e Innovación
- [x] Carrera `DS` — Ingeniería en Desarrollo de Software
- [x] **Curriculum V1 (2024-1)** — Pensum Verde:
  - 4 semestres, 24 materias, 5 prerrequisitos
  - Progresión: Programación I→II→III→IV, Base de Datos I→II, Seguridad I→II
- [x] **Curriculum V2 (2024-2)** — Pensum Cyan:
  - 4 semestres, 24 materias, 6 prerrequisitos
  - Progresión: Fundamentos Prog→Desarrollo Web→Frameworks Frontend/Backend→Móvil; Base de Datos I→II; IA→Desarrollo Asistido por IA
- [x] Seed idempotente con `upsert` (seguro re-ejecutar con `pnpm db:seed`)
