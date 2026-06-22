-- =============================================================================
-- SEED: Ingeniería de Software (IS) — 8 semestres · 120 cr · 5760 h
-- Renombra carrera DS → Tecnología en Desarrollo de Software
-- =============================================================================
DO $SEED_IS$
DECLARE
  v_tenant_id     TEXT;
  v_faculty_id    TEXT;
  v_career_id     TEXT;
  v_curriculum_id TEXT;

  -- Semester IDs
  v_s1 TEXT; v_s2 TEXT; v_s3 TEXT; v_s4 TEXT;
  v_s5 TEXT; v_s6 TEXT; v_s7 TEXT; v_s8 TEXT;

  -- S1 subject IDs
  v_lpa TEXT; v_cdi TEXT; v_alg TEXT; v_arc TEXT; v_fin TEXT;
  -- S2 subject IDs
  v_poo TEXT; v_eda TEXT; v_dis TEXT; v_pro TEXT; v_pam TEXT;
  -- S3 subject IDs
  v_req TEXT; v_dcp TEXT; v_bdr TEXT; v_bac TEXT; v_red TEXT;
  -- S4 subject IDs
  v_fst TEXT; v_sei TEXT; v_agl TEXT; v_dev TEXT; v_bdn TEXT;
  -- S5 subject IDs
  v_iaf TEXT; v_mal TEXT; v_arq TEXT; v_mov TEXT; v_sed TEXT;
  -- S6 subject IDs
  v_dpl TEXT; v_pnl TEXT; v_ida TEXT; v_cap TEXT; v_cld TEXT;
  -- S7 subject IDs
  v_vis TEXT; v_cuq TEXT; v_sds TEXT; v_ihc TEXT; v_emp TEXT;
  -- S8 subject IDs
  v_iad TEXT; v_vvs TEXT; v_aud TEXT; v_etl TEXT; v_tit TEXT;

BEGIN
  -- ============================================================
  -- CONTEXT
  -- ============================================================
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'demo-university';
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant demo-university not found';
  END IF;

  SELECT f.id INTO v_faculty_id
  FROM faculties f
  WHERE f.tenant_id = v_tenant_id AND f.code = 'FE' AND f.deleted_at IS NULL;
  IF v_faculty_id IS NULL THEN
    RAISE EXCEPTION 'Faculty FE (Faculty of Engineering) not found';
  END IF;

  RAISE NOTICE '=== Tenant: % | Faculty: % ===', v_tenant_id, v_faculty_id;

  -- ============================================================
  -- STEP 1: Renombrar carrera DS → Tecnología en Desarrollo de Software
  -- ============================================================
  UPDATE careers
  SET name = 'Tecnología en Desarrollo de Software', updated_at = NOW()
  WHERE code = 'DS' AND tenant_id = v_tenant_id AND deleted_at IS NULL;

  RAISE NOTICE 'Career DS renamed to Tecnología en Desarrollo de Software';

  -- ============================================================
  -- STEP 2: Crear carrera Ingeniería de Software (IS)
  -- ============================================================
  SELECT id INTO v_career_id
  FROM careers WHERE faculty_id = v_faculty_id AND code = 'IS';

  IF v_career_id IS NULL THEN
    v_career_id := gen_random_uuid()::TEXT;
    INSERT INTO careers (id, tenant_id, faculty_id, name, code, description, created_at, updated_at)
    VALUES (v_career_id, v_tenant_id, v_faculty_id,
      'Ingeniería de Software', 'IS',
      '8 semestres · 120 créditos · Énfasis en Inteligencia Artificial, MLOps y Computación Cuántica',
      NOW(), NOW());
    RAISE NOTICE 'Career IS created: %', v_career_id;
  ELSE
    RAISE NOTICE 'Career IS already exists: % — skipping recreation', v_career_id;
    RETURN;
  END IF;

  -- ============================================================
  -- STEP 3: Curriculum
  -- ============================================================
  v_curriculum_id := gen_random_uuid()::TEXT;
  INSERT INTO curricula (id, tenant_id, career_id, version, name, description, status, created_at, updated_at)
  VALUES (v_curriculum_id, v_tenant_id, v_career_id,
    '2025-1', 'Pensum IS 2025 V1',
    '8 semestres · 120 créditos · 5760 horas · Backend-first · 7 materias de IA/ML/Cuántica',
    'ACTIVE'::"CurriculumStatus", NOW(), NOW());

  -- ============================================================
  -- STEP 4: 8 Semestres
  -- ============================================================
  v_s1 := gen_random_uuid()::TEXT; v_s2 := gen_random_uuid()::TEXT;
  v_s3 := gen_random_uuid()::TEXT; v_s4 := gen_random_uuid()::TEXT;
  v_s5 := gen_random_uuid()::TEXT; v_s6 := gen_random_uuid()::TEXT;
  v_s7 := gen_random_uuid()::TEXT; v_s8 := gen_random_uuid()::TEXT;

  INSERT INTO semesters (id, tenant_id, curriculum_id, number, name, created_at, updated_at) VALUES
  (v_s1, v_tenant_id, v_curriculum_id, 1, 'Fundamentos Científicos y Computacionales',     NOW(), NOW()),
  (v_s2, v_tenant_id, v_curriculum_id, 2, 'Programación y Matemáticas Aplicadas',           NOW(), NOW()),
  (v_s3, v_tenant_id, v_curriculum_id, 3, 'IS I: Back-End y Bases de Datos',                NOW(), NOW()),
  (v_s4, v_tenant_id, v_curriculum_id, 4, 'IS II: Full-Stack, Seguridad y DevOps',          NOW(), NOW()),
  (v_s5, v_tenant_id, v_curriculum_id, 5, 'Inteligencia Artificial I y Arquitectura',       NOW(), NOW()),
  (v_s6, v_tenant_id, v_curriculum_id, 6, 'Inteligencia Artificial II y Cloud',             NOW(), NOW()),
  (v_s7, v_tenant_id, v_curriculum_id, 7, 'IA Avanzada y Computación Cuántica',             NOW(), NOW()),
  (v_s8, v_tenant_id, v_curriculum_id, 8, 'Integración Curricular y Titulación',            NOW(), NOW());

  -- ============================================================
  -- STEP 5: 40 Materias (credits=3 · hours_theory+hours_practice=48 · TA=96 · TH=144)
  -- ============================================================
  -- Genera IDs
  v_lpa:=gen_random_uuid()::TEXT; v_cdi:=gen_random_uuid()::TEXT; v_alg:=gen_random_uuid()::TEXT;
  v_arc:=gen_random_uuid()::TEXT; v_fin:=gen_random_uuid()::TEXT;
  v_poo:=gen_random_uuid()::TEXT; v_eda:=gen_random_uuid()::TEXT; v_dis:=gen_random_uuid()::TEXT;
  v_pro:=gen_random_uuid()::TEXT; v_pam:=gen_random_uuid()::TEXT;
  v_req:=gen_random_uuid()::TEXT; v_dcp:=gen_random_uuid()::TEXT; v_bdr:=gen_random_uuid()::TEXT;
  v_bac:=gen_random_uuid()::TEXT; v_red:=gen_random_uuid()::TEXT;
  v_fst:=gen_random_uuid()::TEXT; v_sei:=gen_random_uuid()::TEXT; v_agl:=gen_random_uuid()::TEXT;
  v_dev:=gen_random_uuid()::TEXT; v_bdn:=gen_random_uuid()::TEXT;
  v_iaf:=gen_random_uuid()::TEXT; v_mal:=gen_random_uuid()::TEXT; v_arq:=gen_random_uuid()::TEXT;
  v_mov:=gen_random_uuid()::TEXT; v_sed:=gen_random_uuid()::TEXT;
  v_dpl:=gen_random_uuid()::TEXT; v_pnl:=gen_random_uuid()::TEXT; v_ida:=gen_random_uuid()::TEXT;
  v_cap:=gen_random_uuid()::TEXT; v_cld:=gen_random_uuid()::TEXT;
  v_vis:=gen_random_uuid()::TEXT; v_cuq:=gen_random_uuid()::TEXT; v_sds:=gen_random_uuid()::TEXT;
  v_ihc:=gen_random_uuid()::TEXT; v_emp:=gen_random_uuid()::TEXT;
  v_iad:=gen_random_uuid()::TEXT; v_vvs:=gen_random_uuid()::TEXT; v_aud:=gen_random_uuid()::TEXT;
  v_etl:=gen_random_uuid()::TEXT; v_tit:=gen_random_uuid()::TEXT;

  -- ─── SEMESTRE 1 ────────────────────────────────────────────
  INSERT INTO subjects (id, tenant_id, semester_id, name, code, credits, hours_theory, hours_practice, description, created_at, updated_at) VALUES
  (v_lpa, v_tenant_id, v_s1,
   'Lógica de Programación y Algoritmos', 'LPA-101', 3, 48, 0,
   'Algoritmos y pseudocódigo;Estructuras de control: condicionales y bucles;Funciones, modularidad y recursividad;Complejidad algorítmica básica Big-O;Python como primer lenguaje: sintaxis y tipos de datos',
   NOW(), NOW()),
  (v_cdi, v_tenant_id, v_s1,
   'Cálculo Diferencial e Integral', 'CDI-101', 3, 48, 0,
   'Límites y continuidad de funciones;Derivadas: reglas y aplicaciones de optimización;Integrales indefinidas y definidas;Series de Taylor y McLaurin;Aplicaciones del cálculo en análisis de algoritmos',
   NOW(), NOW()),
  (v_alg, v_tenant_id, v_s1,
   'Álgebra Lineal y Matricial', 'ALG-101', 3, 48, 0,
   'Vectores y espacios vectoriales;Matrices: operaciones y determinantes;Sistemas de ecuaciones lineales (Gauss-Jordan);Autovalores, autovectores y diagonalización;Aplicaciones en Machine Learning y gráficos 3D',
   NOW(), NOW()),
  (v_arc, v_tenant_id, v_s1,
   'Arquitectura de Computadores y Sistemas Operativos', 'ARC-101', 3, 48, 0,
   'Sistemas numéricos y representación binaria;Circuitos lógicos, ALU y microprocesadores;Gestión de memoria: RAM, caché y memoria virtual;Procesos, hilos y scheduling del sistema operativo;Sistemas de archivos y Linux shell scripting',
   NOW(), NOW()),
  (v_fin, v_tenant_id, v_s1,
   'Fundamentos de Ingeniería de Software', 'FIN-101', 3, 48, 0,
   'Historia y evolución del software;Modelos del ciclo de vida (SDLC): cascada, iterativo y ágil;Roles en equipos de desarrollo: Dev, QA, DevOps, Arquitecto;Control de versiones básico con Git y GitHub;Ética, responsabilidad profesional y propiedad intelectual',
   NOW(), NOW()),

  -- ─── SEMESTRE 2 ────────────────────────────────────────────
  (v_poo, v_tenant_id, v_s2,
   'Programación Orientada a Objetos', 'POO-201', 3, 48, 0,
   'Clases, objetos, constructores y encapsulamiento;Herencia, polimorfismo y sobrescritura de métodos;Abstracción e interfaces: contratos de comportamiento;Principios SOLID (SRP, OCP, LSP, ISP, DIP);Patrones de diseño básicos: Singleton, Factory, Observer',
   NOW(), NOW()),
  (v_eda, v_tenant_id, v_s2,
   'Estructuras de Datos y Algoritmos', 'EDA-201', 3, 48, 0,
   'Listas enlazadas simples, dobles y circulares;Pilas, colas y colas de prioridad (heap);Árboles binarios, BST y árboles AVL;Tablas hash, grafos y algoritmos de recorrido (BFS, DFS);Ordenamiento avanzado: QuickSort, MergeSort y HeapSort',
   NOW(), NOW()),
  (v_dis, v_tenant_id, v_s2,
   'Matemáticas Discretas', 'DIS-201', 3, 48, 0,
   'Lógica proposicional, predicados y cuantificadores;Teoría de grafos: caminos, ciclos, coloración y árboles;Combinatoria: permutaciones, combinaciones y principio de inclusión-exclusión;Relaciones de equivalencia, funciones inyectivas, sobreyectivas y biyectivas;Aritmética modular y fundamentos de criptografía',
   NOW(), NOW()),
  (v_pro, v_tenant_id, v_s2,
   'Probabilidad y Estadística', 'PRO-201', 3, 48, 0,
   'Probabilidad clásica, condicional y teorema de Bayes;Distribuciones discretas (Binomial, Poisson) y continuas (Normal, Exponencial);Inferencia estadística: estimación e intervalos de confianza;Pruebas de hipótesis y valor-p;Regresión lineal y correlación aplicada a métricas de software',
   NOW(), NOW()),
  (v_pam, v_tenant_id, v_s2,
   'Programación Avanzada y Multiparadigma', 'PAM-201', 3, 32, 16,
   'Programación funcional: funciones puras, inmutabilidad y composición (Haskell/Elixir);Programación concurrente: hilos, actores y comunicación entre procesos (Go/Erlang);Programación reactiva: streams, observables y eventos asíncronos (RxJS/Project Reactor);Sistemas de tipos avanzados: inferencia de tipos y polimorfismo paramétrico;Metaprogramación, macros y generación de código',
   NOW(), NOW()),

  -- ─── SEMESTRE 3 ────────────────────────────────────────────
  (v_req, v_tenant_id, v_s3,
   'Ingeniería de Requisitos y Modelado UML', 'REQ-301', 3, 48, 0,
   'Técnicas de elicitación: entrevistas, talleres y prototipado rápido;Especificación de requisitos: SRS e historias de usuario (formato Connextra);Modelado UML: diagramas de casos de uso, clases, secuencia y actividad;Gestión y trazabilidad de requisitos con herramientas (Jira, Azure DevOps);Requisitos no funcionales: rendimiento, seguridad, escalabilidad y accesibilidad',
   NOW(), NOW()),
  (v_dcp, v_tenant_id, v_s3,
   'Diseño, Construcción y Patrones de Software', 'DCP-301', 3, 48, 0,
   'Principios SOLID y Clean Architecture en capas (Dominio, Aplicación, Infraestructura);Patrones creacionales: Factory Method, Abstract Factory y Builder;Patrones estructurales: Adapter, Decorator, Facade y Proxy;Patrones de comportamiento: Strategy, Command, Observer y Template Method;Clean Code: refactoring, deuda técnica y documentación (C4 Model)',
   NOW(), NOW()),
  (v_bdr, v_tenant_id, v_s3,
   'Bases de Datos Relacionales y SQL', 'BDR-301', 3, 48, 0,
   'Modelo entidad-relación (ER) y paso a esquema relacional;Álgebra relacional y SQL avanzado: joins, subconsultas y window functions;Normalización: 1FN, 2FN, 3FN y BCNF;Transacciones ACID, concurrencia y niveles de aislamiento;Procedimientos almacenados, triggers e índices para optimización',
   NOW(), NOW()),
  (v_bac, v_tenant_id, v_s3,
   'Desarrollo Back-End y Programación del Servidor', 'BAC-301', 3, 32, 16,
   'Arquitectura de servidores HTTP y ciclo request-response;Node.js con NestJS y Python con FastAPI: estructura y convenciones;Diseño e implementación de APIs REST: verbos, status codes y versionado;Middleware: autenticación JWT, validación, logging y manejo de errores;Integración con bases de datos relacionales mediante ORM (Prisma, TypeORM, SQLAlchemy)',
   NOW(), NOW()),
  (v_red, v_tenant_id, v_s3,
   'Redes de Computadores y Protocolos', 'RED-301', 3, 48, 0,
   'Modelo OSI de 7 capas y pila de protocolos TCP/IP;Protocolos de aplicación: HTTP/HTTPS, DNS, DHCP, FTP y SMTP;Redes LAN, WAN, WiFi y fundamentos de VPN;WebSockets, Server-Sent Events y comunicación en tiempo real;Introducción a redes definidas por software (SDN) y networking en la nube',
   NOW(), NOW()),

  -- ─── SEMESTRE 4 ────────────────────────────────────────────
  (v_fst, v_tenant_id, v_s4,
   'Desarrollo Full-Stack y Front-End', 'FST-401', 3, 32, 16,
   'HTML5 semántico, accesibilidad (WCAG 2.2) y CSS3 avanzado con Tailwind CSS;TypeScript moderno: tipos, generics, decoradores y módulos ES;React.js: componentes, hooks (useState, useEffect, useCallback), estado global con Zustand;Conexión con APIs REST propias usando Axios y React Query v5;Testing de componentes con Vitest y Playwright; despliegue de aplicaciones Full-Stack',
   NOW(), NOW()),
  (v_sei, v_tenant_id, v_s4,
   'Seguridad Informática y Criptografía', 'SEI-401', 3, 48, 0,
   'Criptografía simétrica (AES, ChaCha20) y asimétrica (RSA, ECC);Infraestructura de clave pública (PKI), certificados X.509 y TLS/HTTPS;Vulnerabilidades OWASP Top 10: SQL Injection, XSS, CSRF e IDOR;Autenticación y autorización: OAuth 2.0, JWT, OpenID Connect y SSO;Análisis de amenazas con STRIDE y modelado de riesgos de seguridad',
   NOW(), NOW()),
  (v_agl, v_tenant_id, v_s4,
   'Metodologías Ágiles y Gestión de Proyectos', 'AGL-401', 3, 48, 0,
   'Scrum: roles (PO, SM, Dev Team), eventos y artefactos (Product Backlog, Sprint);Kanban: visualización del flujo, límites WIP y métricas de flujo;Extreme Programming (XP): TDD, pair programming e integración continua;Métricas ágiles: velocity, burndown chart y Cumulative Flow Diagram;Escalado ágil (SAFe, LeSS) y herramientas: Jira, Linear y Azure DevOps',
   NOW(), NOW()),
  (v_dev, v_tenant_id, v_s4,
   'DevOps, CI/CD y Contenedores', 'DEV-401', 3, 32, 16,
   'Git avanzado: branching strategies (Git Flow, trunk-based) y GitOps;Docker: Dockerfile multistage, imágenes, contenedores y Docker Compose;Kubernetes: pods, deployments, services, ingress y ConfigMaps;Pipelines CI/CD con GitHub Actions, Jenkins y GitLab CI;Monitoreo y observabilidad: Prometheus, Grafana, Jaeger y stack ELK',
   NOW(), NOW()),
  (v_bdn, v_tenant_id, v_s4,
   'Bases de Datos NoSQL y Distribuidas', 'BDN-401', 3, 48, 0,
   'Modelos NoSQL: documental (MongoDB), clave-valor (Redis), columnar (Cassandra) y grafo (Neo4j);Teorema CAP: consistencia, disponibilidad y tolerancia a particiones;Sharding, replicación y particionamiento horizontal de datos;Event Sourcing y CQRS para sistemas de escritura intensiva;Selección de base de datos por patrón de acceso: comparativa SQL vs NoSQL',
   NOW(), NOW()),

  -- ─── SEMESTRE 5 ────────────────────────────────────────────
  (v_iaf, v_tenant_id, v_s5,
   'Inteligencia Artificial: Fundamentos', 'IAF-501', 3, 48, 0,
   'Agentes inteligentes: tipos, entornos y arquitectura PEAS;Búsqueda uninformada (BFS, DFS, UCS) e informada (A*, heurísticas admisibles);Representación del conocimiento: lógica de primer orden y redes semánticas;Sistemas expertos: motores de inferencia hacia adelante y hacia atrás;IA ética y responsable: sesgo algorítmico, transparencia y regulación (EU AI Act)',
   NOW(), NOW()),
  (v_mal, v_tenant_id, v_s5,
   'Aprendizaje Automático (Machine Learning)', 'MAL-501', 3, 32, 16,
   'Regresión lineal, polinomial y logística: gradiente descendente;Árboles de decisión, Random Forest y Gradient Boosting (XGBoost, LightGBM);Support Vector Machines (SVM) y métodos kernel (RBF, Polinomial);Validación cruzada, regularización (L1, L2) y métricas: F1, AUC-ROC, RMSE;Python para ML: scikit-learn, pandas, numpy y visualización con matplotlib/seaborn',
   NOW(), NOW()),
  (v_arq, v_tenant_id, v_s5,
   'Arquitectura de Software y Cloud Native', 'ARQ-501', 3, 48, 0,
   'Estilos arquitectónicos: event-driven, hexagonal (ports & adapters) y serverless;Patrones de microservicios: API Gateway, Service Mesh, Circuit Breaker y Saga;Domain-Driven Design (DDD): bounded contexts, aggregates y eventos de dominio;Diseño para resiliencia: redundancia, failover y chaos engineering;Documentación arquitectónica: C4 Model y Architecture Decision Records (ADRs)',
   NOW(), NOW()),
  (v_mov, v_tenant_id, v_s5,
   'Desarrollo de Aplicaciones Móviles', 'MOV-501', 3, 32, 16,
   'Arquitectura de aplicaciones iOS (SwiftUI) y Android (Jetpack Compose);React Native y Flutter para desarrollo multiplataforma con código compartido;Diseño UX/UI móvil: Material Design 3 y Human Interface Guidelines de Apple;APIs nativas: geolocalización, cámara, notificaciones push y biometría;Publicación en App Store y Google Play; CI/CD móvil con Fastlane y Bitrise',
   NOW(), NOW()),
  (v_sed, v_tenant_id, v_s5,
   'Seguridad en el Desarrollo de Software', 'SED-501', 3, 48, 0,
   'Secure Software Development Lifecycle (SSDLC) y cultura DevSecOps;Análisis estático de código (SAST) con SonarQube y Semgrep;Análisis dinámico (DAST) con OWASP ZAP y Burp Suite Community;Gestión de dependencias vulnerables: OWASP Dependency-Check y Snyk;Gestión de secretos: HashiCorp Vault, AWS Secrets Manager y variables de entorno seguras',
   NOW(), NOW()),

  -- ─── SEMESTRE 6 ────────────────────────────────────────────
  (v_dpl, v_tenant_id, v_s6,
   'Aprendizaje Profundo (Deep Learning)', 'DPL-601', 3, 32, 16,
   'Redes neuronales artificiales: arquitectura, funciones de activación y backpropagation;Redes convolucionales (CNNs): capas conv, pooling, batch normalization y transfer learning;Redes recurrentes (RNNs, LSTM, GRU) para series temporales y secuencias;Transformers: mecanismo de atención multi-cabeza y positional encoding;TensorFlow 2 y PyTorch: entrenamiento, optimización (Adam, AdamW) y regularización (Dropout)',
   NOW(), NOW()),
  (v_pnl, v_tenant_id, v_s6,
   'Procesamiento de Lenguaje Natural e IA Generativa', 'PNL-601', 3, 32, 16,
   'Tokenización, stemming, lematización y embeddings (Word2Vec, GloVe, FastText);Arquitecturas Transformer aplicadas: BERT (clasificación), GPT (generación) y T5 (seq2seq);Modelos de lenguaje grandes (LLMs): GPT-4, Claude, Gemini y Llama 3;Fine-tuning (LoRA, QLoRA), RAG (Retrieval-Augmented Generation) y prompt engineering avanzado;Desarrollo de aplicaciones con APIs generativas: chatbots, agentes y asistentes de código',
   NOW(), NOW()),
  (v_ida, v_tenant_id, v_s6,
   'Ingeniería de Datos y Big Data', 'IDA-601', 3, 32, 16,
   'Arquitecturas de datos: Data Lake, Data Warehouse y Lakehouse (Delta Lake, Apache Iceberg);Pipelines ETL/ELT con Apache Spark, Apache Kafka y dbt (Data Build Tool);Orquestación de flujos con Apache Airflow y Prefect;Visualización de datos: Power BI, Apache Superset y Metabase;Gobierno de datos: calidad, linaje de datos, catálogo y privacidad (GDPR aplicado)',
   NOW(), NOW()),
  (v_cap, v_tenant_id, v_s6,
   'Calidad y Pruebas de Software', 'CAP-601', 3, 32, 16,
   'Pruebas unitarias con Jest y Pytest: mocks, stubs y cobertura de código;Test-Driven Development (TDD) y Behavior-Driven Development (BDD con Cucumber/Gherkin);Pruebas de integración, contrato (Pact) y end-to-end (Cypress y Playwright);Pruebas de rendimiento, carga y estrés con k6 y Apache JMeter;Gestión de defectos, trazabilidad de casos de prueba y dashboards de calidad',
   NOW(), NOW()),
  (v_cld, v_tenant_id, v_s6,
   'Computación en la Nube (Cloud Computing)', 'CLD-601', 3, 32, 16,
   'Servicios core en AWS, GCP y Azure: cómputo (EC2/GCE), almacenamiento (S3/GCS) y redes (VPC);Kubernetes avanzado: Helm charts, operadores, HPA y gestión multi-cluster;Infraestructura como Código (IaC) con Terraform y Pulumi;Seguridad cloud: IAM, políticas de menor privilegio, encriptación en tránsito y reposo;FinOps: análisis de costos, rightsizing, reserved instances y estrategias de ahorro',
   NOW(), NOW()),

  -- ─── SEMESTRE 7 ────────────────────────────────────────────
  (v_vis, v_tenant_id, v_s7,
   'Visión por Computadora e IA Aplicada', 'VIS-701', 3, 32, 16,
   'Procesamiento de imágenes con OpenCV: filtros, morfología y detección de bordes;Detección y clasificación de objetos: YOLO v8/v9, Faster R-CNN y EfficientDet;Segmentación semántica e instancias: SegFormer y SAM (Segment Anything Model);Modelos visión-lenguaje multimodal: CLIP, LLaVA y GPT-4V;Aplicaciones industriales: inspección de calidad, diagnóstico médico y realidad aumentada',
   NOW(), NOW()),
  (v_cuq, v_tenant_id, v_s7,
   'Computación Cuántica y Algoritmos Cuánticos', 'CUQ-701', 3, 48, 0,
   'Fundamentos cuánticos: superposición, entrelazamiento y decoherencia;Qubits, puertas cuánticas (X, H, CNOT, Toffoli) y circuitos cuánticos;Algoritmos cuánticos: Shor (factorización en O(log³n)), Grover (búsqueda O(√n)) y QFT;Programación con Qiskit (IBM Quantum) y Cirq (Google Quantum AI);Criptografía post-cuántica (CRYSTALS-Kyber, Dilithium) y el futuro del software cuántico',
   NOW(), NOW()),
  (v_sds, v_tenant_id, v_s7,
   'Sistemas Distribuidos y Computación Paralela', 'SDS-701', 3, 48, 0,
   'Modelos de concurrencia: actores (Akka), CSP y memoria transaccional (STM);Algoritmos de consenso distribuido: Raft, Paxos y PBFT para tolerancia a fallos;Computación paralela: OpenMP, MPI y programación GPU con CUDA/ROCm;Patrones de resiliencia: Circuit Breaker, Bulkhead y timeout;Diseño de sistemas de alta disponibilidad: SLA 99.99%, caos engineering con Chaos Monkey',
   NOW(), NOW()),
  (v_ihc, v_tenant_id, v_s7,
   'Interacción Humano-Computador y UX Avanzado', 'IHC-701', 3, 32, 16,
   'Investigación de usuarios: entrevistas, encuestas, card sorting y user journey maps;Prototipado de alta fidelidad con Figma: componentes, variables, auto-layout y design tokens;Accesibilidad web y móvil: WCAG 2.2, ARIA y estándares ATAG;Evaluación de usabilidad: pruebas con usuarios reales, eye-tracking y métricas SUS/NPS;IA en UX: sistemas de recomendación, personalización y generación de interfaces con IA',
   NOW(), NOW()),
  (v_emp, v_tenant_id, v_s7,
   'Emprendimiento Tecnológico e Innovación', 'EMP-701', 3, 48, 0,
   'Lean Startup: ciclo Build-Measure-Learn, MVP y pivoting estratégico;Design Thinking: empatizar, definir, idear, prototipar y testear;Modelos de negocio en tecnología: SaaS, marketplace, API-first y freemium;Propiedad intelectual: patentes de software, licencias open source (MIT, Apache, GPL) y derechos de autor;Pitch deck: estructura, métricas de tracción (MRR, CAC, LTV) y rondas de inversión ángel/VC',
   NOW(), NOW()),

  -- ─── SEMESTRE 8 ────────────────────────────────────────────
  (v_iad, v_tenant_id, v_s8,
   'IA Aplicada al Desarrollo de Software', 'IAD-801', 3, 32, 16,
   'Herramientas AI-assisted development: GitHub Copilot, Cursor, Continue y Codeium;Generación automática de pruebas, documentación y código boilerplate con LLMs;Revisión de código asistida por IA: detección de bugs, code smells y vulnerabilidades;MLOps: despliegue de modelos con BentoML/Seldon, monitoreo de drift y reentrenamiento;Gobernanza de IA: explicabilidad (LIME, SHAP), auditoría de sesgos y cumplimiento normativo',
   NOW(), NOW()),
  (v_vvs, v_tenant_id, v_s8,
   'Verificación, Validación y Calidad del Software', 'VVS-801', 3, 48, 0,
   'Modelos de calidad: ISO/IEC 25010 (SQuaRE) y modelo de McCall;Inspecciones formales: Fagan inspection y revisiones de diseño estructuradas;Validación con usuarios reales: UAT, pruebas alfa/beta y A/B testing;Certificación de software: normas ISO 9001 aplicadas a TI y CMMI nivel 3;Dashboards de calidad: métricas de producto, proceso y satisfacción del usuario',
   NOW(), NOW()),
  (v_aud, v_tenant_id, v_s8,
   'Auditoría, Gobernanza y Cumplimiento TI', 'AUD-801', 3, 48, 0,
   'Marcos de gobernanza TI: COBIT 2019 e ITIL 4 aplicados a organizaciones;Auditoría de sistemas de información: evidencias, controles internos y hallazgos;Gestión de riesgos tecnológicos: ISO 27005 y NIST Cybersecurity Framework (CSF 2.0);Cumplimiento normativo: GDPR, PCI-DSS y Ley Orgánica de Protección de Datos del Ecuador;Continuidad del negocio y recuperación ante desastres (BCP/DRP) según ISO 22301',
   NOW(), NOW()),
  (v_etl, v_tenant_id, v_s8,
   'Ética, Sociedad Digital y Legislación Tecnológica', 'ETL-801', 3, 48, 0,
   'Ética en IA: sistemas autónomos de decisión, responsabilidad y regulación (EU AI Act 2024);Brecha digital, inclusión tecnológica y accesibilidad como derecho;Legislación ecuatoriana: Ley de Telecomunicaciones, Ley de Comercio Electrónico y LOPDP;Derechos digitales: privacidad, derecho al olvido y vigilancia algorítmica;Impacto ambiental de la tecnología: huella de carbono de los centros de datos y computación sostenible',
   NOW(), NOW()),
  (v_tit, v_tenant_id, v_s8,
   'Trabajo de Titulación', 'TIT-801', 3, 16, 32,
   'Formulación de propuesta de investigación y revisión sistemática del estado del arte;Metodología de investigación en ingeniería de software (Design Science, experimentos controlados);Desarrollo e implementación del proyecto o tesis con rigor científico y técnico;Defensa pública ante tribunal académico y respuesta a preguntas;Publicación y difusión de resultados en conferencias o revistas indexadas (Scopus, WoS)',
   NOW(), NOW());

  -- ============================================================
  -- STEP 6: Prerrequisitos (43 relaciones)
  -- ============================================================
  INSERT INTO prerequisites (id, tenant_id, subject_id, requires_id, created_at) VALUES
  -- S2 ← S1
  (gen_random_uuid()::TEXT, v_tenant_id, v_poo, v_lpa, NOW()),   -- POO ← Lógica Programación
  (gen_random_uuid()::TEXT, v_tenant_id, v_eda, v_poo, NOW()),   -- Estructuras ← POO
  (gen_random_uuid()::TEXT, v_tenant_id, v_dis, v_alg, NOW()),   -- Discretas ← Álgebra Lineal
  (gen_random_uuid()::TEXT, v_tenant_id, v_pro, v_cdi, NOW()),   -- Probabilidad ← Cálculo
  (gen_random_uuid()::TEXT, v_tenant_id, v_pam, v_poo, NOW()),   -- Prog. Avanzada ← POO
  -- S3 ← S2
  (gen_random_uuid()::TEXT, v_tenant_id, v_req, v_fin, NOW()),   -- Requisitos ← Fundamentos IS
  (gen_random_uuid()::TEXT, v_tenant_id, v_req, v_poo, NOW()),   -- Requisitos ← POO
  (gen_random_uuid()::TEXT, v_tenant_id, v_dcp, v_poo, NOW()),   -- Diseño/Construcción ← POO
  (gen_random_uuid()::TEXT, v_tenant_id, v_bdr, v_lpa, NOW()),   -- BD Relacionales ← Lógica Prog.
  (gen_random_uuid()::TEXT, v_tenant_id, v_bac, v_poo, NOW()),   -- Backend ← POO
  (gen_random_uuid()::TEXT, v_tenant_id, v_red, v_arc, NOW()),   -- Redes ← Arquitectura Comp.
  -- S4 ← S3
  (gen_random_uuid()::TEXT, v_tenant_id, v_fst, v_bac, NOW()),   -- Full-Stack ← Backend
  (gen_random_uuid()::TEXT, v_tenant_id, v_fst, v_bdr, NOW()),   -- Full-Stack ← BD Relacionales
  (gen_random_uuid()::TEXT, v_tenant_id, v_sei, v_dis, NOW()),   -- Seguridad ← Matemáticas Discretas
  (gen_random_uuid()::TEXT, v_tenant_id, v_agl, v_req, NOW()),   -- Ágiles ← Requisitos
  (gen_random_uuid()::TEXT, v_tenant_id, v_dev, v_red, NOW()),   -- DevOps ← Redes
  (gen_random_uuid()::TEXT, v_tenant_id, v_dev, v_bac, NOW()),   -- DevOps ← Backend
  (gen_random_uuid()::TEXT, v_tenant_id, v_bdn, v_bdr, NOW()),   -- BD NoSQL ← BD Relacionales
  -- S5 ← S4
  (gen_random_uuid()::TEXT, v_tenant_id, v_iaf, v_dis, NOW()),   -- IA Fund. ← Matemáticas Discretas
  (gen_random_uuid()::TEXT, v_tenant_id, v_iaf, v_pro, NOW()),   -- IA Fund. ← Probabilidad
  (gen_random_uuid()::TEXT, v_tenant_id, v_mal, v_iaf, NOW()),   -- ML ← IA Fundamentos
  (gen_random_uuid()::TEXT, v_tenant_id, v_mal, v_alg, NOW()),   -- ML ← Álgebra Lineal
  (gen_random_uuid()::TEXT, v_tenant_id, v_arq, v_dcp, NOW()),   -- Arquitectura SW ← Diseño/Construcción
  (gen_random_uuid()::TEXT, v_tenant_id, v_arq, v_dev, NOW()),   -- Arquitectura SW ← DevOps
  (gen_random_uuid()::TEXT, v_tenant_id, v_mov, v_fst, NOW()),   -- Móviles ← Full-Stack
  (gen_random_uuid()::TEXT, v_tenant_id, v_sed, v_sei, NOW()),   -- Seguridad Dev. ← Seguridad Informática
  -- S6 ← S5
  (gen_random_uuid()::TEXT, v_tenant_id, v_dpl, v_mal, NOW()),   -- Deep Learning ← ML
  (gen_random_uuid()::TEXT, v_tenant_id, v_pnl, v_dpl, NOW()),   -- PNL+GenAI ← Deep Learning
  (gen_random_uuid()::TEXT, v_tenant_id, v_ida, v_bdn, NOW()),   -- Ing. Datos ← BD NoSQL
  (gen_random_uuid()::TEXT, v_tenant_id, v_cap, v_dcp, NOW()),   -- Calidad ← Diseño/Construcción
  (gen_random_uuid()::TEXT, v_tenant_id, v_cld, v_dev, NOW()),   -- Cloud ← DevOps
  (gen_random_uuid()::TEXT, v_tenant_id, v_cld, v_arq, NOW()),   -- Cloud ← Arquitectura SW
  -- S7 ← S6
  (gen_random_uuid()::TEXT, v_tenant_id, v_vis, v_dpl, NOW()),   -- Visión ← Deep Learning
  (gen_random_uuid()::TEXT, v_tenant_id, v_cuq, v_alg, NOW()),   -- Cuántica ← Álgebra Lineal
  (gen_random_uuid()::TEXT, v_tenant_id, v_cuq, v_dis, NOW()),   -- Cuántica ← Matemáticas Discretas
  (gen_random_uuid()::TEXT, v_tenant_id, v_sds, v_arq, NOW()),   -- Sist. Distribuidos ← Arquitectura SW
  (gen_random_uuid()::TEXT, v_tenant_id, v_sds, v_cld, NOW()),   -- Sist. Distribuidos ← Cloud
  (gen_random_uuid()::TEXT, v_tenant_id, v_ihc, v_req, NOW()),   -- IHC ← Requisitos
  (gen_random_uuid()::TEXT, v_tenant_id, v_emp, v_agl, NOW()),   -- Emprendimiento ← Ágiles
  -- S8 ← S7
  (gen_random_uuid()::TEXT, v_tenant_id, v_iad, v_pnl, NOW()),   -- IA Dev SW ← PNL+GenAI
  (gen_random_uuid()::TEXT, v_tenant_id, v_iad, v_vis, NOW()),   -- IA Dev SW ← Visión Comp.
  (gen_random_uuid()::TEXT, v_tenant_id, v_vvs, v_cap, NOW()),   -- Verificación ← Calidad y Pruebas
  (gen_random_uuid()::TEXT, v_tenant_id, v_aud, v_sed, NOW()),   -- Auditoría ← Seguridad Dev.
  (gen_random_uuid()::TEXT, v_tenant_id, v_tit, v_arq, NOW())    -- Titulación ← Arquitectura SW
  ON CONFLICT (subject_id, requires_id) DO NOTHING;

  RAISE NOTICE '✅ Seed IS completado exitosamente';
  RAISE NOTICE '   Carrera: Ingeniería de Software (IS)';
  RAISE NOTICE '   Currículo: Pensum IS 2025 V1 — versión 2025-1';
  RAISE NOTICE '   Semestres: 8 | Materias: 40 | Prerrequisitos: 44 | Créditos: 120 | Horas: 5760';
END $SEED_IS$;
