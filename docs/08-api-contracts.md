# API Contracts

Base URL: `http://localhost:3000/api/v1`

Swagger UI disponible en: `http://localhost:3000/docs` (solo en desarrollo)

## Headers comunes

| Header          | Descripción                        | Requerido |
|-----------------|------------------------------------|-----------|
| `Authorization` | `Bearer <JWT>`                     | Sí (auth) |
| `X-Tenant-ID`   | UUID del tenant activo             | Sí        |
| `Content-Type`  | `application/json`                 | POST/PUT  |

---

## EPIC 1 — Infraestructura (sin endpoints de negocio)

> Este epic establece la base: Docker, PostgreSQL, Prisma, NestJS bootstrap.
> No expone endpoints propios.

---

## EPIC 2 — Tenants

### POST `/tenants`

Crea un nuevo tenant.

**Request body:**
```json
{
  "name": "Universidad Nacional",
  "slug": "uni-nacional"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Universidad Nacional",
  "slug": "uni-nacional",
  "isActive": true,
  "createdAt": "2026-06-12T00:00:00.000Z"
}
```

---

### GET `/tenants`

Lista todos los tenants activos.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Universidad Nacional",
    "slug": "uni-nacional",
    "isActive": true,
    "createdAt": "2026-06-12T00:00:00.000Z"
  }
]
```

---

### GET `/tenants/:slug`

Obtiene un tenant por slug.

**Response `200`:** mismo esquema que el item individual.

**Response `404`:** `{ "message": "Tenant not found" }`

---

### PATCH `/tenants/:id/deactivate`

Desactiva un tenant (soft-disable).

**Response `200`:** tenant actualizado con `isActive: false`.

---

## EPIC 3 — Auth

### POST `/auth/login`

```json
// Request
{ "email": "admin@uni.edu", "password": "secret" }

// Response 200
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": { "id": "uuid", "email": "admin@uni.edu", "firstName": "John" }
}
```

### POST `/auth/refresh`

```json
// Request
{ "refreshToken": "<jwt>" }

// Response 200
{ "accessToken": "<jwt>" }
```

---

## EPIC 4 — Universities

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/universities` | Crear universidad |
| `GET` | `/universities` | Listar universidades del tenant |
| `GET` | `/universities/:id` | Obtener por ID |
| `PUT` | `/universities/:id` | Actualizar nombre, país, website |
| `DELETE` | `/universities/:id` | Soft-delete (204) |

**Request body POST/PUT:**
```json
{ "name": "Universidad UTE", "code": "UTE", "country": "Ecuador", "website": "https://ute.edu.ec" }
```

**Response 201/200:**
```json
{ "id": "uuid", "tenantId": "uuid", "name": "Universidad UTE", "code": "UTE", "country": "Ecuador", "website": "https://ute.edu.ec", "createdAt": "...", "updatedAt": "..." }
```

---

## EPIC 5 — Faculties + Careers

### Faculties (nested bajo university)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/universities/:universityId/faculties` | Crear facultad |
| `GET` | `/universities/:universityId/faculties` | Listar facultades |
| `GET` | `/faculties/:id` | Obtener por ID |
| `PUT` | `/faculties/:id` | Actualizar nombre |
| `DELETE` | `/faculties/:id` | Soft-delete (204) |

**Request body POST/PUT:**
```json
{ "name": "Facultad de Ingeniería", "code": "FI" }
```

### Careers (nested bajo faculty)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/faculties/:facultyId/careers` | Crear carrera |
| `GET` | `/faculties/:facultyId/careers` | Listar carreras |
| `GET` | `/careers/:id` | Obtener por ID |
| `PUT` | `/careers/:id` | Actualizar nombre y descripción |
| `DELETE` | `/careers/:id` | Soft-delete (204) |

**Request body POST/PUT:**
```json
{ "name": "Ingeniería de Sistemas", "code": "ISIS", "description": "Carrera de sistemas" }
```

---

## EPIC 6 — Curricula

### Curricula (nested bajo career)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/careers/:careerId/curricula` | Crear curriculum (status=DRAFT) |
| `GET` | `/careers/:careerId/curricula` | Listar curricula de una carrera |
| `GET` | `/curricula/:id` | Obtener por ID |
| `PUT` | `/curricula/:id` | Actualizar nombre y descripción |
| `PATCH` | `/curricula/:id/activate` | Activar (DRAFT→ACTIVE) |
| `PATCH` | `/curricula/:id/archive` | Archivar (→ARCHIVED) |
| `DELETE` | `/curricula/:id` | Soft-delete (204) |

**Request body POST:**
```json
{ "version": 1, "name": "Plan de Estudios 2024", "description": "Descripción" }
```

**Response:**
```json
{ "id": "uuid", "tenantId": "uuid", "careerId": "uuid", "version": 1, "name": "Plan 2024", "description": null, "status": "DRAFT", "createdAt": "...", "updatedAt": "..." }
```

---

### Semesters (nested bajo curriculum)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/curricula/:curriculumId/semesters` | Crear semestre (number único por curriculum) |
| `GET` | `/curricula/:curriculumId/semesters` | Listar semestres ordenados por number |
| `GET` | `/semesters/:id` | Obtener por ID |
| `PUT` | `/semesters/:id` | Actualizar nombre |
| `DELETE` | `/semesters/:id` | Soft-delete (204) |

**Request body POST:**
```json
{ "number": 1, "name": "Primer Semestre" }
```

---

### Subjects (nested bajo semester)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/semesters/:semesterId/subjects` | Crear materia (code único por semester) |
| `GET` | `/semesters/:semesterId/subjects` | Listar materias del semestre |
| `GET` | `/subjects/:id` | Obtener por ID |
| `PUT` | `/subjects/:id` | Actualizar (sin cambio de code) |
| `DELETE` | `/subjects/:id` | Soft-delete (204) |

**Request body POST:**
```json
{ "name": "Cálculo Diferencial", "code": "MAT101", "credits": 3, "hoursTheory": 2, "hoursPractice": 2, "description": "Introducción al cálculo" }
```

**Response:**
```json
{ "id": "uuid", "tenantId": "uuid", "semesterId": "uuid", "name": "Cálculo Diferencial", "code": "MAT101", "credits": 3, "hoursTheory": 2, "hoursPractice": 2, "description": null, "createdAt": "...", "updatedAt": "..." }
```

---

### Prerequisites (self-referential en subjects)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/subjects/:subjectId/prerequisites` | Agregar prerrequisito |
| `GET` | `/subjects/:subjectId/prerequisites` | Listar prerrequisitos de una materia |
| `DELETE` | `/subjects/:subjectId/prerequisites/:requiresId` | Eliminar relación (204) |

**Request body POST:**
```json
{ "requiresId": "uuid-de-la-materia-requerida" }
```

**Response:**
```json
{ "subjectId": "uuid", "requiresId": "uuid", "tenantId": "uuid", "createdAt": "..." }
```

> **Restricción de dominio:** `subjectId` ≠ `requiresId` (una materia no puede ser su propio prerrequisito).

---

## EPIC 10 — Competencias y Resultados de Aprendizaje

### Competencies

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/competencies` | Crear competencia |
| `GET` | `/competencies` | Listar todas del tenant |
| `GET` | `/competencies/:id` | Obtener por ID |
| `PUT` | `/competencies/:id` | Actualizar |
| `DELETE` | `/competencies/:id` | Eliminar (soft, 204) |

**Request body POST:**
```json
{ "name": "Critical Thinking", "code": "CT01", "description": "Ability to analyze" }
```

**Response:**
```json
{ "id": "uuid", "tenantId": "uuid", "name": "Critical Thinking", "code": "CT01", "description": "Ability to analyze", "createdAt": "...", "updatedAt": "..." }
```

> `code` se almacena en mayúsculas. Debe ser único por tenant.

---

### Subject Competencies (pivot)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/subjects/:subjectId/competencies` | Asociar competencia a materia (204) |
| `GET` | `/subjects/:subjectId/competencies` | Listar competencias de la materia |
| `DELETE` | `/subjects/:subjectId/competencies/:competencyId` | Desasociar (204) |

**Request body POST:**
```json
{ "competencyId": "uuid" }
```

---

### Learning Outcomes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/learning-outcomes` | Crear resultado de aprendizaje |
| `GET` | `/learning-outcomes/:id` | Obtener por ID |
| `PUT` | `/learning-outcomes/:id` | Actualizar (description, code) |
| `DELETE` | `/learning-outcomes/:id` | Eliminar (soft, 204) |
| `GET` | `/subjects/:subjectId/learning-outcomes` | Listar por materia |
| `GET` | `/competencies/:competencyId/learning-outcomes` | Listar por competencia |

**Request body POST:**
```json
{ "description": "Student can analyze complex systems", "code": "LO01", "subjectId": "uuid", "competencyId": "uuid" }
```

> `subjectId` y `competencyId` son opcionales. Un resultado puede vincularse a ambos, uno, o ninguno.

**Response:**
```json
{ "id": "uuid", "tenantId": "uuid", "description": "Student can analyze complex systems", "code": "LO01", "subjectId": "uuid", "competencyId": "uuid", "createdAt": "...", "updatedAt": "..." }
```

---

## EPIC 11 — User Management

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/users` | Crear usuario |
| `GET` | `/users` | Listar usuarios del tenant |
| `GET` | `/users/:id` | Obtener por ID |
| `PUT` | `/users/:id` | Actualizar nombre |
| `PATCH` | `/users/:id/deactivate` | Desactivar usuario |
| `DELETE` | `/users/:id` | Eliminar (soft, 204) |

**Request body POST:**
```json
{ "email": "user@example.com", "password": "securePass123", "firstName": "John", "lastName": "Doe" }
```

**Response:**
```json
{ "id": "uuid", "tenantId": "uuid", "email": "user@example.com", "firstName": "John", "lastName": "Doe", "fullName": "John Doe", "isActive": true, "roles": [], "createdAt": "...", "updatedAt": "..." }
```

> La contraseña se almacena con bcrypt (12 rounds). El campo `password` nunca se devuelve en las respuestas.

---

## EPIC 13 — Simulación de Ruta Académica

### GET `/curricula/:id/path`

Clasifica cada materia del currículo en función de las materias ya cursadas.

**Query params:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `completed[]` | `uuid[]` | IDs de materias completadas (repetir param para múltiples) |

**Ejemplo:** `GET /curricula/uuid/path?completed[]=uuid1&completed[]=uuid2`

**Response `200`:**
```json
{
  "curriculumId": "uuid",
  "totalSubjects": 30,
  "completedCount": 5,
  "availableCount": 8,
  "lockedCount": 17,
  "subjects": [
    {
      "id": "uuid",
      "code": "MAT101",
      "name": "Cálculo Diferencial",
      "credits": 4,
      "semesterNumber": 1,
      "status": "COMPLETED"
    },
    {
      "id": "uuid",
      "code": "MAT201",
      "name": "Cálculo Integral",
      "credits": 4,
      "semesterNumber": 2,
      "status": "LOCKED",
      "missingPrerequisites": ["uuid-mat101"]
    }
  ]
}
```

> `status`: `COMPLETED` | `AVAILABLE` (todos prerrequisitos cumplidos) | `LOCKED` (faltan prerrequisitos).
> `missingPrerequisites`: sólo presente cuando `status = LOCKED`; lista de IDs de materias pendientes.

---

## EPIC 14 — Auditoría Curricular

### GET `/curricula/:id/compare?with=:otherId`

Compara dos versiones de un currículo (por código de materia).

**Query params:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `with` | `uuid` | ID del segundo currículo a comparar |

**Response `200`:**
```json
{
  "curriculumAId": "uuid-a",
  "curriculumBId": "uuid-b",
  "addedCount": 2,
  "removedCount": 1,
  "modifiedCount": 3,
  "unchangedCount": 24,
  "subjects": [
    {
      "code": "MAT101",
      "name": "Cálculo Diferencial",
      "credits": 4,
      "semesterNumber": 1,
      "status": "UNCHANGED"
    },
    {
      "code": "FIS201",
      "name": "Física II",
      "credits": 3,
      "semesterNumber": 2,
      "status": "MODIFIED",
      "changes": [{ "field": "credits", "from": 4, "to": 3 }]
    },
    {
      "code": "NEW101",
      "name": "Nueva Materia",
      "credits": 2,
      "semesterNumber": 5,
      "status": "ADDED"
    }
  ]
}
```

> `status`: `ADDED` | `REMOVED` | `MODIFIED` | `UNCHANGED`.
> `changes`: sólo presente cuando `status = MODIFIED`; lista de `{ field, from, to }`.
> `400` si ambos IDs son iguales. `404` si alguno no existe.

---

### GET `/curricula/:id/redundancies`

Detecta materias que cubren exactamente el mismo conjunto de competencias.

**Response `200`:**
```json
{
  "curriculumId": "uuid",
  "totalRedundancyGroups": 1,
  "groups": [
    {
      "reason": "SAME_COMPETENCIES",
      "subjectIds": ["uuid-a", "uuid-b"],
      "subjectCodes": ["MAT201", "MAT202"],
      "competencyIds": ["comp-uuid-1", "comp-uuid-2"]
    }
  ]
}
```

> Sólo se consideran materias con al menos una competencia asignada. `reason`: actualmente sólo `SAME_COMPETENCIES`.

---

## Códigos de error estándar

| Código | Significado                            |
|--------|----------------------------------------|
| `400`  | Validación fallida (class-validator)   |
| `401`  | No autenticado                         |
| `403`  | Sin permiso                            |
| `404`  | Recurso no encontrado                  |
| `409`  | Conflicto (ej. slug duplicado)         |
| `500`  | Error interno del servidor             |

**Formato de error:**
```json
{
  "statusCode": 400,
  "message": ["name should not be empty"],
  "error": "Bad Request"
}
```
