REGISTRO DE CAMBIOS

Sesión de desarrollo — Dizi.pe SAAS

Miércoles 13 de Mayo 2026 · 21:00 – 22:00 PET

──────────────────────────────────────────────

Cambios aplicados

6

Bugs corregidos

4

Archivos tocados

5

Mejoras UX

2

# 1. Contexto de la sesión

Esta sesión de desarrollo se realizó el miércoles 13 de mayo de 2026, entre las 21:00 y las 22:00 horas (hora Perú). Los cambios abordan tres áreas: (1) completar el cableado de la ruta del Libro de Reclamaciones en el panel admin, (2) resolver un error crítico de localStorage que impedía guardar la configuración, y (3) corregir el comportamiento del catálogo público que mostraba datos incorrectos al cargar.

Campo

Detalle

Proyecto

Dizi.pe — SAAS de catálogos digitales multitenant

Fecha

Miércoles 13 de Mayo 2026

Hora inicio

21:00 PET (Peru Time, UTC-5)

Hora fin

22:00 PET aprox.

Entorno

localhost:5173 (Vite dev server) + Supabase cloud

Stack

React 18 + TypeScript + TanStack Router + Zustand + Supabase

Rama

main (desarrollo)

# 2. Cambios detallados

#01 Registro de ruta /admin/reclamaciones en el router — 21:05 PET

Tipo

🔗 Cableado

Archivo

src/routeTree.gen.ts

Problema

El archivo admin.reclamaciones.tsx existía pero no estaba registrado en routeTree.gen.ts. La URL /admin/reclamaciones devolvía 404.

Solución

Se agregó el import, la definición del Route, las entradas en FileRoutesByFullPath, FileRoutesByTo, FileRoutesById, los union types de fullPaths/to/id, AdminRouteChildren (interfaz y objeto), y el bloque FileRoutesByPath en el módulo declarado.

#02 Enlace "Reclamaciones" en sidebar y nav móvil del admin — 21:08 PET

Tipo

🎨 UX / Navegación

Archivo

src/components/admin/AdminSidebar.tsx · src/routes/admin.tsx

Problema

El panel de auditoría de reclamaciones no era accesible desde la navegación del admin. No había enlace en el sidebar ni en la barra móvil.

Solución

AdminSidebar.tsx: se añadió ítem "Reclamaciones" con ícono ClipboardList entre Configuración y Mi Plan. admin.tsx: se añadió MobileNavItem "Reclamos" con ícono ClipboardList en la barra fija del fondo para móvil.

#03 Fix QuotaExceededError — localStorage lleno — 21:15 PET

Tipo

🐛 Bug crítico

Archivo

src/lib/store.ts

Problema

Zustand persistía el store completo (incluyendo logo, bannerImage y products[].image con URLs de Supabase Storage) en localStorage. Con múltiples tiendas y productos con imágenes el JSON superaba el límite de ~5 MB del navegador. Error: "Failed to execute setItem on Storage: Setting the value of dizi-catalogos-v1 exceeded the quota." El admin mostraba "No se pudo actualizar la configuración" al guardar cualquier cambio.

Solución

Se modificó la función partialize para excluir logo, bannerImage y products[].image del objeto serializado. Las imágenes siempre se recargan desde Supabase en fetchData, no hace falta cachearlas. Se renombró la clave a dizi-catalogos-v2 para que el navegador descarte automáticamente la caché vieja llena. Se agregó limpieza automática de la clave v1 al arrancar la app.

#04 Fix "Tienda no encontrada" al primer load del catálogo público — 21:25 PET

Tipo

🐛 Bug UX

Archivo

src/routes/t.$slug.tsx

Problema

La ruta pública /t/:slug buscaba la tienda únicamente en el store de Zustand. Si el usuario recargaba la página, Supabase aún no había respondido y el store estaba vacío, mostrando "Tienda no encontrada" en lugar del catálogo.

Solución

Se refactorizó completamente t.$slug.tsx para que haga su propio fetch directo a Supabase por slug (fetchStoreBySlug). Mientras carga muestra un spinner. Ya no depende de Zustand para el catálogo público. Se eliminó el import de useApp de este archivo.

#05 Fix productos sample visibles en catálogo público — 21:35 PET

Tipo

🐛 Bug lógica

Archivo

src/components/public/PublicCatalog.tsx

Problema

Los productos de demostración (isSample: true) que se insertan automáticamente al crear una tienda eran visibles en el catálogo público. Un visitante de la tienda veía zapatillas de ejemplo (los productos sample del onboarding) mezclados con los productos reales del comerciante.

Solución

Se añadió !p.isSample al filtro de visibleProducts en el useMemo de filtered. Los productos sample son exclusivamente para previsualización interna en el admin. Se simplificó la lógica eliminando la variable hasOnlySamples que era redundante.

#06 Parche de datos: is_sample = false en tienda de prueba — 21:50 PET

Tipo

🗄️ Datos

Archivo

Supabase SQL Editor (base de datos)

Problema

La tienda de demostración admin-general-dizi-notienda0000 tenía 4 productos con is_sample = true. Con el nuevo filtro del cambio #05, solo se mostraba 1 producto real ("de idenza S/20"). Los 3 productos de ejemplo (Lentes de Sol, Taza de Cerámica, Bolso de Cuero) quedaban ocultos.

Solución

Se ejecutó UPDATE products SET is_sample = false WHERE store_id = (SELECT id FROM stores WHERE slug = 'admin-general-dizi-notienda0000') en el SQL Editor de Supabase. Todos los productos de la tienda de prueba ahora son visibles en el catálogo público.

# 3. Tabla resumen de cambios

#

Hora (PET)

Cambio

Archivo(s)

Tipo

01

21:05

Registrar ruta /admin/reclamaciones

routeTree.gen.ts

🔗 Cableado de ruta

02

21:08

Enlace en sidebar y nav móvil

AdminSidebar.tsx · admin.tsx

🎨 UX / Navegación

03

21:15

Fix QuotaExceededError localStorage

store.ts

🐛 Bug crítico

04

21:25

Fix "Tienda no encontrada" en catálogo

t.$slug.tsx

🐛 Bug UX

05

21:35

Ocultar productos sample en catálogo

PublicCatalog.tsx

🐛 Bug lógica

06

21:50

Parche is_sample en tienda de prueba

Supabase SQL

🗄️ Datos

# 4. Archivos modificados

Archivo

Cambios

Descripción

src/routeTree.gen.ts

#01

Registro completo de la ruta /admin/reclamaciones

src/components/admin/AdminSidebar.tsx

#02

Nuevo ítem Reclamaciones en sidebar desktop

src/routes/admin.tsx

#02

Nuevo MobileNavItem Reclamos en barra móvil

src/lib/store.ts

#03

partialize sin imágenes + limpieza clave v1 + renombrado a v2

src/routes/t.$slug.tsx

#04

Refactor completo: fetch propio por slug, spinner, sin Zustand

src/components/public/PublicCatalog.tsx

#05

Filtro !p.isSample en catálogo público

# 5. Impacto y estado del sistema

Funcionalidad

Estado tras la sesión

Ruta /admin/reclamaciones

✅ Accesible — sidebar + nav móvil

Guardar configuración en admin

✅ Funciona — error localStorage resuelto

Catálogo público al recargar

✅ Carga correcta desde Supabase siempre

Productos sample en catálogo

✅ Ocultos — solo se muestran productos reales

Tienda de prueba (notienda0000)

✅ Muestra todos sus productos

Libro de Reclamaciones (SQL)

⏳ Pendiente ejecutar SQL en Supabase

Miércoles 13 de Mayo 2026 · Generado automáticamente · Dizi.pe
