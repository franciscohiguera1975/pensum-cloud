import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ────────────────────────────────────────────────────────────────────────────
  // ROLES
  // ────────────────────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Platform administrator' },
  });
  const coordinatorRole = await prisma.role.upsert({
    where: { name: 'COORDINATOR' },
    update: {},
    create: { name: 'COORDINATOR', description: 'Curriculum coordinator' },
  });
  const viewerRole = await prisma.role.upsert({
    where: { name: 'VIEWER' },
    update: {},
    create: { name: 'VIEWER', description: 'Read-only viewer' },
  });
  console.log('✅ Roles:', adminRole.name, coordinatorRole.name, viewerRole.name);

  // ────────────────────────────────────────────────────────────────────────────
  // TENANT
  // ────────────────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-university' },
    update: { name: 'Universidad UTE' },
    create: { name: 'Universidad UTE', slug: 'demo-university', isActive: true },
  });
  console.log('✅ Tenant:', tenant.slug);

  const tid = tenant.id; // alias reutilizado en todos los registros

  // ────────────────────────────────────────────────────────────────────────────
  // UNIVERSITY
  // ────────────────────────────────────────────────────────────────────────────
  const university = await prisma.university.upsert({
    where: { tenantId_code: { tenantId: tid, code: 'UTE' } },
    update: { name: 'Universidad UTE', country: 'Ecuador', website: 'https://ute.edu.ec' },
    create: {
      tenantId: tid,
      name: 'Universidad UTE',
      code: 'UTE',
      country: 'Ecuador',
      website: 'https://ute.edu.ec',
    },
  });
  console.log('✅ University:', university.name);

  // ────────────────────────────────────────────────────────────────────────────
  // FACULTY — Facultad de Ingeniería
  // ────────────────────────────────────────────────────────────────────────────
  // Nota: migrado de code 'FE' → 'FI'; el upsert usa 'FI' después del primer run.
  // Si existía como 'FE', ya fue renombrado a 'FI' vía migración directa en BD.
  const facultyFE = await prisma.faculty.upsert({
    where: { universityId_code: { universityId: university.id, code: 'FI' } },
    update: { name: 'Facultad de Ingeniería', code: 'FI' },
    create: {
      tenantId: tid,
      universityId: university.id,
      name: 'Facultad de Ingeniería',
      code: 'FI',
    },
  });

  await prisma.career.upsert({
    where: { facultyId_code: { facultyId: facultyFE.id, code: 'CC' } },
    update: { name: 'Ciencias de la Computación', code: 'CC' },
    create: {
      tenantId: tid,
      facultyId: facultyFE.id,
      name: 'Ciencias de la Computación',
      code: 'CC',
      description: 'Carrera en Ciencias de la Computación',
    },
  });
  console.log('✅ Faculty FI + Career CC');

  // ────────────────────────────────────────────────────────────────────────────
  // FACULTY — Tecnología e Innovación
  // ────────────────────────────────────────────────────────────────────────────
  const facultyFTI = await prisma.faculty.upsert({
    where: { universityId_code: { universityId: university.id, code: 'FTI' } },
    update: {},
    create: {
      tenantId: tid,
      universityId: university.id,
      name: 'Facultad de Tecnología e Innovación',
      code: 'FTI',
    },
  });

  const careerDS = await prisma.career.upsert({
    where: { facultyId_code: { facultyId: facultyFTI.id, code: 'DS' } },
    update: {},
    create: {
      tenantId: tid,
      facultyId: facultyFTI.id,
      name: 'Ingeniería en Desarrollo de Software',
      code: 'DS',
      description: 'Carrera en Desarrollo de Software orientada al mercado laboral tecnológico',
    },
  });
  console.log('✅ Faculty FTI + Career DS:', careerDS.name);

  // ══════════════════════════════════════════════════════════════════════════════
  // PENSUM V1  —  versión "2024-1"  (Pensum Verde)
  //
  // Créditos:  CD = Clase Directa (hoursTheory)
  //            PE = Práctica Empresarial (hoursPractice)
  //            CC = Clase Combinada (hoursTheory, hoursPractice=0)
  //   Fórmula: credits = (CD + PE) / 16  |  credits = CC / 16
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('\n📗 Seeding Pensum 2024-1 (V1)...');

  const currV1 = await prisma.curriculum.upsert({
    where: { careerId_version: { careerId: careerDS.id, version: '2024-1' } },
    update: {},
    create: {
      tenantId: tid,
      careerId: careerDS.id,
      version: '2024-1',
      name: 'Pensum Desarrollo de Software 2024-1',
      description: 'Plan de estudios versión 2024-1 (Pensum Verde)',
      status: 'ACTIVE',
    },
  });

  // ── V1 · Semestre I ─────────────────────────────────────────────────────────
  const v1s1 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: currV1.id, number: 1 } },
    update: {},
    create: { tenantId: tid, curriculumId: currV1.id, number: 1, name: 'Semestre I' },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s1.id, code: 'MAT-101' } },
    update: { description: 'Lógica y conjuntos;Álgebra lineal y matrices;Límites y derivadas;Aplicaciones matemáticas en software' },
    create: {
      tenantId: tid, semesterId: v1s1.id,
      name: 'Matemáticas',               code: 'MAT-101',
      credits: 3, hoursTheory: 32,       hoursPractice: 16,
      description: 'Lógica y conjuntos;Álgebra lineal y matrices;Límites y derivadas;Aplicaciones matemáticas en software',
    },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s1.id, code: 'EST-101' } },
    update: { description: 'Recolección de datos;Medidas de tendencia central;Distribución de frecuencias;Gráficos y visualización' },
    create: {
      tenantId: tid, semesterId: v1s1.id,
      name: 'Estadística I (Descriptiva)', code: 'EST-101',
      credits: 3, hoursTheory: 32,        hoursPractice: 16,
      description: 'Recolección de datos;Medidas de tendencia central;Distribución de frecuencias;Gráficos y visualización',
    },
  });

  // CD:64 PE:32 → credits=6  ← se reutiliza en prerrequisito
  const v1s1PRG = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s1.id, code: 'PRG-101' } },
    update: { description: 'Algoritmos y pseudocódigo;Variables y tipos de datos;Estructuras de control;Funciones y modularización' },
    create: {
      tenantId: tid, semesterId: v1s1.id,
      name: 'Programación I',             code: 'PRG-101',
      credits: 6, hoursTheory: 64,        hoursPractice: 32,
      description: 'Algoritmos y pseudocódigo;Variables y tipos de datos;Estructuras de control;Funciones y modularización',
    },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s1.id, code: 'SOP-101' } },
    update: { description: 'Arquitectura del kernel;Gestión de procesos e hilos;Administración de memoria;Sistemas de archivos' },
    create: {
      tenantId: tid, semesterId: v1s1.id,
      name: 'Sistemas Operativos',        code: 'SOP-101',
      credits: 3, hoursTheory: 32,        hoursPractice: 16,
      description: 'Arquitectura del kernel;Gestión de procesos e hilos;Administración de memoria;Sistemas de archivos',
    },
  });

  // CD:48 PE:16 → credits=4
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s1.id, code: 'TIC-101' } },
    update: { description: 'Fundamentos de red e Internet;Herramientas de productividad;Sistemas de información;Seguridad digital básica' },
    create: {
      tenantId: tid, semesterId: v1s1.id,
      name: 'Tecnologías de Información y Comunicación', code: 'TIC-101',
      credits: 4, hoursTheory: 48,                       hoursPractice: 16,
      description: 'Fundamentos de red e Internet;Herramientas de productividad;Sistemas de información;Seguridad digital básica',
    },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s1.id, code: 'CON-101' } },
    update: { description: 'Principios de contabilidad;Registro de transacciones;Estados financieros;Análisis de costos y presupuestos' },
    create: {
      tenantId: tid, semesterId: v1s1.id,
      name: 'Introducción a la Contabilidad', code: 'CON-101',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Principios de contabilidad;Registro de transacciones;Estados financieros;Análisis de costos y presupuestos',
    },
  });

  // ── V1 · Semestre II ────────────────────────────────────────────────────────
  const v1s2 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: currV1.id, number: 2 } },
    update: {},
    create: { tenantId: tid, curriculumId: currV1.id, number: 2, name: 'Semestre II' },
  });

  // CC:48 → credits=3  ← se reutiliza en prerrequisito
  const v1s2BDI = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s2.id, code: 'BDI-201' } },
    update: { description: 'Modelo relacional;Diseño de diagramas ER;Normalización de tablas;Consultas SQL estructuradas' },
    create: {
      tenantId: tid, semesterId: v1s2.id,
      name: 'Base de Datos I',           code: 'BDI-201',
      credits: 3, hoursTheory: 48,       hoursPractice: 0,
      description: 'Modelo relacional;Diseño de diagramas ER;Normalización de tablas;Consultas SQL estructuradas',
    },
  });

  // CC:48 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s2.id, code: 'EST-201' } },
    update: { description: 'Probabilidad e inferencia;Fundamentos de Big Data;Herramientas de BI;Modelos estadísticos de predicción' },
    create: {
      tenantId: tid, semesterId: v1s2.id,
      name: 'Estadística II (BI y Big Data)', code: 'EST-201',
      credits: 3, hoursTheory: 48,            hoursPractice: 0,
      description: 'Probabilidad e inferencia;Fundamentos de Big Data;Herramientas de BI;Modelos estadísticos de predicción',
    },
  });

  // CC:64 → credits=4  ← se reutiliza en prerrequisito
  const v1s2PRG = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s2.id, code: 'PRG-201' } },
    update: { description: 'Programación orientada a objetos;Clases y objetos;Herencia y polimorfismo;Manejo de excepciones' },
    create: {
      tenantId: tid, semesterId: v1s2.id,
      name: 'Programación II',           code: 'PRG-201',
      credits: 4, hoursTheory: 64,       hoursPractice: 0,
      description: 'Programación orientada a objetos;Clases y objetos;Herencia y polimorfismo;Manejo de excepciones',
    },
  });

  // CC:48 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s2.id, code: 'MDS-201' } },
    update: { description: 'Ciclo de vida del software;Metodologías ágiles (Scrum);Historias de usuario;Pruebas y despliegue básico' },
    create: {
      tenantId: tid, semesterId: v1s2.id,
      name: 'Metodología de Desarrollo de Software', code: 'MDS-201',
      credits: 3, hoursTheory: 48,                   hoursPractice: 0,
      description: 'Ciclo de vida del software;Metodologías ágiles (Scrum);Historias de usuario;Pruebas y despliegue básico',
    },
  });

  // CC:48 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s2.id, code: 'RTE-201' } },
    update: { description: 'Modelo OSI y TCP/IP;Topologías de red;Direccionamiento IP;Seguridad en redes' },
    create: {
      tenantId: tid, semesterId: v1s2.id,
      name: 'Redes y Telecomunicaciones', code: 'RTE-201',
      credits: 3, hoursTheory: 48,         hoursPractice: 0,
      description: 'Modelo OSI y TCP/IP;Topologías de red;Direccionamiento IP;Seguridad en redes',
    },
  });

  // CC:32 → credits=2
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s2.id, code: 'ARC-201' } },
    update: { description: 'Arquitectura Von Neumann;Representación de datos;Circuitos lógicos;Jerarquía de memoria' },
    create: {
      tenantId: tid, semesterId: v1s2.id,
      name: 'Arquitectura de Computadores', code: 'ARC-201',
      credits: 2, hoursTheory: 32,          hoursPractice: 0,
      description: 'Arquitectura Von Neumann;Representación de datos;Circuitos lógicos;Jerarquía de memoria',
    },
  });

  // ── V1 · Semestre III ───────────────────────────────────────────────────────
  const v1s3 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: currV1.id, number: 3 } },
    update: {},
    create: { tenantId: tid, curriculumId: currV1.id, number: 3, name: 'Semestre III' },
  });

  // CC:48 → credits=3  ← se reutiliza en prerrequisito
  const v1s3BDII = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s3.id, code: 'BDII-301' } },
    update: { description: 'Bases de datos NoSQL;Redis y caché;Optimización de consultas;Bases distribuidas' },
    create: {
      tenantId: tid, semesterId: v1s3.id,
      name: 'Base de Datos II',          code: 'BDII-301',
      credits: 3, hoursTheory: 48,       hoursPractice: 0,
      description: 'Bases de datos NoSQL;Redis y caché;Optimización de consultas;Bases distribuidas',
    },
  });

  // CC:48 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s3.id, code: 'UXI-301' } },
    update: { description: 'Principios de UX;Prototipado en Figma;Diseño visual e interfaces;Pruebas de usabilidad' },
    create: {
      tenantId: tid, semesterId: v1s3.id,
      name: 'Diseño de Interfaz de Usuario (UX/UI)', code: 'UXI-301',
      credits: 3, hoursTheory: 48,                   hoursPractice: 0,
      description: 'Principios de UX;Prototipado en Figma;Diseño visual e interfaces;Pruebas de usabilidad',
    },
  });

  // CC:48 → credits=3  ← se reutiliza en prerrequisito
  const v1s3PRG = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s3.id, code: 'PRG-301' } },
    update: { description: 'Patrones de diseño GoF;Programación funcional;Clean Code y refactorización;Desarrollo de APIs REST' },
    create: {
      tenantId: tid, semesterId: v1s3.id,
      name: 'Programación III',          code: 'PRG-301',
      credits: 3, hoursTheory: 48,       hoursPractice: 0,
      description: 'Patrones de diseño GoF;Programación funcional;Clean Code y refactorización;Desarrollo de APIs REST',
    },
  });

  // CC:48 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s3.id, code: 'CAL-301' } },
    update: { description: 'Aseguramiento de calidad (QA);Testing unitario y de integración;Estándares ISO 25010;Integración continua' },
    create: {
      tenantId: tid, semesterId: v1s3.id,
      name: 'Calidad de Software',       code: 'CAL-301',
      credits: 3, hoursTheory: 48,       hoursPractice: 0,
      description: 'Aseguramiento de calidad (QA);Testing unitario y de integración;Estándares ISO 25010;Integración continua',
    },
  });

  // CD:32 → credits=2  ← se reutiliza en prerrequisito
  const v1s3SEI = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s3.id, code: 'SEI-301' } },
    update: { description: 'Criptografía básica;Seguridad en sistemas;Control de acceso;Amenazas y vulnerabilidades' },
    create: {
      tenantId: tid, semesterId: v1s3.id,
      name: 'Seguridad Informática I',   code: 'SEI-301',
      credits: 2, hoursTheory: 32,       hoursPractice: 0,
      description: 'Criptografía básica;Seguridad en sistemas;Control de acceso;Amenazas y vulnerabilidades',
    },
  });

  // CD:32 → credits=2
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s3.id, code: 'INV-301' } },
    update: { description: 'Método científico;Formulación del problema;Recolección de información;Redacción de propuestas' },
    create: {
      tenantId: tid, semesterId: v1s3.id,
      name: 'Introducción a Proyectos de Investigación', code: 'INV-301',
      credits: 2, hoursTheory: 32,                       hoursPractice: 0,
      description: 'Método científico;Formulación del problema;Recolección de información;Redacción de propuestas',
    },
  });

  // ── V1 · Semestre IV ────────────────────────────────────────────────────────
  const v1s4 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: currV1.id, number: 4 } },
    update: {},
    create: { tenantId: tid, curriculumId: currV1.id, number: 4, name: 'Semestre IV' },
  });

  // CD:32 → credits=2
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s4.id, code: 'FML-401' } },
    update: { description: 'Algoritmos supervisados;Modelos no supervisados;Evaluación de modelos;Preprocesamiento de datos' },
    create: {
      tenantId: tid, semesterId: v1s4.id,
      name: 'Fundamentos de Machine Learning', code: 'FML-401',
      credits: 2, hoursTheory: 32,             hoursPractice: 0,
      description: 'Algoritmos supervisados;Modelos no supervisados;Evaluación de modelos;Preprocesamiento de datos',
    },
  });

  // CD:32 → credits=2
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s4.id, code: 'FIA-401' } },
    update: { description: 'Agentes inteligentes;Búsqueda heurística;Lógica difusa;Procesamiento de lenguaje natural' },
    create: {
      tenantId: tid, semesterId: v1s4.id,
      name: 'Fundamentos de Inteligencia Artificial', code: 'FIA-401',
      credits: 2, hoursTheory: 32,                    hoursPractice: 0,
      description: 'Agentes inteligentes;Búsqueda heurística;Lógica difusa;Procesamiento de lenguaje natural',
    },
  });

  // CC:48 → credits=3  ← se reutiliza en prerrequisito
  const v1s4PRG = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s4.id, code: 'PRG-401' } },
    update: { description: 'Microservicios;Desarrollo en la nube;Seguridad en APIs;Contenedores y Docker' },
    create: {
      tenantId: tid, semesterId: v1s4.id,
      name: 'Programación IV',           code: 'PRG-401',
      credits: 3, hoursTheory: 48,       hoursPractice: 0,
      description: 'Microservicios;Desarrollo en la nube;Seguridad en APIs;Contenedores y Docker',
    },
  });

  // CD:32 → credits=2
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s4.id, code: 'AGP-401' } },
    update: { description: 'Guía PMBOK;Gestión de riesgos;Herramientas de seguimiento;Entrega de valor' },
    create: {
      tenantId: tid, semesterId: v1s4.id,
      name: 'Administración y Gestión de Proyectos', code: 'AGP-401',
      credits: 2, hoursTheory: 32,                   hoursPractice: 0,
      description: 'Guía PMBOK;Gestión de riesgos;Herramientas de seguimiento;Entrega de valor',
    },
  });

  // CD:32 → credits=2  ← se reutiliza en prerrequisito
  const v1s4SEII = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s4.id, code: 'SEII-401' } },
    update: { description: 'Seguridad web;DevSecOps;Ethical hacking;Auditoría de sistemas' },
    create: {
      tenantId: tid, semesterId: v1s4.id,
      name: 'Seguridad Informática II',  code: 'SEII-401',
      credits: 2, hoursTheory: 32,       hoursPractice: 0,
      description: 'Seguridad web;DevSecOps;Ethical hacking;Auditoría de sistemas',
    },
  });

  // CD:32 → credits=2
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v1s4.id, code: 'SIN-401' } },
    update: { description: 'Proyecto integrador final;Portafolio profesional;Despliegue en producción;Presentación del proyecto' },
    create: {
      tenantId: tid, semesterId: v1s4.id,
      name: 'Seminario de Integración',  code: 'SIN-401',
      credits: 2, hoursTheory: 32,       hoursPractice: 0,
      description: 'Proyecto integrador final;Portafolio profesional;Despliegue en producción;Presentación del proyecto',
    },
  });

  // ── V1 · Prerrequisitos ─────────────────────────────────────────────────────
  //  PRG-201  ← PRG-101
  //  BDII-301 ← BDI-201
  //  PRG-301  ← PRG-201
  //  PRG-401  ← PRG-301
  //  SEII-401 ← SEI-301
  const v1Prerequisites = [
    { subjectId: v1s2PRG.id,  requiresId: v1s1PRG.id  },
    { subjectId: v1s3BDII.id, requiresId: v1s2BDI.id  },
    { subjectId: v1s3PRG.id,  requiresId: v1s2PRG.id  },
    { subjectId: v1s4PRG.id,  requiresId: v1s3PRG.id  },
    { subjectId: v1s4SEII.id, requiresId: v1s3SEI.id  },
  ];
  for (const p of v1Prerequisites) {
    await prisma.prerequisite.upsert({
      where: { subjectId_requiresId: { subjectId: p.subjectId, requiresId: p.requiresId } },
      update: {},
      create: { tenantId: tid, subjectId: p.subjectId, requiresId: p.requiresId },
    });
  }
  console.log('✅ Pensum 2024-1 (V1): 4 semestres · 24 materias · 5 prerrequisitos');

  // ══════════════════════════════════════════════════════════════════════════════
  // PENSUM V2  —  versión "2024-2"  (Pensum Cyan)
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('\n📘 Seeding Pensum 2024-2 (V2)...');

  const currV2 = await prisma.curriculum.upsert({
    where: { careerId_version: { careerId: careerDS.id, version: '2024-2' } },
    update: {},
    create: {
      tenantId: tid,
      careerId: careerDS.id,
      version: '2024-2',
      name: 'Pensum Desarrollo de Software 2024-2',
      description: 'Plan de estudios versión 2024-2 (Pensum Cyan)',
      status: 'ACTIVE',
    },
  });

  // ── V2 · Semestre I ─────────────────────────────────────────────────────────
  const v2s1 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: currV2.id, number: 1 } },
    update: {},
    create: { tenantId: tid, curriculumId: currV2.id, number: 1, name: 'Semestre I' },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s1.id, code: 'MAT-101' } },
    update: { description: 'Lógica y conjuntos;Álgebra lineal y matrices;Límites y derivadas;Aplicaciones matemáticas en software' },
    create: {
      tenantId: tid, semesterId: v2s1.id,
      name: 'Matemática para Desarrollo de Software', code: 'MAT-101',
      credits: 3, hoursTheory: 32,                    hoursPractice: 16,
      description: 'Lógica y conjuntos;Álgebra lineal y matrices;Límites y derivadas;Aplicaciones matemáticas en software',
    },
  });

  // CD:64 PE:32 → credits=6  ← se reutiliza en prerrequisito
  const v2s1BDI = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s1.id, code: 'BDI-101' } },
    update: { description: 'Modelo relacional;Diseño de diagramas ER;Normalización de tablas;Consultas SQL estructuradas' },
    create: {
      tenantId: tid, semesterId: v2s1.id,
      name: 'Base de Datos I',           code: 'BDI-101',
      credits: 6, hoursTheory: 64,       hoursPractice: 32,
      description: 'Modelo relacional;Diseño de diagramas ER;Normalización de tablas;Consultas SQL estructuradas',
    },
  });

  // CD:64 PE:32 → credits=6  ← se reutiliza en prerrequisito
  const v2s1FPR = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s1.id, code: 'FPR-101' } },
    update: { description: 'Algoritmos y pseudocódigo;Variables y tipos de datos;Estructuras de control;Funciones y modularización' },
    create: {
      tenantId: tid, semesterId: v2s1.id,
      name: 'Fundamentos de Programación', code: 'FPR-101',
      credits: 6, hoursTheory: 64,         hoursPractice: 32,
      description: 'Algoritmos y pseudocódigo;Variables y tipos de datos;Estructuras de control;Funciones y modularización',
    },
  });

  // CD:48 PE:16 → credits=4
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s1.id, code: 'SOP-101' } },
    update: { description: 'Arquitectura del kernel;Gestión de procesos e hilos;Administración de memoria;Sistemas de archivos' },
    create: {
      tenantId: tid, semesterId: v2s1.id,
      name: 'Sistemas Operativos',        code: 'SOP-101',
      credits: 4, hoursTheory: 48,        hoursPractice: 16,
      description: 'Arquitectura del kernel;Gestión de procesos e hilos;Administración de memoria;Sistemas de archivos',
    },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s1.id, code: 'TAP-101' } },
    update: { description: 'Uso de terminal y Git;Entornos de desarrollo (IDE);Automatización de tareas;Documentación técnica' },
    create: {
      tenantId: tid, semesterId: v2s1.id,
      name: 'Tecnología Aplicada al Desarrollo', code: 'TAP-101',
      credits: 3, hoursTheory: 32,               hoursPractice: 16,
      description: 'Uso de terminal y Git;Entornos de desarrollo (IDE);Automatización de tareas;Documentación técnica',
    },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s1.id, code: 'GOR-101' } },
    update: { description: 'Estructura organizacional;Cultura de la empresa;Liderazgo y trabajo en equipo;Planificación estratégica' },
    create: {
      tenantId: tid, semesterId: v2s1.id,
      name: 'Gestión Organizacional',     code: 'GOR-101',
      credits: 3, hoursTheory: 32,        hoursPractice: 16,
      description: 'Estructura organizacional;Cultura de la empresa;Liderazgo y trabajo en equipo;Planificación estratégica',
    },
  });

  // ── V2 · Semestre II ────────────────────────────────────────────────────────
  const v2s2 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: currV2.id, number: 2 } },
    update: {},
    create: { tenantId: tid, curriculumId: currV2.id, number: 2, name: 'Semestre II' },
  });

  // CD:48 PE:16 → credits=4  ← se reutiliza en prerrequisito
  const v2s2DWE = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s2.id, code: 'DWE-201' } },
    update: { description: 'HTML5 y CSS3 semántico;JavaScript interactivo;Responsive Design;Frameworks de frontend' },
    create: {
      tenantId: tid, semesterId: v2s2.id,
      name: 'Desarrollo Web',            code: 'DWE-201',
      credits: 4, hoursTheory: 48,       hoursPractice: 16,
      description: 'HTML5 y CSS3 semántico;JavaScript interactivo;Responsive Design;Frameworks de frontend',
    },
  });

  // CD:48 PE:16 → credits=4
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s2.id, code: 'BDII-201' } },
    update: { description: 'Bases de datos NoSQL;Redis y caché;Optimización de consultas;Bases distribuidas' },
    create: {
      tenantId: tid, semesterId: v2s2.id,
      name: 'Base de Datos II',          code: 'BDII-201',
      credits: 4, hoursTheory: 48,       hoursPractice: 16,
      description: 'Bases de datos NoSQL;Redis y caché;Optimización de consultas;Bases distribuidas',
    },
  });

  // CD:48 PE:16 → credits=4  ← se reutiliza en prerrequisito
  const v2s2FBK = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s2.id, code: 'FBK-201' } },
    update: { description: 'Arquitectura con NestJS;Inyección de dependencias;Conexión a bases de datos;Seguridad y JWT' },
    create: {
      tenantId: tid, semesterId: v2s2.id,
      name: 'Frameworks Backend',        code: 'FBK-201',
      credits: 4, hoursTheory: 48,       hoursPractice: 16,
      description: 'Arquitectura con NestJS;Inyección de dependencias;Conexión a bases de datos;Seguridad y JWT',
    },
  });

  // CD:48 PE:16 → credits=4
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s2.id, code: 'INR-201' } },
    update: { description: 'Virtualización y contenedores;Servicios en la nube;Configuración de redes;Monitoreo de sistemas' },
    create: {
      tenantId: tid, semesterId: v2s2.id,
      name: 'Infraestructura Computacional y Redes', code: 'INR-201',
      credits: 4, hoursTheory: 48,                   hoursPractice: 16,
      description: 'Virtualización y contenedores;Servicios en la nube;Configuración de redes;Monitoreo de sistemas',
    },
  });

  // CD:48 PE:16 → credits=4
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s2.id, code: 'TSW-201' } },
    update: { description: 'Tipos de testing;TDD (Test Driven Development);Automatización con Jest;Reporte de fallos' },
    create: {
      tenantId: tid, semesterId: v2s2.id,
      name: 'Testing de Software',       code: 'TSW-201',
      credits: 4, hoursTheory: 48,       hoursPractice: 16,
      description: 'Tipos de testing;TDD (Test Driven Development);Automatización con Jest;Reporte de fallos',
    },
  });

  // CD:48 PE:16 → credits=4
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s2.id, code: 'ANP-201' } },
    update: { description: 'Análisis exploratorio;Regresión lineal y logística;Visualización de predicciones;Herramientas de modelado' },
    create: {
      tenantId: tid, semesterId: v2s2.id,
      name: 'Analítica Predictiva',      code: 'ANP-201',
      credits: 4, hoursTheory: 48,       hoursPractice: 16,
      description: 'Análisis exploratorio;Regresión lineal y logística;Visualización de predicciones;Herramientas de modelado',
    },
  });

  // ── V2 · Semestre III ───────────────────────────────────────────────────────
  const v2s3 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: currV2.id, number: 3 } },
    update: {},
    create: { tenantId: tid, curriculumId: currV2.id, number: 3, name: 'Semestre III' },
  });

  // CD:48 PE:16 → credits=4  ← se reutiliza en prerrequisito
  const v2s3FFR = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s3.id, code: 'FFR-301' } },
    update: { description: 'Componentes con React;Manejo de estado global;Consumo de APIs;Optimización de rendimiento' },
    create: {
      tenantId: tid, semesterId: v2s3.id,
      name: 'Frameworks Frontend',       code: 'FFR-301',
      credits: 4, hoursTheory: 48,       hoursPractice: 16,
      description: 'Componentes con React;Manejo de estado global;Consumo de APIs;Optimización de rendimiento',
    },
  });

  // CD:48 PE:16 → credits=4  ← se reutiliza en prerrequisito
  const v2s3FIA = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s3.id, code: 'FIA-301' } },
    update: { description: 'Agentes y búsqueda;Redes neuronales;Aprendizaje automático;Procesamiento de lenguaje' },
    create: {
      tenantId: tid, semesterId: v2s3.id,
      name: 'Fundamentos de Inteligencia Artificial', code: 'FIA-301',
      credits: 4, hoursTheory: 48,                    hoursPractice: 16,
      description: 'Agentes y búsqueda;Redes neuronales;Aprendizaje automático;Procesamiento de lenguaje',
    },
  });

  // CD:48 PE:16 → credits=4
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s3.id, code: 'ECE-301' } },
    update: { description: 'Sistemas ERP y CRM;Integración de software corporativo;Procesos de negocio;Arquitectura empresarial' },
    create: {
      tenantId: tid, semesterId: v2s3.id,
      name: 'Ecosistemas Corporativos Empresariales', code: 'ECE-301',
      credits: 4, hoursTheory: 48,                    hoursPractice: 16,
      description: 'Sistemas ERP y CRM;Integración de software corporativo;Procesos de negocio;Arquitectura empresarial',
    },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s3.id, code: 'MDS-301' } },
    update: { description: 'Modelado UML;Diseño arquitectónico;Principios de diseño;Patrones estructurales' },
    create: {
      tenantId: tid, semesterId: v2s3.id,
      name: 'Modelado y Diseño de Software', code: 'MDS-301',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Modelado UML;Diseño arquitectónico;Principios de diseño;Patrones estructurales',
    },
  });

  // CD:48 PE:16 → credits=4
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s3.id, code: 'SEI-301' } },
    update: { description: 'OWASP Top 10;Seguridad en APIs;Autenticación y autorización;Criptografía aplicada' },
    create: {
      tenantId: tid, semesterId: v2s3.id,
      name: 'Seguridad Informática',     code: 'SEI-301',
      credits: 4, hoursTheory: 48,       hoursPractice: 16,
      description: 'OWASP Top 10;Seguridad en APIs;Autenticación y autorización;Criptografía aplicada',
    },
  });

  // CD:48 PE:16 → credits=4
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s3.id, code: 'DVC-301' } },
    update: { description: 'Integración y despliegue continuo;Infraestructura como código;Docker y Kubernetes;Servicios en AWS/GCP' },
    create: {
      tenantId: tid, semesterId: v2s3.id,
      name: 'DevOps y Cloud',            code: 'DVC-301',
      credits: 4, hoursTheory: 48,       hoursPractice: 16,
      description: 'Integración y despliegue continuo;Infraestructura como código;Docker y Kubernetes;Servicios en AWS/GCP',
    },
  });

  // ── V2 · Semestre IV ────────────────────────────────────────────────────────
  const v2s4 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: currV2.id, number: 4 } },
    update: {},
    create: { tenantId: tid, curriculumId: currV2.id, number: 4, name: 'Semestre IV' },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s4.id, code: 'DGP-401' } },
    update: { description: 'Metodologías ágiles a escala;Presupuestos de proyectos;Gestión de stakeholders;Lanzamiento de producto' },
    create: {
      tenantId: tid, semesterId: v2s4.id,
      name: 'Diseño y Gestión de Proyectos Tecnológicos', code: 'DGP-401',
      credits: 3, hoursTheory: 32,                        hoursPractice: 16,
      description: 'Metodologías ágiles a escala;Presupuestos de proyectos;Gestión de stakeholders;Lanzamiento de producto',
    },
  });

  // CD:48 PE:16 → credits=4
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s4.id, code: 'FML-401' } },
    update: { description: 'Modelos de regresión;Algoritmos de clasificación;Algoritmos de clustering;Evaluación de modelos' },
    create: {
      tenantId: tid, semesterId: v2s4.id,
      name: 'Fundamentos de Machine Learning', code: 'FML-401',
      credits: 4, hoursTheory: 48,             hoursPractice: 16,
      description: 'Modelos de regresión;Algoritmos de clasificación;Algoritmos de clustering;Evaluación de modelos',
    },
  });

  // CD:64 PE:32 → credits=6  ← se reutiliza en prerrequisito
  const v2s4DMV = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s4.id, code: 'DMV-401' } },
    update: { description: 'Arquitectura de apps móviles;React Native o Flutter;Manejo de almacenamiento local;Publicación en tiendas' },
    create: {
      tenantId: tid, semesterId: v2s4.id,
      name: 'Desarrollo Móvil',          code: 'DMV-401',
      credits: 6, hoursTheory: 64,       hoursPractice: 32,
      description: 'Arquitectura de apps móviles;React Native o Flutter;Manejo de almacenamiento local;Publicación en tiendas',
    },
  });

  // CD:48 PE:16 → credits=4  ← se reutiliza en prerrequisito
  const v2s4DAI = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s4.id, code: 'DAI-401' } },
    update: { description: 'Prompts e ingeniería de prompts;Copilotos de programación;Automatización de código;Integración de APIs de IA' },
    create: {
      tenantId: tid, semesterId: v2s4.id,
      name: 'Desarrollo Asistido por IA', code: 'DAI-401',
      credits: 4, hoursTheory: 48,        hoursPractice: 16,
      description: 'Prompts e ingeniería de prompts;Copilotos de programación;Automatización de código;Integración de APIs de IA',
    },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s4.id, code: 'ARS-401' } },
    update: { description: 'Estilos arquitectónicos;Diseño guiado por el dominio (DDD);Manejo de microservicios;Monitoreo y observabilidad' },
    create: {
      tenantId: tid, semesterId: v2s4.id,
      name: 'Arquitectura de Software',  code: 'ARS-401',
      credits: 3, hoursTheory: 32,       hoursPractice: 16,
      description: 'Estilos arquitectónicos;Diseño guiado por el dominio (DDD);Manejo de microservicios;Monitoreo y observabilidad',
    },
  });

  // CD:32 PE:16 → credits=3
  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: v2s4.id, code: 'SIN-401' } },
    update: { description: 'Propuesta de proyecto;Construcción de portafolio;Proyecto integrador final;Presentación técnica' },
    create: {
      tenantId: tid, semesterId: v2s4.id,
      name: 'Seminario de Integración',  code: 'SIN-401',
      credits: 3, hoursTheory: 32,       hoursPractice: 16,
      description: 'Propuesta de proyecto;Construcción de portafolio;Proyecto integrador final;Presentación técnica',
    },
  });

  // ── V2 · Prerrequisitos ─────────────────────────────────────────────────────
  //  DWE-201  ← FPR-101
  //  BDII-201 ← BDI-101      (via v2s2BDII — aún sin asignar, buscamos por id)
  //  FBK-201  ← FPR-101
  //  FFR-301  ← DWE-201
  //  DMV-401  ← FBK-201
  //  DAI-401  ← FIA-301
  const v2s2BDII = await prisma.subject.findFirstOrThrow({
    where: { semesterId: v2s2.id, code: 'BDII-201' },
  });

  const v2Prerequisites = [
    { subjectId: v2s2DWE.id,  requiresId: v2s1FPR.id  },
    { subjectId: v2s2BDII.id, requiresId: v2s1BDI.id  },
    { subjectId: v2s2FBK.id,  requiresId: v2s1FPR.id  },
    { subjectId: v2s3FFR.id,  requiresId: v2s2DWE.id  },
    { subjectId: v2s4DMV.id,  requiresId: v2s2FBK.id  },
    { subjectId: v2s4DAI.id,  requiresId: v2s3FIA.id  },
  ];
  for (const p of v2Prerequisites) {
    await prisma.prerequisite.upsert({
      where: { subjectId_requiresId: { subjectId: p.subjectId, requiresId: p.requiresId } },
      update: {},
      create: { tenantId: tid, subjectId: p.subjectId, requiresId: p.requiresId },
    });
  }
  console.log('✅ Pensum 2024-2 (V2): 4 semestres · 24 materias · 6 prerrequisitos');

  // ══════════════════════════════════════════════════════════════════════════════
  // CAREER — Ingeniería de Software  (código IS, Facultad de Ingeniería FI)
  // ══════════════════════════════════════════════════════════════════════════════
  const careerIS = await prisma.career.upsert({
    where: { facultyId_code: { facultyId: facultyFE.id, code: 'IS' } },
    update: {},
    create: {
      tenantId: tid,
      facultyId: facultyFE.id,
      name: 'Ingeniería de Software',
      code: 'IS',
      description: 'Carrera orientada al diseño, construcción y evolución de sistemas de software de calidad',
    },
  });
  console.log('✅ Career IS:', careerIS.name);

  // ── Cleanup: eliminar IS huérfana bajo FTI (migrada a FI) ───────────────────
  const oldFTIISCareer = await prisma.career.findFirst({
    where: { facultyId: facultyFTI.id, code: 'IS' },
    include: { curricula: { include: { semesters: { include: { subjects: true } } } } },
  });
  if (oldFTIISCareer) {
    const subjectIds = oldFTIISCareer.curricula.flatMap(cur =>
      cur.semesters.flatMap(sem => sem.subjects.map(sub => sub.id))
    );
    if (subjectIds.length > 0) {
      await prisma.prerequisite.deleteMany({
        where: { OR: [{ subjectId: { in: subjectIds } }, { requiresId: { in: subjectIds } }] },
      });
      await prisma.subject.deleteMany({ where: { id: { in: subjectIds } } });
    }
    for (const cur of oldFTIISCareer.curricula) {
      await prisma.semester.deleteMany({ where: { curriculumId: cur.id } });
    }
    await prisma.curriculum.deleteMany({ where: { careerId: oldFTIISCareer.id } });
    await prisma.career.delete({ where: { id: oldFTIISCareer.id } });
    console.log(`  🧹 Cleaned old IS career under FTI: ${subjectIds.length} subjects removed`);
  }

  // ── Cleanup: eliminar datos huérfanos del pensum antiguo de 4 semestres ──────
  for (const version of ['2025-1', '2025-2']) {
    const oldCurr = await prisma.curriculum.findFirst({
      where: { careerId: careerIS.id, version },
      include: { semesters: { include: { subjects: true } } },
    });
    if (oldCurr) {
      const allSubjectIds = oldCurr.semesters.flatMap(s => s.subjects.map(sub => sub.id));
      if (allSubjectIds.length > 0) {
        await prisma.prerequisite.deleteMany({
          where: { OR: [{ subjectId: { in: allSubjectIds } }, { requiresId: { in: allSubjectIds } }] },
        });
        await prisma.subject.deleteMany({ where: { id: { in: allSubjectIds } } });
      }
      await prisma.semester.deleteMany({ where: { curriculumId: oldCurr.id } });
      console.log(`  🧹 Cleaned IS ${version}: ${allSubjectIds.length} subjects removed`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // IS PENSUM V1 — versión "2025-1"  ·  Malla Específica  (8 semestres)
  //
  // Matemáticas: S1=Álgebra Lineal · S2=Matemática Discreta · S3=Cálculo
  // Datos: S2=ED+BD Relacional(fusión+SQL) · S3=NoSQL · S4=Distribuidos+Spark
  // IA: S2=Fundamentos IA → S3=Machine Learning → S4=Deep Learning+IA Generativa
  // Frontend+HCI: S3 paralelo a Backend; S4=UX Avanzado
  // DevOps CI/CD+Contenedores: S4  (Cloud+K8s separado en S5)
  // Gobernanza → Auditoría, Gobernanza y Cumplimiento TI: S7
  // S8 = Titulación: diseño · implementación · defensa · portafolio
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('\n📗 Seeding IS Pensum 2025-1 (V1 Específico — 8 semestres)...');

  const isV1 = await prisma.curriculum.upsert({
    where: { careerId_version: { careerId: careerIS.id, version: '2025-1' } },
    update: {},
    create: {
      tenantId: tid,
      careerId: careerIS.id,
      version: '2025-1',
      name: 'Pensum Ingeniería de Software 2025-1',
      description: 'Malla específica de 8 semestres con nombres descriptivos por dominio tecnológico',
      status: 'ACTIVE',
    },
  });

  // ── IS-V1 · Semestre I — Bases Matemáticas y Computacionales ────────────────
  const isV1s1 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV1.id, number: 1 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV1.id, number: 1, name: 'Semestre I' },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s1.id, code: 'ALG-101' } },
    update: { description: 'Álgebra lineal: vectores, matrices, valores propios y aplicaciones en ML' },
    create: {
      tenantId: tid, semesterId: isV1s1.id,
      name: 'Álgebra Lineal',               code: 'ALG-101',
      credits: 3, hoursTheory: 32,          hoursPractice: 16,
      description: 'Álgebra lineal: vectores, matrices, valores propios y aplicaciones en ML',
    },
  });

  const isV1s1FPR = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s1.id, code: 'FPR-101' } },
    update: { description: 'Algoritmos, estructuras de control, arreglos y programación con Python' },
    create: {
      tenantId: tid, semesterId: isV1s1.id,
      name: 'Fundamentos de Programación',  code: 'FPR-101',
      credits: 4, hoursTheory: 48,          hoursPractice: 16,
      description: 'Algoritmos, estructuras de control, arreglos y programación con Python',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s1.id, code: 'SOP-101' } },
    update: { description: 'Procesos, memoria, sistema de archivos, virtualización y administración Linux' },
    create: {
      tenantId: tid, semesterId: isV1s1.id,
      name: 'Sistemas Operativos',          code: 'SOP-101',
      credits: 3, hoursTheory: 32,          hoursPractice: 16,
      description: 'Procesos, memoria, sistema de archivos, virtualización y administración Linux',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s1.id, code: 'EPD-101' } },
    update: { description: 'Git, terminal, shell scripting, IDEs, linters y documentación técnica' },
    create: {
      tenantId: tid, semesterId: isV1s1.id,
      name: 'Entorno Profesional de Desarrollo', code: 'EPD-101',
      credits: 3, hoursTheory: 32,               hoursPractice: 16,
      description: 'Git, terminal, shell scripting, IDEs, linters y documentación técnica',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s1.id, code: 'CTE-101' } },
    update: { description: 'Redacción técnica, documentación de APIs y comunicación en equipos ágiles' },
    create: {
      tenantId: tid, semesterId: isV1s1.id,
      name: 'Comunicación Técnica',          code: 'CTE-101',
      credits: 2, hoursTheory: 32,           hoursPractice: 0,
      description: 'Redacción técnica, documentación de APIs y comunicación en equipos ágiles',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s1.id, code: 'GET-101' } },
    update: { description: 'Modelos de negocio TI, gestión financiera, propiedad intelectual y ética' },
    create: {
      tenantId: tid, semesterId: isV1s1.id,
      name: 'Gestión y Emprendimiento TI',   code: 'GET-101',
      credits: 2, hoursTheory: 32,           hoursPractice: 0,
      description: 'Modelos de negocio TI, gestión financiera, propiedad intelectual y ética',
    },
  });

  // ── IS-V1 · Semestre II — Core de Ingeniería de Software ────────────────────
  const isV1s2 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV1.id, number: 2 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV1.id, number: 2, name: 'Semestre II' },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s2.id, code: 'MDI-201' } },
    update: { description: 'Lógica, conjuntos, grafos, combinatoria y probabilidad discreta' },
    create: {
      tenantId: tid, semesterId: isV1s2.id,
      name: 'Matemática Discreta',           code: 'MDI-201',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Lógica, conjuntos, grafos, combinatoria y probabilidad discreta',
    },
  });

  const isV1s2EBD = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s2.id, code: 'EBD-201' } },
    update: { description: 'Estructuras de datos, modelado relacional, SQL avanzado y stored procedures' },
    create: {
      tenantId: tid, semesterId: isV1s2.id,
      name: 'Estructuras de Datos y Bases de Datos Relacionales', code: 'EBD-201',
      credits: 4, hoursTheory: 48,                    hoursPractice: 16,
      description: 'Estructuras de datos, modelado relacional, SQL avanzado y stored procedures',
    },
  });

  const isV1s2POO = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s2.id, code: 'POO-201' } },
    update: { description: 'Herencia, polimorfismo, patrones GoF, principios SOLID y TDD' },
    create: {
      tenantId: tid, semesterId: isV1s2.id,
      name: 'Programación Orientada a Objetos', code: 'POO-201',
      credits: 4, hoursTheory: 48,              hoursPractice: 16,
      description: 'Herencia, polimorfismo, patrones GoF, principios SOLID y TDD',
    },
  });

  const isV1s2FIA = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s2.id, code: 'FIA-201' } },
    update: { description: 'Agentes inteligentes, búsqueda heurística, sistemas expertos y lógica difusa' },
    create: {
      tenantId: tid, semesterId: isV1s2.id,
      name: 'Fundamentos de Inteligencia Artificial', code: 'FIA-201',
      credits: 3, hoursTheory: 32,                    hoursPractice: 16,
      description: 'Agentes inteligentes, búsqueda heurística, sistemas expertos y lógica difusa',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s2.id, code: 'RYC-201' } },
    update: { description: 'Modelo OSI, TCP/IP, protocolos HTTP/S, DNS, SSH y seguridad de redes' },
    create: {
      tenantId: tid, semesterId: isV1s2.id,
      name: 'Redes y Conectividad',           code: 'RYC-201',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Modelo OSI, TCP/IP, protocolos HTTP/S, DNS, SSH y seguridad de redes',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s2.id, code: 'IAS-201' } },
    update: { description: 'Elicitación, modelado de requisitos, priorización y trazabilidad' },
    create: {
      tenantId: tid, semesterId: isV1s2.id,
      name: 'Ingeniería y Análisis de Requisitos', code: 'IAS-201',
      credits: 3, hoursTheory: 32,                 hoursPractice: 16,
      description: 'Elicitación, modelado de requisitos, priorización y trazabilidad',
    },
  });

  // ── IS-V1 · Semestre III — Desarrollo Avanzado ──────────────────────────────
  const isV1s3 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV1.id, number: 3 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV1.id, number: 3, name: 'Semestre III' },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s3.id, code: 'CDI-301' } },
    update: { description: 'Límites, derivadas, integrales, optimización y series de Taylor' },
    create: {
      tenantId: tid, semesterId: isV1s3.id,
      name: 'Cálculo Diferencial e Integral', code: 'CDI-301',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Límites, derivadas, integrales, optimización y series de Taylor',
    },
  });

  const isV1s3NSL = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s3.id, code: 'NSL-301' } },
    update: { description: 'MongoDB, Redis, Cassandra, teorema CAP y selección SQL vs NoSQL' },
    create: {
      tenantId: tid, semesterId: isV1s3.id,
      name: 'Bases de Datos NoSQL', code: 'NSL-301',
      credits: 3, hoursTheory: 48,            hoursPractice: 0,
      description: 'MongoDB, Redis, Cassandra, teorema CAP y selección SQL vs NoSQL',
    },
  });

  const isV1s3DBA = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s3.id, code: 'DBA-301' } },
    update: { description: 'APIs REST, NestJS, JWT/OAuth2 y prevención de inyección SQL' },
    create: {
      tenantId: tid, semesterId: isV1s3.id,
      name: 'Desarrollo Backend y APIs',      code: 'DBA-301',
      credits: 4, hoursTheory: 48,            hoursPractice: 16,
      description: 'APIs REST, NestJS, JWT/OAuth2 y prevención de inyección SQL',
    },
  });

  const isV1s3FHC = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s3.id, code: 'FHC-301' } },
    update: { description: 'React, HCI, prototipado en Figma, accesibilidad WCAG y pruebas de usabilidad' },
    create: {
      tenantId: tid, semesterId: isV1s3.id,
      name: 'Desarrollo Frontend e Interacción HCI', code: 'FHC-301',
      credits: 4, hoursTheory: 48,                   hoursPractice: 16,
      description: 'React, HCI, prototipado en Figma, accesibilidad WCAG y pruebas de usabilidad',
    },
  });

  const isV1s3MLC = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s3.id, code: 'MLC-301' } },
    update: { description: 'Regresión, árboles, clustering, validación cruzada y selección de modelos' },
    create: {
      tenantId: tid, semesterId: isV1s3.id,
      name: 'Machine Learning',               code: 'MLC-301',
      credits: 4, hoursTheory: 48,            hoursPractice: 16,
      description: 'Regresión, árboles, clustering, validación cruzada y selección de modelos',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s3.id, code: 'SDS-301' } },
    update: { description: 'OWASP Top 10, TLS, autenticación multifactor y DevSecOps en CI/CD' },
    create: {
      tenantId: tid, semesterId: isV1s3.id,
      name: 'Seguridad en Desarrollo de Software', code: 'SDS-301',
      credits: 3, hoursTheory: 48,                 hoursPractice: 0,
      description: 'OWASP Top 10, TLS, autenticación multifactor y DevSecOps en CI/CD',
    },
  });

  // ── IS-V1 · Semestre IV — Especialización ───────────────────────────────────
  const isV1s4 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV1.id, number: 4 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV1.id, number: 4, name: 'Semestre IV' },
  });

  const isV1s4BSD = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s4.id, code: 'BSD-401' } },
    update: { description: 'Hadoop, Spark, Kafka, Data Lakes y arquitecturas Lambda/Kappa' },
    create: {
      tenantId: tid, semesterId: isV1s4.id,
      name: 'Big Data y Procesamiento Distribuido', code: 'BSD-401',
      credits: 4, hoursTheory: 48,                    hoursPractice: 16,
      description: 'Hadoop, Spark, Kafka, Data Lakes y arquitecturas Lambda/Kappa',
    },
  });

  const isV1s4DVA = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s4.id, code: 'DVA-401' } },
    update: { description: 'GraphQL, WebSockets, optimización frontend, i18n, accesibilidad y PWA' },
    create: {
      tenantId: tid, semesterId: isV1s4.id,
      name: 'Aplicaciones Web Avanzadas',    code: 'DVA-401',
      credits: 4, hoursTheory: 48,           hoursPractice: 16,
      description: 'GraphQL, WebSockets, optimización frontend, i18n, accesibilidad y PWA',
    },
  });

  const isV1s4DLG = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s4.id, code: 'DLG-401' } },
    update: { description: 'Redes neuronales, Transformers, modelos generativos, LLMs y RAG' },
    create: {
      tenantId: tid, semesterId: isV1s4.id,
      name: 'Deep Learning e IA Generativa',  code: 'DLG-401',
      credits: 4, hoursTheory: 48,            hoursPractice: 16,
      description: 'Redes neuronales, Transformers, modelos generativos, LLMs y RAG',
    },
  });

  const isV1s4UXA = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s4.id, code: 'UXA-401' } },
    update: { description: 'Investigación de usuarios, sistemas de diseño y auditoría de accesibilidad' },
    create: {
      tenantId: tid, semesterId: isV1s4.id,
      name: 'UX Avanzado y Accesibilidad',    code: 'UXA-401',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Investigación de usuarios, sistemas de diseño y auditoría de accesibilidad',
    },
  });

  const isV1s4DOP = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s4.id, code: 'DOP-401' } },
    update: { description: 'CI/CD con GitHub Actions, Docker, estrategias de despliegue y monitoreo' },
    create: {
      tenantId: tid, semesterId: isV1s4.id,
      name: 'DevOps, CI/CD y Contenedores',  code: 'DOP-401',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'CI/CD con GitHub Actions, Docker, estrategias de despliegue y monitoreo',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s4.id, code: 'DSI-401' } },
    update: { description: 'Modelado BPMN, UML, integración de sistemas y evaluación de viabilidad' },
    create: {
      tenantId: tid, semesterId: isV1s4.id,
      name: 'Diseño de Sistemas de Información', code: 'DSI-401',
      credits: 3, hoursTheory: 32,               hoursPractice: 16,
      description: 'Modelado BPMN, UML, integración de sistemas y evaluación de viabilidad',
    },
  });

  // ── IS-V1 · Semestre V — Arquitectura y Sistemas ─────────────────────────────
  const isV1s5 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV1.id, number: 5 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV1.id, number: 5, name: 'Semestre V' },
  });

  const isV1s5ARS = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s5.id, code: 'ARS-501' } },
    update: { description: 'Microservicios, DDD, CQRS, Event Sourcing y observabilidad distribuida' },
    create: {
      tenantId: tid, semesterId: isV1s5.id,
      name: 'Arquitectura de Software',       code: 'ARS-501',
      credits: 4, hoursTheory: 48,            hoursPractice: 16,
      description: 'Microservicios, DDD, CQRS, Event Sourcing y observabilidad distribuida',
    },
  });

  const isV1s5CCN = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s5.id, code: 'CCN-501' } },
    update: { description: 'AWS/GCP/Azure, Kubernetes, Terraform e infraestructura cloud-native' },
    create: {
      tenantId: tid, semesterId: isV1s5.id,
      name: 'Computación en la Nube',              code: 'CCN-501',
      credits: 3, hoursTheory: 32,                 hoursPractice: 16,
      description: 'AWS/GCP/Azure, Kubernetes, Terraform e infraestructura cloud-native',
    },
  });

  const isV1s5BIV = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s5.id, code: 'BIV-501' } },
    update: { description: 'Data Warehouses, ETL/ELT con dbt, dashboards y métricas de negocio' },
    create: {
      tenantId: tid, semesterId: isV1s5.id,
      name: 'Business Intelligence y Visualización', code: 'BIV-501',
      credits: 3, hoursTheory: 48,                   hoursPractice: 0,
      description: 'Data Warehouses, ETL/ELT con dbt, dashboards y métricas de negocio',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s5.id, code: 'CAL-501' } },
    update: { description: 'Pruebas unitarias, E2E, TDD/BDD, carga con k6 e ISO 25010' },
    create: {
      tenantId: tid, semesterId: isV1s5.id,
      name: 'Calidad y Pruebas de Software',  code: 'CAL-501',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Pruebas unitarias, E2E, TDD/BDD, carga con k6 e ISO 25010',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s5.id, code: 'MOV-501' } },
    update: { description: 'React Native y Flutter con APIs, notificaciones y publicación en tiendas' },
    create: {
      tenantId: tid, semesterId: isV1s5.id,
      name: 'Desarrollo de Aplicaciones Móviles', code: 'MOV-501',
      credits: 3, hoursTheory: 32,                hoursPractice: 16,
      description: 'React Native y Flutter con APIs, notificaciones y publicación en tiendas',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s5.id, code: 'GPR-501' } },
    update: { description: 'PMBOK, marcos ágiles escalados, OKRs y gestión de portafolio TI' },
    create: {
      tenantId: tid, semesterId: isV1s5.id,
      name: 'Gestión de Proyectos TI',        code: 'GPR-501',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'PMBOK, marcos ágiles escalados, OKRs y gestión de portafolio TI',
    },
  });

  // ── IS-V1 · Semestre VI — Especialidades y Electivas ─────────────────────────
  const isV1s6 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV1.id, number: 6 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV1.id, number: 6, name: 'Semestre VI' },
  });

  const isV1s6MSV = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s6.id, code: 'MSV-601' } },
    update: { description: 'Descomposición en microservicios, service mesh, resiliencia y mensajería asíncrona' },
    create: {
      tenantId: tid, semesterId: isV1s6.id,
      name: 'Microservicios y Sistemas Distribuidos', code: 'MSV-601',
      credits: 4, hoursTheory: 48,                    hoursPractice: 16,
      description: 'Descomposición en microservicios, service mesh, resiliencia y mensajería asíncrona',
    },
  });

  const isV1s6IAA = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s6.id, code: 'IAA-601' } },
    update: { description: 'Fine-tuning de LLMs, RAG con bases vectoriales, agentes autónomos y MLOps' },
    create: {
      tenantId: tid, semesterId: isV1s6.id,
      name: 'IA Aplicada y LLMs',            code: 'IAA-601',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Fine-tuning de LLMs, RAG con bases vectoriales, agentes autónomos y MLOps',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s6.id, code: 'IOT-601' } },
    update: { description: 'Microcontroladores, protocolos IoT, plataformas cloud y edge computing' },
    create: {
      tenantId: tid, semesterId: isV1s6.id,
      name: 'Sistemas Embebidos e IoT',       code: 'IOT-601',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Microcontroladores, protocolos IoT, plataformas cloud y edge computing',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s6.id, code: 'VJG-601' } },
    update: { description: 'Videojuegos con Unity/Godot, gráficos 3D, física y experiencias AR/VR' },
    create: {
      tenantId: tid, semesterId: isV1s6.id,
      name: 'Videojuegos y Gráficos Computacionales', code: 'VJG-601',
      credits: 3, hoursTheory: 32,                    hoursPractice: 16,
      description: 'Videojuegos con Unity/Godot, gráficos 3D, física y experiencias AR/VR',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s6.id, code: 'VRS-601' } },
    update: { name: 'Usabilidad y Accesibilidad', description: 'Heurísticas Nielsen, evaluación con usuarios, WCAG 2.2 y métricas SUS/NPS' },
    create: {
      tenantId: tid, semesterId: isV1s6.id,
      name: 'Usabilidad y Accesibilidad',             code: 'VRS-601',
      credits: 3, hoursTheory: 32,                   hoursPractice: 16,
      description: 'Heurísticas Nielsen, evaluación con usuarios, WCAG 2.2 y métricas SUS/NPS',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s6.id, code: 'EL1-601' } },
    update: { description: 'Computación cuántica, algoritmos de Shor/Grover y criptografía post-cuántica' },
    create: {
      tenantId: tid, semesterId: isV1s6.id,
      name: 'Computación Cuántica y Criptografía Avanzada', code: 'EL1-601',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Computación cuántica, algoritmos de Shor/Grover y criptografía post-cuántica',
    },
  });

  // ── IS-V1 · Semestre VII — Gobernanza y Ejercicio Profesional ────────────────
  const isV1s7 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV1.id, number: 7 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV1.id, number: 7, name: 'Semestre VII' },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s7.id, code: 'AGC-701' } },
    update: { description: 'Gobierno de datos, GDPR, COBIT 2019, ISO 27001 y continuidad del negocio' },
    create: {
      tenantId: tid, semesterId: isV1s7.id,
      name: 'Auditoría, Gobernanza y Cumplimiento TI', code: 'AGC-701',
      credits: 3, hoursTheory: 48,                     hoursPractice: 0,
      description: 'Gobierno de datos, GDPR, COBIT 2019, ISO 27001 y continuidad del negocio',
    },
  });

  const isV1s7RPA = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s7.id, code: 'RPA-701' } },
    update: { description: 'RPA con UiPath, automatización inteligente con NLP/OCR y minería de procesos' },
    create: {
      tenantId: tid, semesterId: isV1s7.id,
      name: 'Automatización Robótica de Procesos', code: 'RPA-701',
      credits: 3, hoursTheory: 32,                 hoursPractice: 16,
      description: 'RPA con UiPath, automatización inteligente con NLP/OCR y minería de procesos',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s7.id, code: 'GPE-701' } },
    update: { description: 'Marca personal, Lean Startup, negociación, pitch y product-market fit' },
    create: {
      tenantId: tid, semesterId: isV1s7.id,
      name: 'Gestión Profesional y Emprendimiento', code: 'GPE-701',
      credits: 2, hoursTheory: 32,                  hoursPractice: 0,
      description: 'Marca personal, Lean Startup, negociación, pitch y product-market fit',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s7.id, code: 'EEP-701' } },
    update: { description: 'Ética en IA, códigos ACM/IEEE, green computing e inclusión digital' },
    create: {
      tenantId: tid, semesterId: isV1s7.id,
      name: 'Ética y Responsabilidad Profesional', code: 'EEP-701',
      credits: 2, hoursTheory: 32,                  hoursPractice: 0,
      description: 'Ética en IA, códigos ACM/IEEE, green computing e inclusión digital',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s7.id, code: 'EL2-701' } },
    update: { description: 'Blockchain, smart contracts con Solidity, DeFi, NFTs y Hyperledger Fabric' },
    create: {
      tenantId: tid, semesterId: isV1s7.id,
      name: 'Blockchain y Sistemas Descentralizados',      code: 'EL2-701',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Blockchain, smart contracts con Solidity, DeFi, NFTs y Hyperledger Fabric',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s7.id, code: 'PRC-701' } },
    update: { description: 'Práctica profesional de 320 horas con informe y evaluación 360°' },
    create: {
      tenantId: tid, semesterId: isV1s7.id,
      name: 'Práctica Profesional',           code: 'PRC-701',
      credits: 3, hoursTheory: 0,             hoursPractice: 48,
      description: 'Práctica profesional de 320 horas con informe y evaluación 360°',
    },
  });

  // ── IS-V1 · Semestre VIII — Titulación ──────────────────────────────────────
  const isV1s8 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV1.id, number: 8 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV1.id, number: 8, name: 'Semestre VIII' },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s8.id, code: 'DTI-801' } },
    update: { name: 'Integración de Sistemas', description: 'Integración empresarial: ESB, API Gateway, ETL/ELT y seguridad OAuth2/JWT' },
    create: {
      tenantId: tid, semesterId: isV1s8.id,
      name: 'Integración de Sistemas',          code: 'DTI-801',
      credits: 3, hoursTheory: 32,              hoursPractice: 16,
      description: 'Integración empresarial: ESB, API Gateway, ETL/ELT y seguridad OAuth2/JWT',
    },
  });

  const isV1s8IMP = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s8.id, code: 'IMP-801' } },
    update: { name: 'Trabajo de Titulación', description: 'Propuesta técnica, desarrollo iterativo, pruebas de aceptación y defensa oral' },
    create: {
      tenantId: tid, semesterId: isV1s8.id,
      name: 'Trabajo de Titulación',                    code: 'IMP-801',
      credits: 4, hoursTheory: 48,                       hoursPractice: 16,
      description: 'Propuesta técnica, desarrollo iterativo, pruebas de aceptación y defensa oral',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s8.id, code: 'DEF-801' } },
    update: { name: 'Procesos de Software', description: 'Modelos de proceso, mejora CMMI, gestión de configuración y code reviews' },
    create: {
      tenantId: tid, semesterId: isV1s8.id,
      name: 'Procesos de Software',           code: 'DEF-801',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Modelos de proceso, mejora CMMI, gestión de configuración y code reviews',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s8.id, code: 'SEM-801' } },
    update: { name: 'Auditoría Informática', description: 'Auditoría TI con COBIT 2019, controles internos y cumplimiento normativo' },
    create: {
      tenantId: tid, semesterId: isV1s8.id,
      name: 'Auditoría Informática',          code: 'SEM-801',
      credits: 2, hoursTheory: 32,            hoursPractice: 0,
      description: 'Auditoría TI con COBIT 2019, controles internos y cumplimiento normativo',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s8.id, code: 'POR-801' } },
    update: { name: 'Profesionalismo en Informática', description: 'Ética ACM/IEEE, marca personal, liderazgo técnico y marco legal del software' },
    create: {
      tenantId: tid, semesterId: isV1s8.id,
      name: 'Profesionalismo en Informática', code: 'POR-801',
      credits: 2, hoursTheory: 32,            hoursPractice: 0,
      description: 'Ética ACM/IEEE, marca personal, liderazgo técnico y marco legal del software',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV1s8.id, code: 'EMP-801' } },
    update: { description: 'Design Thinking, Business Model Canvas, financiamiento y go-to-market' },
    create: {
      tenantId: tid, semesterId: isV1s8.id,
      name: 'Emprendimiento Tecnológico',     code: 'EMP-801',
      credits: 2, hoursTheory: 32,            hoursPractice: 0,
      description: 'Design Thinking, Business Model Canvas, financiamiento y go-to-market',
    },
  });

  // ── IS-V1 · Prerrequisitos ───────────────────────────────────────────────────
  //  S2: EBD-201 ← FPR-101 · POO-201 ← FPR-101
  //  S3: NSL-301 ← EBD-201 · DBA-301 ← POO-201 · FHC-301 ← POO-201 · MLC-301 ← FIA-201
  //  S4: BSD-401 ← NSL-301 · DVA-401 ← DBA-301 · DLG-401 ← MLC-301 · UXA-401 ← FHC-301
  //  S5: ARS-501 ← DVA-401 · CCN-501 ← DOP-401 · BIV-501 ← BSD-401
  //  S6: MSV-601 ← ARS-501 · IAA-601 ← DLG-401
  //  S7: RPA-701 ← IAA-601
  //  S8: IMP-801 ← ARS-501
  const isV1PrereqsFull = [
    { subjectId: isV1s2EBD.id, requiresId: isV1s1FPR.id  },
    { subjectId: isV1s2POO.id, requiresId: isV1s1FPR.id  },
    { subjectId: isV1s3NSL.id, requiresId: isV1s2EBD.id  },
    { subjectId: isV1s3DBA.id, requiresId: isV1s2POO.id  },
    { subjectId: isV1s3FHC.id, requiresId: isV1s2POO.id  },
    { subjectId: isV1s3MLC.id, requiresId: isV1s2FIA.id  },
    { subjectId: isV1s4BSD.id, requiresId: isV1s3NSL.id  },
    { subjectId: isV1s4DVA.id, requiresId: isV1s3DBA.id  },
    { subjectId: isV1s4DLG.id, requiresId: isV1s3MLC.id  },
    { subjectId: isV1s4UXA.id, requiresId: isV1s3FHC.id  },
    { subjectId: isV1s5ARS.id, requiresId: isV1s4DVA.id  },
    { subjectId: isV1s5CCN.id, requiresId: isV1s4DOP.id  },
    { subjectId: isV1s5BIV.id, requiresId: isV1s4BSD.id  },
    { subjectId: isV1s6MSV.id, requiresId: isV1s5ARS.id  },
    { subjectId: isV1s6IAA.id, requiresId: isV1s4DLG.id  },
    { subjectId: isV1s7RPA.id, requiresId: isV1s6IAA.id  },
    { subjectId: isV1s8IMP.id, requiresId: isV1s5ARS.id  },
  ];
  for (const p of isV1PrereqsFull) {
    await prisma.prerequisite.upsert({
      where: { subjectId_requiresId: { subjectId: p.subjectId, requiresId: p.requiresId } },
      update: {},
      create: { tenantId: tid, subjectId: p.subjectId, requiresId: p.requiresId },
    });
  }
  console.log('✅ IS Pensum 2025-1 (V1 Específico): 8 semestres · 48 materias · 17 prerrequisitos');

  // ══════════════════════════════════════════════════════════════════════════════
  // IS PENSUM V2 — versión "2025-2"  ·  Malla Genérica (estilo EPN)  8 semestres
  //
  // Misma estructura que V1 pero con nomenclatura académica genérica
  // (Programación I/II/III, Bases de Datos I/II, Inteligencia Artificial I/II/III)
  // ══════════════════════════════════════════════════════════════════════════════
  console.log('\n📘 Seeding IS Pensum 2025-2 (V2 Genérico — 8 semestres)...');

  const isV2 = await prisma.curriculum.upsert({
    where: { careerId_version: { careerId: careerIS.id, version: '2025-2' } },
    update: {},
    create: {
      tenantId: tid,
      careerId: careerIS.id,
      version: '2025-2',
      name: 'Pensum Ingeniería de Software 2025-2',
      description: 'Malla de 8 semestres con nomenclatura académica genérica (estilo politécnico)',
      status: 'ACTIVE',
    },
  });

  // ── IS-V2 · Semestre I — Ciclo Básico I ─────────────────────────────────────
  const isV2s1 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV2.id, number: 1 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV2.id, number: 1, name: 'Semestre I' },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s1.id, code: 'ALG-101' } },
    update: { description: 'Espacios vectoriales, matrices, transformaciones lineales y valores propios' },
    create: {
      tenantId: tid, semesterId: isV2s1.id,
      name: 'Álgebra Lineal',               code: 'ALG-101',
      credits: 3, hoursTheory: 32,          hoursPractice: 16,
      description: 'Espacios vectoriales, matrices, transformaciones lineales y valores propios',
    },
  });

  const isV2s1PRG = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s1.id, code: 'PRG-101' } },
    update: { description: 'Algoritmos, variables, estructuras de control y subprogramas básicos' },
    create: {
      tenantId: tid, semesterId: isV2s1.id,
      name: 'Programación I',               code: 'PRG-101',
      credits: 4, hoursTheory: 48,          hoursPractice: 16,
      description: 'Algoritmos, variables, estructuras de control y subprogramas básicos',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s1.id, code: 'SOP-101' } },
    update: { description: 'Procesos, memoria, archivos, permisos y virtualización en sistemas operativos' },
    create: {
      tenantId: tid, semesterId: isV2s1.id,
      name: 'Sistemas Operativos',          code: 'SOP-101',
      credits: 3, hoursTheory: 32,          hoursPractice: 16,
      description: 'Procesos, memoria, archivos, permisos y virtualización en sistemas operativos',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s1.id, code: 'INC-101' } },
    update: { description: 'Historia de la computación, representación de datos, terminal y Git' },
    create: {
      tenantId: tid, semesterId: isV2s1.id,
      name: 'Introducción a la Computación', code: 'INC-101',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Historia de la computación, representación de datos, terminal y Git',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s1.id, code: 'COE-101' } },
    update: { description: 'Escritura académica, oratoria, comunicación asertiva y documentación' },
    create: {
      tenantId: tid, semesterId: isV2s1.id,
      name: 'Comunicación Oral y Escrita',   code: 'COE-101',
      credits: 2, hoursTheory: 32,           hoursPractice: 0,
      description: 'Escritura académica, oratoria, comunicación asertiva y documentación',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s1.id, code: 'STE-101' } },
    update: { description: 'Impacto social de la tecnología, modelos de negocio y ética profesional' },
    create: {
      tenantId: tid, semesterId: isV2s1.id,
      name: 'Sociedad, Tecnología y Empresa', code: 'STE-101',
      credits: 2, hoursTheory: 32,            hoursPractice: 0,
      description: 'Impacto social de la tecnología, modelos de negocio y ética profesional',
    },
  });

  // ── IS-V2 · Semestre II — Ciclo Básico II ───────────────────────────────────
  const isV2s2 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV2.id, number: 2 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV2.id, number: 2, name: 'Semestre II' },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s2.id, code: 'MAD-201' } },
    update: { description: 'Lógica proposicional, conjuntos, grafos y probabilidad discreta' },
    create: {
      tenantId: tid, semesterId: isV2s2.id,
      name: 'Matemáticas Discretas',         code: 'MAD-201',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Lógica proposicional, conjuntos, grafos y probabilidad discreta',
    },
  });

  const isV2s2EDA = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s2.id, code: 'EDA-201' } },
    update: { description: 'Estructuras de datos, modelado relacional, SQL y algoritmos de búsqueda' },
    create: {
      tenantId: tid, semesterId: isV2s2.id,
      name: 'Bases de Datos I',                code: 'EDA-201',
      credits: 4, hoursTheory: 48,              hoursPractice: 16,
      description: 'Estructuras de datos, modelado relacional, SQL y algoritmos de búsqueda',
    },
  });

  const isV2s2PRG2 = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s2.id, code: 'PRG-201' } },
    update: { description: 'POO: herencia, polimorfismo, patrones GoF y pruebas unitarias' },
    create: {
      tenantId: tid, semesterId: isV2s2.id,
      name: 'Programación II',               code: 'PRG-201',
      credits: 4, hoursTheory: 48,           hoursPractice: 16,
      description: 'POO: herencia, polimorfismo, patrones GoF y pruebas unitarias',
    },
  });

  const isV2s2IAI1 = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s2.id, code: 'IAI-201' } },
    update: { description: 'Agentes inteligentes, búsqueda informada, sistemas expertos y planificación' },
    create: {
      tenantId: tid, semesterId: isV2s2.id,
      name: 'Inteligencia Artificial I',     code: 'IAI-201',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Agentes inteligentes, búsqueda informada, sistemas expertos y planificación',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s2.id, code: 'ISW-201' } },
    update: { description: 'Ciclo de vida, Scrum/Kanban, CI/CD y control de versiones' },
    create: {
      tenantId: tid, semesterId: isV2s2.id,
      name: 'Ingeniería de Software I',      code: 'ISW-201',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Ciclo de vida, Scrum/Kanban, CI/CD y control de versiones',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s2.id, code: 'FRE-201' } },
    update: { description: 'Modelo OSI, TCP/IP, direccionamiento IP y servicios HTTP/S y DNS' },
    create: {
      tenantId: tid, semesterId: isV2s2.id,
      name: 'Fundamentos de Redes',          code: 'FRE-201',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Modelo OSI, TCP/IP, direccionamiento IP y servicios HTTP/S y DNS',
    },
  });

  // ── IS-V2 · Semestre III — Ciclo Profesional I ──────────────────────────────
  const isV2s3 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV2.id, number: 3 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV2.id, number: 3, name: 'Semestre III' },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s3.id, code: 'CDI-301' } },
    update: { description: 'Límites, derivadas, integrales, optimización y series de Taylor' },
    create: {
      tenantId: tid, semesterId: isV2s3.id,
      name: 'Cálculo Diferencial e Integral', code: 'CDI-301',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Límites, derivadas, integrales, optimización y series de Taylor',
    },
  });

  const isV2s3BD1 = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s3.id, code: 'BDI-301' } },
    update: { description: 'MongoDB, Redis, Cassandra, teorema CAP y selección NoSQL' },
    create: {
      tenantId: tid, semesterId: isV2s3.id,
      name: 'Bases de Datos II',             code: 'BDI-301',
      credits: 3, hoursTheory: 48,           hoursPractice: 0,
      description: 'MongoDB, Redis, Cassandra, teorema CAP y selección NoSQL',
    },
  });

  const isV2s3PRG3 = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s3.id, code: 'PRG-301' } },
    update: { description: 'APIs REST, ORM, JWT/OAuth2 y autorización por roles' },
    create: {
      tenantId: tid, semesterId: isV2s3.id,
      name: 'Programación III',              code: 'PRG-301',
      credits: 4, hoursTheory: 48,           hoursPractice: 16,
      description: 'APIs REST, ORM, JWT/OAuth2 y autorización por roles',
    },
  });

  const isV2s3IUS = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s3.id, code: 'IUS-301' } },
    update: { description: 'Interfaces modernas, accesibilidad WCAG, Figma y pruebas de usabilidad' },
    create: {
      tenantId: tid, semesterId: isV2s3.id,
      name: 'Interfaces de Usuario',         code: 'IUS-301',
      credits: 4, hoursTheory: 48,           hoursPractice: 16,
      description: 'Interfaces modernas, accesibilidad WCAG, Figma y pruebas de usabilidad',
    },
  });

  const isV2s3IAI2 = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s3.id, code: 'IAI-301' } },
    update: { description: 'Aprendizaje supervisado, clustering, validación cruzada y métricas' },
    create: {
      tenantId: tid, semesterId: isV2s3.id,
      name: 'Inteligencia Artificial II',    code: 'IAI-301',
      credits: 4, hoursTheory: 48,           hoursPractice: 16,
      description: 'Aprendizaje supervisado, clustering, validación cruzada y métricas',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s3.id, code: 'SEI-301' } },
    update: { description: 'Criptografía, OWASP Top 10, auditoría de código e ISO 27001' },
    create: {
      tenantId: tid, semesterId: isV2s3.id,
      name: 'Seguridad Informática',         code: 'SEI-301',
      credits: 3, hoursTheory: 48,           hoursPractice: 0,
      description: 'Criptografía, OWASP Top 10, auditoría de código e ISO 27001',
    },
  });

  // ── IS-V2 · Semestre IV — Ciclo Profesional II ──────────────────────────────
  const isV2s4 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV2.id, number: 4 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV2.id, number: 4, name: 'Semestre IV' },
  });

  const isV2s4BD2 = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s4.id, code: 'BDI-401' } },
    update: { description: 'Hadoop, Spark, Kafka, Data Lakes y arquitecturas Lambda/Kappa' },
    create: {
      tenantId: tid, semesterId: isV2s4.id,
      name: 'Bases de Datos III',            code: 'BDI-401',
      credits: 4, hoursTheory: 48,           hoursPractice: 16,
      description: 'Hadoop, Spark, Kafka, Data Lakes y arquitecturas Lambda/Kappa',
    },
  });

  const isV2s4PRG4 = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s4.id, code: 'PRG-401' } },
    update: { description: 'Full-stack avanzado, GraphQL, WebSockets y optimización de rendimiento' },
    create: {
      tenantId: tid, semesterId: isV2s4.id,
      name: 'Programación IV',               code: 'PRG-401',
      credits: 4, hoursTheory: 48,           hoursPractice: 16,
      description: 'Full-stack avanzado, GraphQL, WebSockets y optimización de rendimiento',
    },
  });

  const isV2s4IAI3 = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s4.id, code: 'IAI-401' } },
    update: { description: 'CNNs, Transformers, modelos generativos y despliegue en producción' },
    create: {
      tenantId: tid, semesterId: isV2s4.id,
      name: 'Inteligencia Artificial III',   code: 'IAI-401',
      credits: 4, hoursTheory: 48,           hoursPractice: 16,
      description: 'CNNs, Transformers, modelos generativos y despliegue en producción',
    },
  });

  const isV2s4DIS = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s4.id, code: 'DIS-401' } },
    update: { description: 'Investigación de usuarios, sistemas de diseño y métricas UX' },
    create: {
      tenantId: tid, semesterId: isV2s4.id,
      name: 'Diseño de Interacción',         code: 'DIS-401',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Investigación de usuarios, sistemas de diseño y métricas UX',
    },
  });

  const isV2s4OPS = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s4.id, code: 'OPS-401' } },
    update: { description: 'CI/CD, Docker, blue-green/canary releases y monitoreo de pipelines' },
    create: {
      tenantId: tid, semesterId: isV2s4.id,
      name: 'Operaciones y Despliegue',      code: 'OPS-401',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'CI/CD, Docker, blue-green/canary releases y monitoreo de pipelines',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s4.id, code: 'ISW-401' } },
    update: { description: 'Diseño UML, requisitos, estimación y métricas de calidad del software' },
    create: {
      tenantId: tid, semesterId: isV2s4.id,
      name: 'Ingeniería de Software II',     code: 'ISW-401',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Diseño UML, requisitos, estimación y métricas de calidad del software',
    },
  });

  // ── IS-V2 · Semestre V — Ciclo Profesional III ──────────────────────────────
  const isV2s5 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV2.id, number: 5 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV2.id, number: 5, name: 'Semestre V' },
  });

  const isV2s5ARQ = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s5.id, code: 'ARQ-501' } },
    update: { description: 'Microservicios, DDD, CQRS, Event Sourcing y observabilidad con ELK' },
    create: {
      tenantId: tid, semesterId: isV2s5.id,
      name: 'Arquitectura de Software',      code: 'ARQ-501',
      credits: 4, hoursTheory: 48,           hoursPractice: 16,
      description: 'Microservicios, DDD, CQRS, Event Sourcing y observabilidad con ELK',
    },
  });

  const isV2s5CLD = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s5.id, code: 'CLD-501' } },
    update: { description: 'AWS/GCP/Azure, Kubernetes, Terraform, GitOps y escalado cloud' },
    create: {
      tenantId: tid, semesterId: isV2s5.id,
      name: 'Computación en la Nube',        code: 'CLD-501',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'AWS/GCP/Azure, Kubernetes, Terraform, GitOps y escalado cloud',
    },
  });

  const isV2s5INF = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s5.id, code: 'INF-501' } },
    update: { description: 'Data Warehouses, ETL/ELT con dbt, dashboards y análisis de cohortes' },
    create: {
      tenantId: tid, semesterId: isV2s5.id,
      name: 'Inteligencia de Negocios',      code: 'INF-501',
      credits: 3, hoursTheory: 48,           hoursPractice: 0,
      description: 'Data Warehouses, ETL/ELT con dbt, dashboards y análisis de cohortes',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s5.id, code: 'ISW-501' } },
    update: { description: 'Métricas, TDD/BDD, pruebas de rendimiento con k6 y modelos CMMI' },
    create: {
      tenantId: tid, semesterId: isV2s5.id,
      name: 'Ingeniería de Software III',    code: 'ISW-501',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Métricas, TDD/BDD, pruebas de rendimiento con k6 y modelos CMMI',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s5.id, code: 'MOV-501' } },
    update: { description: 'React Native o Flutter con APIs, notificaciones y publicación en tiendas' },
    create: {
      tenantId: tid, semesterId: isV2s5.id,
      name: 'Desarrollo Móvil',              code: 'MOV-501',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'React Native o Flutter con APIs, notificaciones y publicación en tiendas',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s5.id, code: 'CAL-501' } },
    update: { description: 'Estrategias de pruebas, E2E con Playwright, análisis estático e ISO 25010' },
    create: {
      tenantId: tid, semesterId: isV2s5.id,
      name: 'Calidad del Software',          code: 'CAL-501',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Estrategias de pruebas, E2E con Playwright, análisis estático e ISO 25010',
    },
  });

  // ── IS-V2 · Semestre VI — Ciclo de Especialización ──────────────────────────
  const isV2s6 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV2.id, number: 6 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV2.id, number: 6, name: 'Semestre VI' },
  });

  const isV2s6MSV = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s6.id, code: 'MSV-601' } },
    update: { description: 'Microservicios con DDD, service mesh Istio, resiliencia, gRPC y Kafka' },
    create: {
      tenantId: tid, semesterId: isV2s6.id,
      name: 'Sistemas Distribuidos y Microservicios', code: 'MSV-601',
      credits: 4, hoursTheory: 48,                    hoursPractice: 16,
      description: 'Microservicios con DDD, service mesh Istio, resiliencia, gRPC y Kafka',
    },
  });

  const isV2s6IAP = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s6.id, code: 'IAP-601' } },
    update: { description: 'Fine-tuning de LLMs, RAG vectorial, agentes LangChain y MLOps' },
    create: {
      tenantId: tid, semesterId: isV2s6.id,
      name: 'Aplicaciones de Inteligencia Artificial', code: 'IAP-601',
      credits: 3, hoursTheory: 32,                     hoursPractice: 16,
      description: 'Fine-tuning de LLMs, RAG vectorial, agentes LangChain y MLOps',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s6.id, code: 'SIE-601' } },
    update: { description: 'Microcontroladores, protocolos IoT, plataformas cloud y edge computing' },
    create: {
      tenantId: tid, semesterId: isV2s6.id,
      name: 'Sistemas Embebidos e IoT',       code: 'SIE-601',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Microcontroladores, protocolos IoT, plataformas cloud y edge computing',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s6.id, code: 'TEW-601' } },
    update: { description: 'Web Components, PWA, WebAssembly y dApps con Web3' },
    create: {
      tenantId: tid, semesterId: isV2s6.id,
      name: 'Tecnologías Web Emergentes',     code: 'TEW-601',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Web Components, PWA, WebAssembly y dApps con Web3',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s6.id, code: 'VER-601' } },
    update: { name: 'Usabilidad y Accesibilidad', description: 'Heurísticas Nielsen, evaluación con usuarios, WCAG 2.2 y métricas SUS/NPS' },
    create: {
      tenantId: tid, semesterId: isV2s6.id,
      name: 'Usabilidad y Accesibilidad',            code: 'VER-601',
      credits: 3, hoursTheory: 32,                   hoursPractice: 16,
      description: 'Heurísticas Nielsen, evaluación con usuarios, WCAG 2.2 y métricas SUS/NPS',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s6.id, code: 'ELT-601' } },
    update: { description: 'Tópicos avanzados: ciberseguridad, computación cuántica y robótica con IA' },
    create: {
      tenantId: tid, semesterId: isV2s6.id,
      name: 'Tópicos Avanzados en Ciencias de la Computación', code: 'ELT-601',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Tópicos avanzados: ciberseguridad, computación cuántica y robótica con IA',
    },
  });

  // ── IS-V2 · Semestre VII — Ciclo de Integración ──────────────────────────────
  const isV2s7 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV2.id, number: 7 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV2.id, number: 7, name: 'Semestre VII' },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s7.id, code: 'GIT-701' } },
    update: { description: 'Gobierno de datos, GDPR, COBIT 2019, ISO 27001 y planes de continuidad' },
    create: {
      tenantId: tid, semesterId: isV2s7.id,
      name: 'Gobierno de TI y Cumplimiento', code: 'GIT-701',
      credits: 3, hoursTheory: 48,           hoursPractice: 0,
      description: 'Gobierno de datos, GDPR, COBIT 2019, ISO 27001 y planes de continuidad',
    },
  });

  const isV2s7AUT = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s7.id, code: 'AUT-701' } },
    update: { description: 'RPA con UiPath, IA en automatización, minería de procesos y hyperautomation' },
    create: {
      tenantId: tid, semesterId: isV2s7.id,
      name: 'Automatización de Procesos',    code: 'AUT-701',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'RPA con UiPath, IA en automatización, minería de procesos y hyperautomation',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s7.id, code: 'GEP-701' } },
    update: { description: 'Modelos SaaS, presupuestos TI, contratos y estrategia de crecimiento' },
    create: {
      tenantId: tid, semesterId: isV2s7.id,
      name: 'Gestión de Empresas de Software', code: 'GEP-701',
      credits: 2, hoursTheory: 32,              hoursPractice: 0,
      description: 'Modelos SaaS, presupuestos TI, contratos y estrategia de crecimiento',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s7.id, code: 'ETS-701' } },
    update: { description: 'Ética en IA, códigos ACM/IEEE, green computing e inclusión digital' },
    create: {
      tenantId: tid, semesterId: isV2s7.id,
      name: 'Ética en Tecnología y Sociedad', code: 'ETS-701',
      credits: 2, hoursTheory: 32,            hoursPractice: 0,
      description: 'Ética en IA, códigos ACM/IEEE, green computing e inclusión digital',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s7.id, code: 'ELT2-701' } },
    update: { description: 'Tópicos especializados: seguridad ofensiva, SaaS multi-tenant o XR' },
    create: {
      tenantId: tid, semesterId: isV2s7.id,
      name: 'Seguridad Ofensiva y Plataformas Especializadas', code: 'ELT2-701',
      credits: 3, hoursTheory: 32,           hoursPractice: 16,
      description: 'Tópicos especializados: seguridad ofensiva, SaaS multi-tenant o XR',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s7.id, code: 'PPR-701' } },
    update: { description: 'Práctica preprofesional de 320 horas con informe y evaluación 360°' },
    create: {
      tenantId: tid, semesterId: isV2s7.id,
      name: 'Práctica Preprofesional',       code: 'PPR-701',
      credits: 3, hoursTheory: 0,            hoursPractice: 48,
      description: 'Práctica preprofesional de 320 horas con informe y evaluación 360°',
    },
  });

  // ── IS-V2 · Semestre VIII — Titulación ──────────────────────────────────────
  const isV2s8 = await prisma.semester.upsert({
    where: { curriculumId_number: { curriculumId: isV2.id, number: 8 } },
    update: {},
    create: { tenantId: tid, curriculumId: isV2.id, number: 8, name: 'Semestre VIII' },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s8.id, code: 'DTT-801' } },
    update: { name: 'Integración de Sistemas', description: 'Integración empresarial: ESB, API Gateway, ETL/ELT y seguridad OAuth2/JWT' },
    create: {
      tenantId: tid, semesterId: isV2s8.id,
      name: 'Integración de Sistemas',          code: 'DTT-801',
      credits: 3, hoursTheory: 32,              hoursPractice: 16,
      description: 'Integración empresarial: ESB, API Gateway, ETL/ELT y seguridad OAuth2/JWT',
    },
  });

  const isV2s8ITT = await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s8.id, code: 'ITT-801' } },
    update: { name: 'Trabajo de Titulación', description: 'Propuesta técnica, desarrollo iterativo, pruebas de aceptación y defensa oral' },
    create: {
      tenantId: tid, semesterId: isV2s8.id,
      name: 'Trabajo de Titulación',                    code: 'ITT-801',
      credits: 4, hoursTheory: 48,                       hoursPractice: 16,
      description: 'Propuesta técnica, desarrollo iterativo, pruebas de aceptación y defensa oral',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s8.id, code: 'DTD-801' } },
    update: { name: 'Procesos de Software', description: 'Modelos de proceso, mejora CMMI, gestión de configuración y code reviews' },
    create: {
      tenantId: tid, semesterId: isV2s8.id,
      name: 'Procesos de Software',           code: 'DTD-801',
      credits: 3, hoursTheory: 32,            hoursPractice: 16,
      description: 'Modelos de proceso, mejora CMMI, gestión de configuración y code reviews',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s8.id, code: 'SIN-801' } },
    update: { name: 'Auditoría Informática', description: 'Auditoría TI con COBIT 2019, controles internos y cumplimiento normativo' },
    create: {
      tenantId: tid, semesterId: isV2s8.id,
      name: 'Auditoría Informática',         code: 'SIN-801',
      credits: 2, hoursTheory: 32,           hoursPractice: 0,
      description: 'Auditoría TI con COBIT 2019, controles internos y cumplimiento normativo',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s8.id, code: 'POR-801' } },
    update: { name: 'Profesionalismo en Informática', description: 'Ética ACM/IEEE, marca personal, liderazgo técnico y marco legal del software' },
    create: {
      tenantId: tid, semesterId: isV2s8.id,
      name: 'Profesionalismo en Informática',code: 'POR-801',
      credits: 2, hoursTheory: 32,           hoursPractice: 0,
      description: 'Ética ACM/IEEE, marca personal, liderazgo técnico y marco legal del software',
    },
  });

  await prisma.subject.upsert({
    where: { semesterId_code: { semesterId: isV2s8.id, code: 'ETI-801' } },
    update: { description: 'Design Thinking, Business Model Canvas, financiamiento y go-to-market' },
    create: {
      tenantId: tid, semesterId: isV2s8.id,
      name: 'Emprendimiento e Innovación',   code: 'ETI-801',
      credits: 2, hoursTheory: 32,           hoursPractice: 0,
      description: 'Design Thinking, Business Model Canvas, financiamiento y go-to-market',
    },
  });

  // ── IS-V2 · Prerrequisitos ───────────────────────────────────────────────────
  //  S2: EDA-201 ← PRG-101 · PRG-201 ← PRG-101
  //  S3: BDI-301 ← EDA-201 · PRG-301 ← PRG-201 · IUS-301 ← PRG-201 · IAI-301 ← IAI-201
  //  S4: BDI-401 ← BDI-301 · PRG-401 ← PRG-301 · IAI-401 ← IAI-301 · DIS-401 ← IUS-301
  //  S5: ARQ-501 ← PRG-401 · CLD-501 ← OPS-401 · INF-501 ← BDI-401 · MOV-501 ← IUS-301
  //  S6: MSV-601 ← ARQ-501 · IAP-601 ← IAI-401
  //  S7: AUT-701 ← IAP-601
  //  S8: ITT-801 ← ARQ-501
  const isV2Prerequisites = [
    { subjectId: isV2s2EDA.id,   requiresId: isV2s1PRG.id   },
    { subjectId: isV2s2PRG2.id,  requiresId: isV2s1PRG.id   },
    { subjectId: isV2s3BD1.id,   requiresId: isV2s2EDA.id   },
    { subjectId: isV2s3PRG3.id,  requiresId: isV2s2PRG2.id  },
    { subjectId: isV2s3IUS.id,   requiresId: isV2s2PRG2.id  },
    { subjectId: isV2s3IAI2.id,  requiresId: isV2s2IAI1.id  },
    { subjectId: isV2s4BD2.id,   requiresId: isV2s3BD1.id   },
    { subjectId: isV2s4PRG4.id,  requiresId: isV2s3PRG3.id  },
    { subjectId: isV2s4IAI3.id,  requiresId: isV2s3IAI2.id  },
    { subjectId: isV2s4DIS.id,   requiresId: isV2s3IUS.id   },
    { subjectId: isV2s5ARQ.id,   requiresId: isV2s4PRG4.id  },
    { subjectId: isV2s5CLD.id,   requiresId: isV2s4OPS.id   },
    { subjectId: isV2s5INF.id,   requiresId: isV2s4BD2.id   },
    { subjectId: isV2s6MSV.id,   requiresId: isV2s5ARQ.id   },
    { subjectId: isV2s6IAP.id,   requiresId: isV2s4IAI3.id  },
    { subjectId: isV2s7AUT.id,   requiresId: isV2s6IAP.id   },
    { subjectId: isV2s8ITT.id,   requiresId: isV2s5ARQ.id   },
  ];
  for (const p of isV2Prerequisites) {
    await prisma.prerequisite.upsert({
      where: { subjectId_requiresId: { subjectId: p.subjectId, requiresId: p.requiresId } },
      update: {},
      create: { tenantId: tid, subjectId: p.subjectId, requiresId: p.requiresId },
    });
  }
  console.log('✅ IS Pensum 2025-2 (V2 Genérico): 8 semestres · 48 materias · 17 prerrequisitos');

  // ────────────────────────────────────────────────────────────────────────────
  // USERS
  // ────────────────────────────────────────────────────────────────────────────
  const SALT_ROUNDS = 12;

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.edu.co' },
    update: {},
    create: {
      tenantId: tid,
      email: 'admin@demo.edu.co',
      password: await bcrypt.hash('Admin123!', SALT_ROUNDS),
      firstName: 'Admin',
      lastName: 'Demo',
      isActive: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  const coordinatorUser = await prisma.user.upsert({
    where: { email: 'coordinador@demo.edu.co' },
    update: {},
    create: {
      tenantId: tid,
      email: 'coordinador@demo.edu.co',
      password: await bcrypt.hash('Coord123!', SALT_ROUNDS),
      firstName: 'Coordinador',
      lastName: 'Demo',
      isActive: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: coordinatorUser.id, roleId: coordinatorRole.id } },
    update: {},
    create: { userId: coordinatorUser.id, roleId: coordinatorRole.id },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@demo.edu.co' },
    update: {},
    create: {
      tenantId: tid,
      email: 'viewer@demo.edu.co',
      password: await bcrypt.hash('Viewer123!', SALT_ROUNDS),
      firstName: 'Viewer',
      lastName: 'Demo',
      isActive: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: viewerUser.id, roleId: viewerRole.id } },
    update: {},
    create: { userId: viewerUser.id, roleId: viewerRole.id },
  });

  console.log('✅ Users:');
  console.log('   admin@demo.edu.co       → Admin123!  [ADMIN]');
  console.log('   coordinador@demo.edu.co → Coord123!  [COORDINATOR]');
  console.log('   viewer@demo.edu.co      → Viewer123! [VIEWER]');

  // ────────────────────────────────────────────────────────────────────────────
  // POST-PROCESSING: NORMALIZACIÓN DE DESCRIPCIONES A 4 LÍNEAS (BULLET POINTS)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n🧹 Normalizando descripciones de materias a exactamente 4 líneas...');
  
  function formatTo4Bullets(name: string, desc: string | null): string | null {
    if (!desc) return null;
    
    // Si ya tiene exactamente 4 partes separadas por punto y coma, no lo modificamos
    const existing = desc.split(';').map(t => t.trim()).filter(Boolean);
    if (existing.length === 4) return existing.join(';');

    // Dividimos por dos puntos, punto y coma, salto de línea o coma
    let parts: string[] = [];
    const rawParts = desc.split(/[:;\n,]/).map(t => t.trim()).filter(Boolean);
    
    for (const part of rawParts) {
      // También dividimos por " y " o " e " si existen para obtener más temas
      const subParts = part.split(/\s+(?:y|e)\s+/i).map(t => t.trim()).filter(Boolean);
      parts.push(...subParts);
    }

    // Limpiamos los términos obtenidos
    parts = parts
      .map(t => t.replace(/^(y|e|o|de|con|para|sobre)\s+/i, '')) // remove leading prepositions/conjunctions
      .map(t => t.trim())
      .filter(Boolean);

    // Si la primera parte es idéntica al nombre de la materia, la removemos
    if (parts.length > 1 && parts[0].toLowerCase() === name.toLowerCase()) {
      parts.shift();
    }

    // Capitalizamos la primera letra de cada término
    parts = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1));

    // Forzamos a tener exactamente 4 términos
    if (parts.length > 4) {
      parts = parts.slice(0, 4);
    } else {
      while (parts.length < 4) {
        parts.push('Conceptos avanzados');
      }
    }

    return parts.join(';');
  }

  const allSubjects = await prisma.subject.findMany({
    select: { id: true, name: true, description: true }
  });

  let updatedCount = 0;
  for (const sub of allSubjects) {
    const originalDesc = sub.description;
    const formattedDesc = formatTo4Bullets(sub.name, originalDesc);
    if (formattedDesc !== originalDesc) {
      await prisma.subject.update({
        where: { id: sub.id },
        data: { description: formattedDesc },
      });
      updatedCount++;
    }
  }
  console.log(`✅ Normalización completada: ${updatedCount} materias actualizadas a 4 líneas.`);

  // ────────────────────────────────────────────────────────────────────────────
  // RESUMEN
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed completado.');
  console.log('');
  console.log('📊 Resumen:');
  console.log(`   Tenant     : ${tenant.slug}`);
  console.log(`   Universidad: ${university.name}`);
  console.log(`   Facultad   : ${facultyFTI.name} (${facultyFTI.code})`);
  console.log(`   Carrera    : ${careerDS.name} (${careerDS.code})`);
  console.log(`   Curriculum DS  : ${currV1.version} — 4 semestres, 24 materias, 5 prerrequisitos`);
  console.log(`   Curriculum DS  : ${currV2.version} — 4 semestres, 24 materias, 6 prerrequisitos`);
  console.log(`   Curriculum IS  : 2025-1 — 8 semestres, 48 materias, 17 prerrequisitos`);
  console.log(`   Curriculum IS  : 2025-2 — 8 semestres, 48 materias, 17 prerrequisitos`);
  console.log('');
  console.log('🔑 Credenciales de acceso:');
  console.log('   admin@demo.edu.co       / Admin123!  → rol ADMIN');
  console.log('   coordinador@demo.edu.co / Coord123!  → rol COORDINATOR');
  console.log('   viewer@demo.edu.co      / Viewer123! → rol VIEWER');
  console.log('   X-Tenant-ID header      : demo-university');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
