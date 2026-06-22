#!/bin/bash

DOCS_DIR="docs"

echo "Generando documentación base..."

# =====================================================
# 00 VISION
# =====================================================

cat > ${DOCS_DIR}/00-vision.md << 'EOF'
# Pensum Cloud

## Visión

Pensum Cloud es una plataforma SaaS Multi-Tenant para la gestión de planes de estudio universitarios.

Permite administrar:

- Universidades
- Facultades
- Carreras
- Planes de estudio
- Asignaturas
- Prerrequisitos
- Competencias
- Resultados de aprendizaje
- Usuarios

## Objetivos

- Crear pensum visuales interactivos.
- Gestionar múltiples versiones.
- Simular trayectorias académicas.
- Incorporar IA para análisis curricular.
- Soportar estándares OBE.

## Tecnologías

Backend:
- NestJS
- Prisma
- PostgreSQL

Frontend:
- React
- Vite
- Tailwind
- React Flow
- React Three Fiber

Infraestructura:
- Docker
- Nginx
- GitHub Actions

EOF

# =====================================================
# 01 ARCHITECTURE
# =====================================================

cat > ${DOCS_DIR}/01-architecture.md << 'EOF'
# Arquitectura

## Principios

- Clean Architecture
- DDD
- SOLID
- CQRS
- Repository Pattern
- Event Driven Architecture

## Monorepo

apps/
  frontend/
  backend/

packages/

docs/

## Backend Layers

Domain
Application
Infrastructure
Presentation

## Frontend Layers

Domain
Application
Infrastructure
Presentation

EOF

# =====================================================
# 02 DOMAIN MODEL
# =====================================================

cat > ${DOCS_DIR}/02-domain-model.md << 'EOF'
# Modelo de Dominio

## Entidades Principales

Tenant
University
Faculty
Career
Curriculum
Semester
Subject
Prerequisite
Competency
LearningOutcome
User
Role

## Relaciones

Tenant
 └── University

University
 └── Faculty

Faculty
 └── Career

Career
 └── Curriculum

Curriculum
 └── Semester

Semester
 └── Subject

Subject
 └── Prerequisite

EOF

# =====================================================
# 03 DATABASE
# =====================================================

cat > ${DOCS_DIR}/03-database.md << 'EOF'
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

EOF

# =====================================================
# 04 BACKEND
# =====================================================

cat > ${DOCS_DIR}/04-backend-guidelines.md << 'EOF'
# Backend Guidelines

Framework:
NestJS

## Reglas

- No lógica en Controllers.
- Use Cases obligatorios.
- Repositories obligatorios.
- DTOs para entrada y salida.
- Swagger obligatorio.

## Testing

- Unit Testing
- Integration Testing

EOF

# =====================================================
# 05 FRONTEND
# =====================================================

cat > ${DOCS_DIR}/05-frontend-guidelines.md << 'EOF'
# Frontend Guidelines

Framework:
React

## Estado

- React Query
- Zustand

## UI

- ShadCN
- Tailwind

## Formularios

- React Hook Form
- Zod

EOF

# =====================================================
# 06 UI UX
# =====================================================

cat > ${DOCS_DIR}/06-ui-ux.md << 'EOF'
# UI UX

## Dashboard

- KPIs
- Gráficos
- Filtros

## Visualizador React Flow

- Zoom
- Pan
- Drag and Drop

## Visualizador 3D

- React Three Fiber
- Three.js

EOF

# =====================================================
# 07 MULTITENANCY
# =====================================================

cat > ${DOCS_DIR}/07-multitenancy.md << 'EOF'
# Multi Tenancy

Modelo:

Shared Database
Shared Schema

## Tenant

Cada universidad representa un tenant.

Todas las consultas deberán filtrar por:

tenant_id

EOF

# =====================================================
# 08 API CONTRACTS
# =====================================================

cat > ${DOCS_DIR}/08-api-contracts.md << 'EOF'
# API Contracts

Pendiente de generación automática.

EOF

# =====================================================
# 09 ROADMAP
# =====================================================

cat > ${DOCS_DIR}/09-roadmap.md << 'EOF'
# Roadmap

## EPIC 1

- [ ] Monorepo
- [ ] Docker
- [ ] PostgreSQL

## EPIC 2

- [ ] Tenant

## EPIC 3

- [ ] Auth

## EPIC 4

- [ ] Universidades

## EPIC 5

- [ ] Carreras

## EPIC 6

- [ ] Pensum

## EPIC 7

- [ ] React Flow

## EPIC 8

- [ ] Three.js

EOF

# =====================================================
# 10 USER STORIES
# =====================================================

cat > ${DOCS_DIR}/10-user-stories.md << 'EOF'
# User Stories

Como Administrador
Quiero crear universidades
Para gestionar múltiples instituciones.

Como Coordinador
Quiero crear carreras
Para definir planes de estudio.

EOF

# =====================================================
# 11 CODING STANDARDS
# =====================================================

cat > ${DOCS_DIR}/11-coding-standards.md << 'EOF'
# Coding Standards

## TypeScript

strict=true

## Reglas

- ESLint
- Prettier
- Conventional Commits

EOF

# =====================================================
# 12 DEVOPS
# =====================================================

cat > ${DOCS_DIR}/12-devops.md << 'EOF'
# DevOps

## CI/CD

GitHub Actions

## Containers

Docker

## Producción

Kubernetes Ready

EOF

# =====================================================
# 13 AI
# =====================================================

cat > ${DOCS_DIR}/13-ai-features.md << 'EOF'
# AI Features

## Generación

- Competencias
- Sílabos
- Bibliografía

## Auditoría

- Comparación curricular
- Detección de redundancias

EOF

# =====================================================
# CLAUDE
# =====================================================

cat > .claude/CLAUDE.md << 'EOF'
# Claude Instructions

Lee toda la documentación dentro de docs/.

Siempre seguir:

- Clean Architecture
- DDD
- SOLID
- CQRS

Nunca:

- Colocar lógica en controllers
- Saltar capas

Actualizar:

- roadmap
- changelog
- api-contracts

No modificar:

- architecture
- domain-model
- coding-standards

sin autorización explícita.

EOF

echo "Documentación inicial generada."