# DIZI — Catálogo Dinámico SAAS

Plataforma SAAS para que comercios creen catálogos digitales interactivos, personalicen su diseño y reciban pedidos organizados por WhatsApp.

## Stack Tecnológico

- **Frontend:** SPA con React 19, TypeScript, Vite, TanStack Router y Zustand.
- **Backend / DB:** Supabase (PostgreSQL con RLS estricta, Supabase Auth y Storage).
- **Alojamiento:** Vercel (SPA con rewrites y middleware serverless para metadatos SEO en `api/seo.ts`).

## Cómo levantar el proyecto localmente

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Variables de entorno:**
   Crear un archivo `.env` en la raíz con las credenciales de Supabase (sin comillas):
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

## Pruebas y Calidad de Código

- **Pruebas unitarias e integración:**
  ```bash
  npm test
  # o: npx vitest run
  ```
- **Análisis estático (Lint):**
  ```bash
  npm run lint
  ```
- **Compilación para producción:**
  ```bash
  npm run build
  ```
- **Pruebas End-to-End (Playwright):**
  ```bash
  npx playwright test
  ```

## Documentación del Sistema

Toda la documentación técnica y funcional oficial se encuentra en `INFORMACIÓN NECESARIA/`:
- **`AGENTS.md`**: Reglas obligatorias de desarrollo, seguridad y jerarquía de verdad.
- **`04-TECNICA/FUENTE-DE-VERDAD.md`**: Única fuente de verdad del estado técnico verificado.
- **`04-TECNICA/ARQUITECTURA-ACTUAL.md`**: Diagrama de arquitectura, componentes y flujos.
- **`03-PRODUCTO-Y-REQUISITOS/REQUISITOS-FUNCIONALES.md`**: Mapa funcional y lista de verificación "no romper".
