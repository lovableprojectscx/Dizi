# F55 · Diseño técnico (hipótesis hasta el Paso 0)

## Datos
- **Trigger `protect_store_billing_columns`** (verificado el 20 nov): hoy, en el INSERT de un usuario normal, fuerza `plan='semilla'`, `plan_expires_at=NULL` y `subscription_status='trial'`; en el UPDATE rechaza cambios de plan, vencimiento y estado. F55 solo cambia la rama del INSERT a Pro + 14 días. Hay que verificar en el Paso 0 cómo se aplican después las invitaciones (RPC o update de super) para que no se pisen.
- **Trigger `reset_branding_on_upgrade`:** cuando la tienda pasa de semilla a otro plan, pone `show_dizi_branding = NULL`. En el INSERT Pro hay que decidir qué valor toma `show_dizi_branding` para que el sello aparezca solo cuando el plan efectivo sea Semilla (Paso 0: dónde se decide hoy el sello en el catálogo público y si sale del plan efectivo).
- **Nueva tabla `store_rewards`:** `id uuid pk`, `store_id uuid fk on delete cascade`, `milestone text check in ('productos_3','compartir','marca')`, `days int check (days between 1 and 7)`, `granted_at timestamptz default now()`, `unique(store_id, milestone)`. RLS: select para la dueña y el super admin; sin insert/update/delete para `anon` ni `authenticated`.
- **Nueva RPC `claim_trial_rewards(p_store_id uuid)`:** `SECURITY DEFINER`, `SET search_path = public, pg_temp`, `GRANT EXECUTE` solo a `authenticated`. Para modificar `plan_expires_at` corre como el dueño de la función (pasa la protección por `current_user`; el Paso 0 lo confirma).
- **Productos que cuentan:** visibles, con `image` no vacía y `is_sample = false`. Paso 0: confirmar los nombres reales de las columnas.

## Imagen de catálogo
- **Nuevo estilo `catalogo`** en `styles.ts` (o en un archivo `catalog-image.ts` dentro de `share-image/`), con `prepareCatalogImageData(store)` en `data.ts`. Reutiliza `loadShareImageAssets` para las 4 fotos, el logo y el QR del link del catálogo.
- **Migración:** ampliar el CHECK de `share_events.source` a `('productos','marketing','catalogo')`. Si `product_id` es NOT NULL, permitir NULL solo cuando `source='catalogo'`.
- **Orden:** va **después** del merge de `fix-sello-imagenes` (toca `share-image/`).

## Frontend
| Archivo | Cambio |
|---|---|
| `src/lib/types.ts` | `getEffectivePlan`: si la tienda está en prueba y venció, devuelve semilla sin gracia. |
| `src/lib/trial-rewards.ts` (nuevo) | Definición de los logros (id, texto, días) para la UI y `claimTrialRewards(storeId)`. |
| `src/lib/store.ts` | Llamar a `claimTrialRewards` en los puntos de RF-55.7 y refrescar la tienda. |
| `src/components/admin/CompletaTuTienda.tsx` | Premio en cada tarea y estado ganado. |
| `src/components/admin/NextStepCard.tsx` / `panel-home.ts` (F54) | Etiqueta "Prueba Pro · quedan N días". |
| `src/lib/survey.ts` | Regla de elegibilidad por antigüedad y productos, activa desde la siguiente versión. |
| Landing + `CelebrationSlide.tsx` | Textos de RF-55.10. |

## Consulta de indicadores (solo lectura)
```sql
-- Cohorte: tiendas creadas desde el despliegue (cambiar la fecha)
with c as (select id, created_at from stores where created_at >= '2026-11-XX' and slug not like '%-demo' and slug not like 'zz-%')
select count(*) tiendas,
  count(*) filter (where (select count(*) from products p where p.store_id=c.id and p.visible and coalesce(p.image,'')<>'' and not coalesce(p.is_sample,false) and p.created_at <= c.created_at + interval '7 days') >= 3) con_3_a_7d,
  count(*) filter (where exists (select 1 from share_events e where e.store_id=c.id and e.created_at <= c.created_at + interval '7 days')) compartio_7d
from c;
```

## Dependencias y orden
- Va **después** del merge de **F54** (usa `NextStepCard`/`panel-home`) y de **textos-planes** (toca `PLANS.features` y la landing).
- La migración se aplica **antes** del merge (igual que F49 y F53). Hasta que haya merge, el trigger ya da Pro y el panel viejo lo muestra como "Catálogo Pro (Prueba)". Paso 0: confirmar que eso no rompe nada en el panel actual.
