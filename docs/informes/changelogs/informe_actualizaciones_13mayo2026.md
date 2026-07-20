INFORME DE ACTUALIZACIONES

Dizi — Plataforma de Catálogos Digitales

Sesión de desarrollo: 13 de mayo de 2026

Desarrollador: Claude (Anthropic) · Proyecto: catalog-connect-main

Resumen Ejecutivo

En esta sesión se completaron 5 actualizaciones funcionales sobre el sistema Dizi: corrección del modelo Portada con Banner, integración de guías de imagen para el banner y el logo, creación de categorías inline desde el formulario de producto, corrección de bugs de truncación en archivos TypeScript, y generación del documento de arquitectura del sistema.

1.  CORRECCIONES DE BUGS

#

Funcionalidad

Descripcion

Estado

1

Bug: ModelDef.layout sin banner_grid

El tipo TypeScript de layout en admin.diseno.tsx no incluía 'banner_grid'. El modelo Portada con Banner fallaba silenciosamente.

Corregido

2

Bug: Panel de banner ignoraba modelo portada

El panel de subir imagen de portada solo se mostraba para el modelo 'elite'. Ahora también aparece para 'portada'.

Corregido

3

Truncación archivo admin.diseno.tsx

El archivo fue truncado durante ediciones previas. Restaurado desde git original + parches quirúrgicos en Python.

Corregido

4

Truncación admin.configuracion.tsx

Atributo className cortado a mitad de string. Reparado con Python rfind() sin perder cambios.

Corregido

5

Corrupción admin.productos.tsx con null bytes

El archivo quedó corrompido (relleno de bytes nulos). Reescrito completo desde la versión conocida correcta.

Corregido

2.  NUEVAS FUNCIONALIDADES

#

Funcionalidad

Descripcion

Estado

1

Guía de imagen para banner de portada

Se agregó un aviso visual en admin/diseño con la proporción recomendada: Panorámica 16:7, mínimo 1920×700 px, con enlace a squoosh.app.

Nuevo

2

Guía de imagen para el logo

La sección del logo en admin/configuración ahora muestra el badge: 'Cuadrado · 500×500 px · Se muestra circular'. Preview del logo cambiado a circular.

Nuevo

3

Creación de categorías inline en productos

El selector de categoría en el modal de producto tiene un botón '+' que abre un input inline para crear categorías sin salir del formulario. Guarda en Supabase y selecciona automáticamente.

Nuevo

4

Documento de arquitectura ARQUITECTURA.md

Archivo completo con tablas de BD, RPCs, planes, modelos, layouts, flujos y reglas de no romper. Guardado en la raíz del proyecto.

Nuevo

3.  DETALLE TÉCNICO

3.1 Corrección del modelo Portada con Banner

Se identificaron dos bugs independientes que hacían que el modelo 'Portada con Banner' no funcionara correctamente:

La interfaz ModelDef en admin.diseno.tsx definía el campo layout como unión de tipos sin incluir 'banner_grid', causando que TypeScript ignorara silenciosamente ese valor.

El panel de carga de imagen de portada solo se renderizaba cuando selectedModel === 'elite'. Se corrigió a: selectedModel === 'elite' || selectedModel === 'portada'.

El catálogo público (PublicCatalog.tsx) ya tenía correctamente 'banner_grid' en su ModelConfig.layout, por lo que el renderizado del lado del cliente no requirió cambios.

3.2 Guías de proporción de imagen

Se añadieron guías contextuales en dos puntos de la interfaz:

Banner de portada (admin/diseño): aviso con ratio 16:7, dimensión mínima 1920×700 px y enlace a squoosh.app. Aparece para modelos 'elite' y 'portada'.

Logo del negocio (admin/configuración): badge informativo con 500×500 px y aviso de visualización circular. El preview del logo fue actualizado de rounded-2xl a rounded-full.

3.3 Creación de categorías inline

Componente CategorySelect creado dentro de admin.productos.tsx. Al presionar el botón '+' junto al selector de categoría, aparece un input con autoFocus que permite:

Tecla Enter: confirmar y crear la categoría.

Tecla Escape o botón ✕: cancelar sin crear.

La categoría se guarda en Supabase vía upsertCategory() y se selecciona automáticamente en el producto que se está editando.

El componente aparece en ambos contextos: modo precio normal y modo precio oferta.

3.4 Estrategia de reparación de archivos truncados

Se detectó un patrón recurrente de truncación en archivos TypeScript grandes. La metodología de reparación utilizada fue:

Verificación con Python: leer el archivo en modo binario y revisar los últimos 80 bytes con repr().

Restauración desde git: obtener el archivo original con git show HEAD:ruta y aplicar solo los cambios necesarios con replace() de Python.

Verificación de balance de tags JSX: script Python que cuenta <div vs </div para detectar tags sin cerrar.

4.  ARCHIVOS MODIFICADOS

Archivo

Cambio principal

Tipo

src/routes/admin.diseno.tsx

Bug banner_grid + condición portada + guía banner

Fix + Mejora

src/routes/admin.configuracion.tsx

Guía de logo circular + badge 500×500 px

Mejora

src/routes/admin.productos.tsx

Componente CategorySelect inline + reescritura limpia

Nuevo + Fix

ARQUITECTURA.md

Documento completo de arquitectura y funcionalidades

Nuevo

5.  ESTADO DEL SISTEMA

TypeScript

0 errores nuevos

npx tsc --noEmit

Balance JSX

Tags balanceados

admin.diseno.tsx

Errores previos

2 pre-existentes

register.tsx (rutas)

Nota: Los 2 errores pre-existentes en register.tsx corresponden a rutas TanStack con '/#precios' que ya existían antes de esta sesión y no son parte de las modificaciones de hoy.

Dizi Catálogos Digitales · Informe generado automáticamente · 13 mayo 2026
