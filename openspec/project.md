# Proyecto: Dizi - Catálogo Dinámico SaaS

## Propósito

Dizi es una plataforma SaaS multi-tienda que permite a pequeños comercios peruanos crear un catálogo digital interactivo en minutos, con URL pública propia (`/t/:slug`), pedidos canalizados a WhatsApp, Bio-Link, planes por suscripción y Libro de Reclamaciones conforme a la normativa de INDECOPI.

## Contexto técnico

- **Frontend:** React 19 + TypeScript + Vite 7, TanStack Router/Start (rutas por archivos), Zustand, Tailwind CSS v4 + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage), RPCs `SECURITY DEFINER`, 32 migraciones SQL versionadas en `supabase/migrations/`
- **Despliegue:** Vercel (hosting + funciones `/api/seo`) y Supabase Cloud
- **Pruebas:** Vitest (66 casos PU/PI), Playwright (5 escenarios E2E), pipeline CI en `.github/workflows/ci.yml` con quality gate de cobertura ≥ 80% (`scripts/check-coverage.js`)

## Convenciones

- Enfoque **spec-driven**: la especificación se escribe y aprueba antes que el código; todo cambio de comportamiento actualiza primero su spec.
- Cada requisito tiene criterios de aceptación en formato **Given-When-Then (Gherkin)** de los que derivan los casos de prueba (matriz CP-01…CP-14 del informe IS-489).
- TypeScript estricto, ESLint + Prettier, commits convencionales.

## Estructura de especificaciones

| Capacidad | Spec | Requisitos |
|---|---|---|
| Catálogo público | `specs/catalogo-publico/spec.md` | RF-01, RF-03 |
| Pedidos por WhatsApp | `specs/pedidos-whatsapp/spec.md` | RF-02 |
| Registro por invitaciones | `specs/registro-invitaciones/spec.md` | RF-04 |
| Planes y suscripciones | `specs/planes-suscripciones/spec.md` | RF-05, RF-06 |
| Seguridad multi-tenant | `specs/seguridad-multitenant/spec.md` | RF-07, RF-08 |
| Libro de Reclamaciones | `specs/libro-reclamaciones/spec.md` | RF-09 |
| Bio-Link | `specs/bio-link/spec.md` | RF-10 |
| Requisitos no funcionales | `specs/no-funcionales/spec.md` | RNF-01…RNF-05 |
