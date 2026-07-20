UNIVERSIDAD NACIONAL DE SAN CRISTÓBAL DE HUAMANGA

FACULTAD DE INGENIERÍA DE MINAS, GEOLOGÍA Y CIVIL

ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS

PRUEBAS Y ASEGURAMIENTO DE CALIDAD DE SOFTWARE (IS-489)

INFORME FINAL DEL PROYECTO INTEGRADOR

Plan de Pruebas y Aseguramiento de la Calidad del Sistema

DIZI — Catálogo Dinámico SaaS

Docente: Mg. Richard Zapata Casaverde

Estudiante: Jack Franklin Quispe Luján

Semestre Académico: 2026-I

Ayacucho — Perú

Julio de 2026

# Índice

# 1. Introducción

El presente informe documenta el desarrollo, diseño y —de manera central— el proceso de pruebas y aseguramiento de la calidad del sistema Dizi, una plataforma SaaS (Software as a Service) de catálogos digitales dinámicos orientada a pequeños comercios del Perú. El trabajo se enmarca en el Proyecto Integrador Final de la asignatura Pruebas y Aseguramiento de Calidad de Software (IS-489), y recorre el ciclo completo exigido: gestión ágil con Scrum, documento de diseño de software (SDD) con su arquitectura y especificaciones, construcción del código, diseño y ejecución de pruebas unitarias (PU) y de integración (PI), automatización con integración continua, métricas de calidad y despliegue en producción.

La calidad se aborda como responsabilidad transversal del equipo y no como una fase final aislada: cada incremento de producto incorpora criterios de aceptación verificables, casos de prueba trazables a los requisitos y compuertas de calidad automatizadas en el flujo de integración continua, en concordancia con las normas ISO/IEC/IEEE 29119 (proceso y documentación de pruebas) e ISO/IEC 25010 (modelo de calidad del producto).

## 1.1 Objetivos

Documentar la arquitectura y el diseño (A+D) del sistema Dizi mediante un SDD con especificaciones verificables.

Elaborar un plan de pruebas alineado a ISO/IEC/IEEE 29119, con estrategia, niveles, criterios de entrada/salida y gestión de defectos.

Diseñar casos de prueba funcionales con partición de equivalencia y análisis de valores límite, trazables a los requisitos.

Implementar pruebas unitarias y de integración automatizadas sobre módulos reales del sistema.

Definir un pipeline CI/CD con ejecución automática de pruebas y compuerta de calidad.

Medir la calidad con métricas objetivas (cobertura, densidad de defectos) y proponer mejoras.

## 1.2 Alcance

El alcance cubre la totalidad del producto Dizi en su estado actual desplegado: catálogo público multi-tienda, panel de administración del comerciante, panel superadministrador, Bio-Link, Libro de Reclamaciones, gestión de planes y suscripciones, y la base de datos PostgreSQL administrada en Supabase con sus políticas de seguridad a nivel de fila (RLS).

# 2. Descripción del Proyecto: Dizi

Dizi es una plataforma web que permite a un pequeño comercio crear en minutos un catálogo digital interactivo, accesible mediante una URL pública propia (/t/:slug), con pedidos canalizados directamente a WhatsApp. El problema que resuelve es la baja digitalización de los micronegocios: la mayoría publica sus productos en redes sociales de forma desordenada, sin precios actualizados ni un canal formal de pedidos.

## 2.1 Usuarios del sistema

Rol

Descripción

Visitante público

Consume el catálogo (/t/:slug) y el Bio-Link (/bio/:slug) sin autenticarse; realiza pedidos vía WhatsApp y puede registrar reclamos en el Libro de Reclamaciones.

Dueño de tienda

Administra su catálogo desde el panel /admin: productos, categorías, diseño, configuración del negocio, plan y reclamaciones.

Superadministrador

Gestiona todas las tiendas desde /super: invitaciones, suscripciones, promociones, referidos y diagnóstico global.

## 2.2 Funcionalidades principales

Catálogo público personalizable con modelos de diseño estándar y premium por nicho (restaurante/cafetería).

Gestión de productos y categorías con límites según plan contratado (semilla, emprendedor, pro, ilimitado).

Pedidos por WhatsApp con construcción automática del mensaje y del enlace wa.me.

Bio-Link con ubicación en mapa (Leaflet), fondos y tipografía personalizables.

Libro de Reclamaciones conforme a la normativa peruana de protección al consumidor.

Suscripciones con fecha de vencimiento, días de gracia y degradación automática de funcionalidades.

Exportación del catálogo a PDF (jsPDF + html2canvas) y estadísticas de visitas.

# 3. Metodología de Gestión: Scrum

El proyecto se gestionó con Scrum, con sprints de dos semanas, un Product Backlog priorizado por valor de negocio y una Definición de Hecho (DoD) que exige: código revisado, especificación actualizada, casos de prueba diseñados y ejecutados, y despliegue verificado en producción. La evidencia del avance por sprint es verificable en el historial de migraciones de base de datos y en el registro de versiones del repositorio (docs/actualizaciones V1 a V1.4).

## 3.1 Roles

Rol

Responsable / Función

Product Owner

Define y prioriza el backlog según necesidades de los comercios; valida los incrementos.

Scrum Master

Facilita las ceremonias, remueve impedimentos y vela por la DoD.

Equipo de Desarrollo

Diseña, construye, prueba y despliega cada incremento (desarrollo asistido por IA declarado en la sección 5).

## 3.2 Sprints ejecutados (evidencia en migraciones y versiones)

Sprint

Periodo

Incremento entregado

Sprint 1

09–16 may. 2026

Esquema inicial de BD, catálogo público, sistema de invitaciones, gestión de suscripciones (RPC), RLS multi-tenant y Libro de Reclamaciones.

Sprint 2

26 may.–05 jun. 2026

Bio-Link con ubicación, personalización de fondos y tipografía, endurecimiento del RPC público, contador de visitas y estadísticas.

Sprint 3

11–22 jun. 2026

Mitigaciones de seguridad (roles en app_metadata, RLS de invites/reclamaciones), precios y promociones de planes, invitaciones dinámicas, ordenamiento de productos y branding configurable.

Sprint 4

28 jun.–06 jul. 2026

Correcciones del diagnóstico superadmin, límites PLG en get_public_store, recompensas por referidos con vigencia temporal; estabilización y cierre.

## 3.3 Ceremonias y artefactos

Se realizaron Sprint Planning (selección de historias con criterios de aceptación en formato Given-When-Then), Daily de seguimiento, Sprint Review con demostración sobre el ambiente de producción y Sprint Retrospective con acuerdos de mejora. Los artefactos —Product Backlog, Sprint Backlog e Incremento— se gestionaron sobre GitHub (issues y milestones), quedando la trazabilidad requisito → commit → prueba documentada en la matriz de la sección 7.3.

# 4. SDD — Documento de Diseño de Software

Esta sección constituye el SDD del sistema y cubre el bloque A+D (Arquitectura y Diseño) del esquema de entrega: especificaciones (Spec Kit / OpenSpec), arquitectura, modelo de datos, diseño de seguridad y manual.

## 4.1 Especificación de requisitos (Spec Kit / OpenSpec)

Las funcionalidades se especificaron siguiendo el enfoque spec-driven (especificación antes que código): cada capacidad del sistema cuenta con una especificación versionada en el repositorio (docs/tecnica) que describe intención, comportamiento esperado y criterios de aceptación; los cambios pasan por una propuesta que actualiza la especificación antes de modificar el código. Los requisitos funcionales priorizados son:

Código

Requisito funcional

Fuente de especificación

RF-01

Publicar catálogo público por slug con productos, categorías y diseño personalizado.

ARQUITECTURA.md §2, §3

RF-02

Construir pedido y enlace de WhatsApp con mensaje codificado y teléfono normalizado.

whatsapp.ts (contrato)

RF-03

Formatear precios en soles; sin precio definido debe mostrarse “A consultar”.

whatsapp.ts (contrato)

RF-04

Registrar tiendas solo mediante token de invitación válido, no vencido y no usado.

SEGURIDAD.md §2.B

RF-05

Aplicar límites de productos y funcionalidades según plan y estado de suscripción.

types.ts / DOCUMENTACION_PLANES.md

RF-06

Degradar tienda vencida respetando días de gracia (3 días) y modelo de gracia (15 días).

types.ts (GRACE_DAYS)

RF-07

Aislar datos entre tiendas: un comercio no accede a datos de otro (RLS).

SEGURIDAD.md §2

RF-08

Impedir escalación de privilegios a super_admin desde metadatos del cliente.

SEGURIDAD.md §3

RF-09

Gestionar Libro de Reclamaciones con registro público y atención desde el panel.

Informe_Libro_Reclamaciones

RF-10

Editar Bio-Link con ubicación, fondos y tipografía según plan.

ARQUITECTURA.md §2

Requisitos no funcionales (ISO/IEC 25010): seguridad (RLS, CSP, HSTS), rendimiento (respuesta del catálogo público < 2 s en 4G), compatibilidad móvil (diseño mobile-first), mantenibilidad (tipado estricto TypeScript, componentes shadcn/ui) y fiabilidad (captura global de errores con error-capture.ts).

## 4.2 Arquitectura del sistema

Dizi implementa una arquitectura cliente-servidor serverless de tres capas: presentación (SPA React), servicios gestionados (Supabase: API REST/RPC autogenerada, Auth y Storage) y datos (PostgreSQL con RLS). El frontend se distribuye por CDN (Vercel) y funciones serverless resuelven el SEO dinámico de las rutas públicas.

Capa

Tecnología

Frontend

React 19 + TypeScript + Vite 7; TanStack Router/Start (rutas basadas en archivos)

Estado global

Zustand con middleware persist

UI / Estilos

Tailwind CSS v4 + shadcn/ui; notificaciones con Sonner

Backend / BD

Supabase: PostgreSQL + Auth + Storage; funciones RPC SECURITY DEFINER

Utilidades

Conversión WebP en cliente, Leaflet (mapas), jsPDF + html2canvas (PDF)

Despliegue

Vercel (hosting + funciones /api/seo) y Supabase Cloud; configuración alternativa Cloudflare Workers (wrangler)

## 4.3 Modelo de datos

La base de datos evolucionó mediante 30 migraciones SQL versionadas (supabase/migrations), lo que garantiza reproducibilidad del esquema en cualquier ambiente. Las tablas principales son:

Tabla

Propósito

stores

Tiendas: slug, datos comerciales, diseño, plan, vencimiento y estado de suscripción.

products / categories

Catálogo de cada tienda, con orden personalizado (sort_order) y filtro de precios.

invites

Tokens de invitación para registro controlado; validación ciega vía RPC check_invite.

complaints

Libro de Reclamaciones: reclamos públicos asociados a cada tienda.

bio_links / stats

Configuración del Bio-Link y contadores de visitas del catálogo.

## 4.4 Diseño de seguridad

RLS multi-tenant: Row Level Security en todas las tablas; lectura pública solo de tiendas activas y publicadas; mutaciones restringidas a auth.uid() = owner_id.

Anti-escalación de roles: el trigger trg_user_sync_role fuerza el rol store_owner ante cualquier intento de asignarse super_admin desde metadatos públicos.

RPC endurecidos: get_public_store y check_invite exponen solo datos mínimos mediante funciones SECURITY DEFINER.

Cabeceras HTTP: CSP estricta, HSTS con preload, X-Frame-Options DENY y Permissions-Policy configuradas en vercel.json.

Gestión de secretos: variables VITE\_ públicas protegidas por RLS; tokens privados solo en el servidor; .env excluido del control de versiones.

## 4.5 Manual

El manual del sistema se organiza en dos partes y se adjunta como anexo: (a) Manual de usuario, que guía al comerciante en el registro por invitación, la carga de productos, la personalización del diseño y la publicación del catálogo; y (b) Manual técnico, que documenta la instalación local (npm install, npm run dev), las variables de entorno, la ejecución de migraciones con Supabase CLI y el procedimiento de despliegue descrito en la sección 12.

# 5. Código Fuente y Repositorio (GitHub)

El código fuente completo y las migraciones de base de datos se gestionan en GitHub, en el repositorio oficial: https://github.com/lovableprojectscx/Dizi.git. El flujo de trabajo emplea ramas por funcionalidad, pull requests con revisión y mensajes de commit convencionales; las migraciones SQL versionadas cumplen el rol de código fuente de la base de datos.

Convenciones: TypeScript estricto, ESLint + Prettier (npm run lint / npm run format), componentes funcionales y rutas basadas en archivos.

Estructura: src/lib (lógica de negocio y acceso a datos), src/routes (páginas), src/components (UI), supabase/migrations (BD), api/ (funciones serverless), docs/ (especificaciones e informes).

Asistencia de IA: se declara el uso de herramientas de inteligencia artificial como asistentes de generación y revisión de código; todo código asistido fue revisado, adaptado y validado por el equipo mediante las pruebas descritas en este informe, manteniendo la responsabilidad técnica en el desarrollador.

# 6. Plan de Pruebas (ISO/IEC/IEEE 29119)

## 6.1 Estrategia y niveles de prueba

La estrategia combina pruebas estáticas (revisiones de especificación, linting, análisis estático) y dinámicas en cuatro niveles, priorizando la automatización de los módulos de mayor riesgo de negocio: lógica de planes/suscripciones, seguridad multi-tenant y flujo de pedido.

Nivel

Objeto de prueba

Herramientas

Unitarias (PU)

Funciones puras de src/lib: whatsapp.ts, types.ts (planes, vencimientos, límites), image-utils.

Vitest

Integración (PI)

RPCs de Supabase (check_invite, get_public_store), políticas RLS, store Zustand ↔ API.

Vitest + Supabase local (CLI)

Sistema / E2E

Flujos críticos: registro por invitación, publicación de catálogo, pedido por WhatsApp, reclamo.

Playwright

API

Endpoints REST/RPC de Supabase y función /api/seo.

Postman + Newman

No funcionales

Rendimiento del catálogo público y seguridad de la aplicación.

k6, OWASP ZAP, SonarQube

## 6.2 Criterios de entrada y salida

Entrada: especificación de la historia aprobada, criterios de aceptación en Given-When-Then, ambiente de pruebas disponible con migraciones aplicadas y datos semilla (mock-data.ts).

Salida: 100 % de casos planificados ejecutados; 0 defectos críticos o altos abiertos; cobertura de líneas ≥ 80 % en src/lib; quality gate del pipeline en verde.

Suspensión/reanudación: se suspende la ejecución ante defectos bloqueantes del ambiente; se reanuda tras verificación de la corrección con pruebas de regresión.

## 6.3 Gestión de defectos

Los defectos se registran en GitHub Issues con plantilla técnica: pasos de reproducción, resultado esperado vs. obtenido, evidencia, severidad (crítica, alta, media, baja) y prioridad. La trazabilidad requisito → caso de prueba → defecto se mantiene en la matriz de la sección 7.3. Como evidencia del proceso real del proyecto, la auditoría del defecto de descripción de productos (21/06/2026) y la evaluación del ordenamiento superadmin (28/06/2026) están documentadas en docs/informes.

## 6.4 Riesgos del plan

Riesgo

Mitigación

Regresiones en RLS al modificar políticas de BD

Suite PI dedicada a políticas RLS ejecutada en cada pipeline.

Dependencia de servicios externos (Supabase, WhatsApp)

Dobles de prueba (mocks) en PU; pruebas de contrato en PI.

Datos de producción en pruebas

Ambiente aislado con Supabase local y datos sintéticos.

Escaso tiempo de ejecución manual

Priorización por riesgo y automatización de regresión.

# 7. Diseño de Casos de Prueba

## 7.1 Técnicas aplicadas

Se aplicó partición de equivalencia y análisis de valores límite sobre los contratos de las funciones de negocio. Ejemplo para formatPrice(n) (RF-03): clases válidas {n > 0}, {n con decimales}; clases inválidas o especiales {n = 0}, {n = null}, {n = undefined}; límites {0, 0.01, valores con más de dos decimales}. Para la lógica de vencimiento (RF-06) los límites son el día exacto de expiración y los bordes del periodo de gracia (día 3 y día 4 posteriores).

## 7.2 Matriz de casos de prueba (extracto)

Caso

Entrada

Resultado esperado

Técnica / Requisito

CP-01

formatPrice(25.5)

“S/ 25.50”

Equivalencia válida / RF-03

CP-02

formatPrice(0)

“A consultar”

Valor límite / RF-03

CP-03

formatPrice(null)

“A consultar”

Clase especial / RF-03

CP-04

formatPrice(0.005)

“S/ 0.01” (redondeo)

Valor límite / RF-03

CP-05

buildWaUrl(“+51 966-123-456”, “Hola ¿precio?”)

https://wa.me/51966123456?text=Hola%20%C2%BFprecio%3F

Equivalencia / RF-02

CP-06

Suscripción vence hoy

Plan efectivo se mantiene (día 0 dentro de gracia)

Valor límite / RF-06

CP-07

Vencida hace 3 días

Último día de gracia: acceso conservado

Valor límite / RF-06

CP-08

Vencida hace 4 días

isSubscriptionExpired = true; degradación a límites de plan semilla

Valor límite / RF-06

CP-09

Tienda plan “pro” solicita producto n.º (límite + 1)

Rechazo por getEffectiveProductLimit

Valor límite / RF-05

CP-10

check_invite(token válido)

Devuelve datos del plan

Equivalencia válida / RF-04

CP-11

check_invite(token vencido o usado)

Resultado vacío

Equivalencia inválida / RF-04

CP-12

Usuario A consulta productos de tienda B (RLS)

0 filas devueltas

Seguridad / RF-07

CP-13

Registro enviando rol super_admin en metadatos

Rol forzado a store_owner por trigger

Seguridad / RF-08

CP-14

GET /t/:slug de tienda no publicada

Catálogo no visible (404 / vacío)

Equivalencia inválida / RF-01

## 7.3 Matriz de trazabilidad requisitos ↔ pruebas

Requisito

Casos de prueba

Nivel

RF-01

CP-14; E2E-01 (publicación y visualización de catálogo)

E2E / Sistema

RF-02

CP-05; E2E-03 (pedido por WhatsApp)

PU / E2E

RF-03

CP-01 a CP-04

PU

RF-04

CP-10, CP-11; E2E-02 (registro por invitación)

PI / E2E

RF-05

CP-09

PU

RF-06

CP-06 a CP-08

PU

RF-07

CP-12

PI

RF-08

CP-13

PI

RF-09

E2E-04 (registro y atención de reclamo)

E2E

RF-10

E2E-05 (edición de Bio-Link según plan)

E2E

# 8. Pruebas Unitarias (PU)

Las pruebas unitarias se implementan con Vitest (framework nativo del ecosistema Vite del proyecto) sobre las funciones puras de src/lib, que concentran las reglas de negocio. Ejemplo de la suite para RF-03 y RF-02:

// src/lib/**tests**/whatsapp.test.ts

import { describe, it, expect } from 'vitest';

import { formatPrice, buildWaUrl } from '../whatsapp';

describe('formatPrice (RF-03)', () => {

it('CP-01: formatea precio positivo', () =>

expect(formatPrice(25.5)).toBe('S/ 25.50'));

it('CP-02: precio 0 -> A consultar', () =>

expect(formatPrice(0)).toBe('A consultar'));

it('CP-03: null/undefined -> A consultar', () => {

expect(formatPrice(null)).toBe('A consultar');

expect(formatPrice(undefined)).toBe('A consultar');

});

});

describe('buildWaUrl (RF-02)', () => {

it('CP-05: limpia el teléfono y codifica el mensaje', () =>

expect(buildWaUrl('+51 966-123-456', 'Hola'))

.toBe('https://wa.me/51966123456?text=Hola'));

});

Para la lógica de suscripciones (RF-05, RF-06) se construyen tiendas sintéticas con fechas controladas y se verifican los bordes del periodo de gracia (GRACE_DAYS = 3): día de vencimiento, día 3 (último con acceso) y día 4 (degradación). La suite se ejecuta con npm run test y el reporte de cobertura (V8) se publica como artefacto del pipeline; el objetivo de cobertura en src/lib es ≥ 80 % de líneas y ramas.

# 9. Pruebas de Integración (PI)

Las PI validan la interacción real entre la aplicación y Supabase sobre una instancia local levantada con Supabase CLI (supabase start), a la que se aplican las 30 migraciones del repositorio; así, cada ejecución valida también que el esquema es reproducible. Los focos son los contratos de los RPC y las políticas RLS:

// tests/integration/security.test.ts (extracto)

it('CP-12: RLS impide leer productos de otra tienda', async () => {

const { data } = await clientA.from('products')

.select('\*').eq('store_id', storeB.id);

expect(data).toHaveLength(0); // 0 filas, no error

});

it('CP-11: check_invite con token usado devuelve vacio', async () => {

const { data } = await anon.rpc('check_invite',

{ p_token: usedToken });

expect(data).toEqual([]);

});

Complementariamente, las pruebas de API con Postman/Newman cubren los endpoints públicos (REST autogenerado y /api/seo), verificando códigos de estado, esquemas de respuesta y tiempos; la colección se ejecuta en el pipeline con newman run dizi-api.postman_collection.json.

# 10. Pruebas de Sistema y End-to-End

Con Playwright se automatizan los cinco flujos críticos identificados en la matriz de trazabilidad, con evidencias (capturas y video) generadas en cada ejecución:

Escenario

Flujo validado (Given-When-Then)

E2E-01

Dado un dueño autenticado con productos cargados, cuando publica su catálogo, entonces /t/:slug muestra productos, precios formateados y diseño seleccionado.

E2E-02

Dado un token de invitación válido, cuando el usuario completa el registro, entonces se crea la tienda con el plan del token; con token vencido, el registro se rechaza.

E2E-03

Dado un visitante en el catálogo, cuando arma un pedido y pulsa “Pedir por WhatsApp”, entonces se abre wa.me con el mensaje correcto y codificado.

E2E-04

Dado un visitante, cuando registra un reclamo en el Libro de Reclamaciones, entonces el dueño lo visualiza y gestiona en /admin/reclamaciones.

E2E-05

Dado un plan sin funciones premium, cuando el dueño intenta usar fondos premium del Bio-Link, entonces la función aparece bloqueada con invitación a mejorar de plan.

# 11. Automatización y CI/CD

El pipeline de integración continua se define en GitHub Actions y se ejecuta en cada push y pull request hacia main. Las etapas encadenan análisis estático, PU con cobertura, PI contra Supabase local, colección de API y E2E, y finalizan en una compuerta de calidad que bloquea el merge si algún umbral falla:

# .github/workflows/ci.yml (resumen)

name: CI Dizi

on: [push, pull_request]

jobs:

quality:

runs-on: ubuntu-latest

steps:

- uses: actions/checkout@v4

- run: npm ci

- run: npm run lint # analisis estatico

- run: npx vitest run --coverage # PU + cobertura

- run: supabase start && npx vitest run tests/integration # PI

- run: npx newman run dizi-api.postman_collection.json # API

- run: npx playwright test # E2E

- name: Quality gate

run: node scripts/check-coverage.js --min 80

La compuerta de calidad (quality gate) exige: lint sin errores, 100 % de suites en verde, cobertura ≥ 80 % en src/lib y 0 vulnerabilidades altas en el análisis de dependencias (npm audit). El despliegue continuo queda a cargo de Vercel, que solo publica al aprobarse el pipeline sobre main, materializando el flujo Código → PU/PI → Despliegue del plan de entrega.

# 12. Pruebas No Funcionales

## 12.1 Rendimiento y carga (k6)

Sobre el catálogo público (ruta de mayor tráfico) se define un escenario k6 de 50 usuarios virtuales durante 3 minutos con umbrales: p95 de tiempo de respuesta < 800 ms y tasa de error < 1 %. El RPC get_public_store, optimizado en las migraciones de mayo (limpieza de imágenes base64 y muestras optimizadas), es el principal objeto de medición.

## 12.2 Seguridad (SAST/DAST)

SAST: análisis estático con SonarQube/CodeQL sobre el repositorio para detectar code smells y vulnerabilidades de código.

DAST: escaneo básico con OWASP ZAP sobre el ambiente de pruebas, validando además las mitigaciones ya implementadas: CSP, HSTS, X-Frame-Options, RLS y anti-escalación de roles (CP-12, CP-13).

Dependencias: npm audit en el pipeline con bloqueo ante vulnerabilidades altas o críticas.

# 13. Métricas de Calidad

El seguimiento de la calidad se realiza con indicadores objetivos alineados a ISO/IEC 25010, reportados por el pipeline en cada ejecución:

Métrica

Objetivo

Fuente

Cobertura de líneas en src/lib

≥ 80 %

Vitest --coverage (V8)

Cobertura de ramas en lógica de planes

≥ 75 %

Vitest --coverage

Casos de prueba ejecutados vs. planificados

100 %

Reporte CI

Defectos críticos/altos abiertos

0 al cierre de sprint

GitHub Issues

Densidad de defectos

< 1 por KLOC

Issues / tamaño del repo

p95 catálogo público

< 800 ms

k6

Vulnerabilidades altas (SAST/DAST/deps)

0

ZAP, CodeQL, npm audit

La evolución de estas métricas por sprint permite decisiones basadas en evidencia: por ejemplo, el defecto de descripción de productos auditado el 21/06/2026 motivó la incorporación de casos de regresión específicos y elevó el umbral de cobertura del módulo afectado.

# 14. Despliegue

El sistema se encuentra desplegado en producción con la siguiente topología: frontend y funciones serverless en Vercel (con rewrites para el SEO dinámico de /t/:slug y /bio/:slug y cabeceras de seguridad definidas en vercel.json), y base de datos, autenticación y almacenamiento en Supabase Cloud. Existe además configuración alternativa para Cloudflare Workers (wrangler.jsonc).

Procedimiento: merge a main con pipeline aprobado → build automático en Vercel (vite build) → publicación atómica con rollback disponible por despliegue previo.

Base de datos: las migraciones se aplican con Supabase CLI (supabase db push) antes de publicar cambios de frontend dependientes del esquema.

Verificación post-despliegue: smoke test automatizado (carga del catálogo demo, login y llamada a get_public_store) y revisión de cabeceras de seguridad con curl -I.

Variables de entorno: cargadas en el panel del proveedor; nunca en el repositorio (.env en .gitignore).

# 15. Propuesta de Mejora y Lecciones Aprendidas

## 15.1 Propuesta de mejora

Ampliar la suite E2E con pruebas de regresión visual (capturas comparadas) para los modelos de diseño premium.

Incorporar pruebas de mutación (Stryker) sobre src/lib para medir la efectividad real de la suite unitaria.

Añadir observabilidad en producción (OpenTelemetry + panel de métricas) para correlacionar defectos con uso real.

Automatizar pruebas de accesibilidad (axe-core en Playwright) en el catálogo público.

Formalizar TDD para nuevas reglas de negocio: prueba primero, implementación después, refactorización con red de seguridad.

## 15.2 Lecciones aprendidas

Especificar antes de codificar (enfoque spec-driven) redujo retrabajos y facilitó derivar casos de prueba directamente de los contratos.

Los defectos más costosos se concentraron en integraciones (RLS, RPC), lo que valida priorizar PI sobre la capa de seguridad.

Versionar la base de datos como código (migraciones) resultó esencial para reproducir el ambiente de pruebas.

La calidad como criterio de la Definición de Hecho evita acumular deuda de pruebas al final del proyecto.

# 16. Conclusiones

El proyecto integrador demuestra la aplicación completa del ciclo de pruebas y aseguramiento de calidad sobre un producto real en producción: a partir de especificaciones verificables se derivaron casos de prueba con técnicas formales (partición de equivalencia y valores límite), trazables a los requisitos; se implementaron pruebas unitarias y de integración automatizadas sobre los módulos de mayor riesgo; y se definió un pipeline CI/CD con compuerta de calidad que convierte las pruebas en una barrera automática previa al despliegue.

El enfoque de calidad transversal —Scrum con DoD que exige pruebas, seguridad verificada por casos específicos (RLS y anti-escalación) y métricas objetivas alineadas a ISO/IEC 25010— confirma que la calidad del software no es una fase, sino una propiedad emergente del proceso. Las propuestas de mejora (pruebas de mutación, regresión visual y observabilidad) trazan la ruta de madurez del proceso de pruebas de Dizi.

# Bibliografía

Crispin, L., & Gregory, J. (2009). Agile testing: A practical guide for testers and agile teams. Addison-Wesley Professional.

Fowler, M. (2019). Refactoring: Improving the design of existing code (2.ª ed.). Addison-Wesley Professional.

Humble, J., & Farley, D. (2010). Continuous delivery: Reliable software releases through build, test, and deployment automation. Addison-Wesley Professional.

International Organization for Standardization. (2021–2022). ISO/IEC/IEEE 29119 (Partes 1–4): Software and systems engineering — Software testing. ISO.

International Organization for Standardization. (2023). ISO/IEC 25010:2023. Systems and software engineering — SQuaRE — Product quality model. ISO.

International Software Testing Qualifications Board. (2023). Certified Tester Foundation Level (CTFL) v4.0. ISTQB.

Myers, G. J., Sandler, C., & Badgett, T. (2011). The art of software testing (3.ª ed.). John Wiley & Sons.

OWASP Foundation. (2020). OWASP Web Security Testing Guide (WSTG).

Pressman, R. S., & Maxim, B. R. (2019). Software engineering: A practitioner's approach (9.ª ed.). McGraw-Hill Education.

# Anexos

Anexo A: Repositorio en GitHub con código fuente y base de datos (migraciones SQL): https://github.com/lovableprojectscx/Dizi.git

Anexo B: Especificaciones técnicas del sistema (docs/tecnica: ARQUITECTURA.md, SEGURIDAD.md, DOCUMENTACION_PLANES.md, MODELADO_GESTION_PLANES.md).

Anexo C: Informes de auditoría y evaluación de defectos (docs/informes: auditoría del 21/06/2026 y evaluación del 28/06/2026).

Anexo D: Registro de versiones del producto V1 a V1.4 (docs/actualizaciones).

Anexo E: Manual de usuario y manual técnico de instalación y despliegue.
