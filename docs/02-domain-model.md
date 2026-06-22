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

