# AGENTS.md — Reglas de trabajo en DIZI

Rige para cualquier agente (Antigravity, Claude u otro) que lea, cambie o documente este proyecto.
Última actualización: 25 sep 2026 · Responsable: Jack (Idenza).

## 0. Antes de empezar cualquier tarea

1. Leer `../../INFORMACIÓN NECESARIA/04-TECNICA/FUENTE-DE-VERDAD.md`. Es el único documento que
   describe el estado **verificado** del sistema. Si otro documento lo contradice, gana FUENTE-DE-VERDAD.
2. Leer el encargo concreto que se está ejecutando (`../../INFORMACIÓN NECESARIA/04-TECNICA/encargos/`).
   **No hacer nada que el encargo no pida.** Lo que se descubra fuera de alcance se anota, no se arregla.

## 1. Jerarquía de verdad (de mayor a menor)

1. **Producción real**: lo que devuelve la base de datos viva y lo que responde `https://dizi.idenza.site`.
2. **El código de este repo** en la rama `master`.
3. `FUENTE-DE-VERDAD.md`.
4. Cualquier otro documento, spec, comentario o nombre de variable. **Son hipótesis hasta verificarlas.**

Las migraciones de `supabase/migrations/` **NO representan la base de producción**: solo una está registrada
como aplicada y hay cambios hechos a mano desde `scratch/`. Para saber cómo es una función, tabla o política
se consulta producción (`pg_get_functiondef`, `pg_policies`, `information_schema`), nunca el archivo.

## 2. Reglas contra la alucinación (obligatorias)

- **Toda afirmación lleva evidencia**: `archivo:línea` del código, o el comando/SQL exacto con su salida real.
  Sin evidencia se escribe "NO VERIFICADO", nunca se deduce.
- **Salida real, no reconstruida.** Prohibido poner `...` dentro de una tabla de resultados o resumir una
  salida como si fuera la salida. Si es larga: recortar y escribir `[recortado: N filas más]`.
- **Antes de citar un archivo, confirmarlo** con `ls` / búsqueda. No inventar nombres de archivos, funciones,
  columnas, políticas ni migraciones. (Precedente: un informe citó `20260507_000000_enable_rls.sql`, que no existe.)
- **Si dos fuentes se contradicen, se reporta la contradicción** con ambas evidencias. No se elige una en silencio.
- **Números de negocio** (precios, cuántos clientes pagan, cuánto paga cada uno) los decide y confirma Jack.
  No se infieren de la base de datos ni de documentos viejos.
- Distinguir siempre **tiendas de prueba/demo** de **tiendas reales** antes de sacar conclusiones.

## 3. Reglas de seguridad

- **Nunca** escribir en archivos, informes, commits ni chats: claves, JWT, `service_role`, contraseñas,
  cadenas de conexión. Solo el nombre de la variable y `archivo:línea`.
- **Nunca** usar `service_role` ni la contraseña de `postgres` desde código que corre en el navegador.
- Datos personales de clientes (teléfono, correo, RUC, dirección) se enmascaran en cualquier informe.
- No tocar tiendas de clientes reales para probar. Las pruebas usan tiendas con slug `zz-audit-*` y se borran al final.

## 4. Reglas para cambiar la base de datos

1. **Respaldo antes de cualquier cambio** en producción (ver encargo Fase 0). Sin respaldo verificado, no se toca.
2. **Todo cambio de esquema, función o política va como archivo nuevo en `supabase/migrations/`**
   con nombre `AAAAMMDDHHMMSS_descripcion.sql`, y se aplica con el CLI (`supabase db push` o `apply_migration`)
   para que quede registrado. **Prohibido** aplicar SQL suelto en el SQL Editor o desde scripts de `scratch/`.
3. Cada migración debe ser **idempotente** (`DROP ... IF EXISTS`, `CREATE OR REPLACE`) y traer al final,
   comentado, el SQL para revertirla.
4. Funciones `SECURITY DEFINER` siempre con `SET search_path = public, pg_temp`.
5. No redefinir una función copiando una versión vieja del repo: partir de `pg_get_functiondef` de producción.

## 5. Reglas para cambiar el código

- Rama de trabajo desde `master`, un cambio lógico por commit, mensaje en español que diga el porqué.
- Correr antes de entregar: `npx vitest run`, `npm run build`. Reportar el resultado real (pasan/fallan y cuáles).
- No subir a git: `.env`, `scratch/`, `*.bak`, `playwright-report/`, `test-results/`, `dist/`.
- **Una regla de negocio vive en un solo lugar.** Si se toca un límite o precio, listar todos los lugares donde
  hoy está duplicado (ver FUENTE-DE-VERDAD §4) y decir cuáles se cambiaron.
- No cambiar precios, límites de planes, textos comerciales ni promesas de la landing sin orden explícita de Jack.

## 6. Reglas para documentar

- Al terminar un encargo: actualizar `FUENTE-DE-VERDAD.md` (solo lo que cambió y está verificado) y agregar
  una entrada fechada en `../../INFORMACIÓN NECESARIA/05-INFORMES/HISTORIAL-DE-CAMBIOS.md`.
- Si un documento queda obsoleto, no se borra: se agrega al inicio
  `> ⚠️ OBSOLETO desde AAAA-MM-DD — ver FUENTE-DE-VERDAD.md` y se lista en FUENTE-DE-VERDAD §6.
- `openspec/specs/` es el original; `INFORMACIÓN NECESARIA/03-PRODUCTO-Y-REQUISITOS/especificaciones-openspec/`
  es copia. Si se edita el original, se copia encima el archivo completo.

## 7. Formato de entrega de cada encargo

Un archivo `INFORME-<tema>-<fecha>.md` en `encargos/` con:
1. Tabla resumen: punto · estado (HECHO / NO HECHO / BLOQUEADO) · una línea.
2. Por punto: qué se hizo, comando/SQL exacto, salida real, cómo se verificó.
3. Commits y migraciones creadas (nombre exacto).
4. "Lo que encontré fuera de alcance" — sin arreglarlo.
5. "Lo que no pude verificar y por qué".

## 8. Cuándo detenerse y preguntar a Jack

- Cualquier acción irreversible (borrar datos, rotar claves que usa la web en vivo, cambiar dominio).
- Si una prueba de regresión falla después de un cambio: **revertir primero**, reportar después.
- Si el encargo pide algo que contradice este archivo.
