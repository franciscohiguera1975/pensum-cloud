# Base de Datos

Motor:

PostgreSQL

## Convenciones

- UUID como PK
- created_at
- updated_at
- deleted_at

## Tenant Isolation

Todas las tablas deberán incluir:

tenant_id UUID

