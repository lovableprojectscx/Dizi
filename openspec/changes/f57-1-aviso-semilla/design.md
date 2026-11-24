# F57.1 · Diseño (hipótesis hasta el Paso 0)

## Hechos verificados por Claude (23 nov, master `128ca36` y producción)
- Franja existente: `src/routes/admin.tsx:336-366` (`admin-semilla-countdown-banner`). Filtro actual: `store.plan === "semilla" && appConfig.semillaFin`. **Falla:** no incluye pagadas vencidas, no se oculta al pasar S, y `new Date('2026-12-09')` en Lima muestra "8 de diciembre".
- `useAppConfig()` en `src/lib/access-state.ts` lee `app_config` (lectura pública). Se usa en `admin.tsx:142`.
- `getEffectivePlan` en `src/lib/types.ts:517` (semilla si vencido > `GRACE_DAYS`).
- `apply_semilla_sunset()` (prod): pagadas vencidas solo si `pausa_desde IS NOT NULL AND plan_expires_at + 3d < pausa_desde`. Con el interruptor apagado el día S **no** las convierte.
- Hoy: 52 Semilla (0 demo/zz, 0 inactivas). Pagadas vencidas > 3 días: Milance.

## Datos
- **Nueva** `public.semilla_sunset_targets(p_s date) RETURNS SETOF text` — SECURITY DEFINER, `SET search_path = public, pg_temp`, STABLE. Regla: (`plan='semilla'` OR (`plan<>'semilla' AND plan_expires_at IS NOT NULL AND plan_expires_at + interval '3 days' < (p_s::timestamp AT TIME ZONE 'America/Lima')`)) AND slug NOT LIKE '%-demo' AND slug NOT LIKE 'zz-%' AND NOT (plan='ilimitado' AND plan_expires_at IS NULL). EXECUTE solo postgres y service_role.
- `apply_semilla_sunset()` usa `semilla_sunset_targets(v_semilla_fin)`; el resto igual (now()+7 días, fecha Lima).
- Sin columnas nuevas. Escritura de `semilla_fin = "2026-12-09"` solo después del merge y con OK de Jack.

## Frontend
| Archivo | Responsabilidad |
|---|---|
| `src/lib/semilla-notice.ts` (nuevo) | `shouldShowSemillaNotice(store, config, now)`, `daysUntilSemillaFin(config, now)` (hora Lima), `formatSemillaFin(config)` → "9 de diciembre". Puras. |
| `src/lib/__tests__/semilla-notice.test.ts` | Tabla de escenarios 1–11. |
| `src/components/admin/SemillaNoticeDialog.tsx` (nuevo) | Ventana una vez (localStorage `dizi_semilla_notice_<storeId>_<semillaFin>`, con try/catch). Marca: coral `--primary` en el botón principal, índigo en fecha; Sora/Inter. |
| `src/routes/admin.tsx` | La franja usa `shouldShowSemillaNotice` + fecha y días correctos; monta la ventana. |
| `tests/e2e/f57-1-aviso-semilla.spec.ts` | Escenarios 1–13 en `movil-android`, con `page.route` simulando `app_config` y la tienda; hora fijada con `page.clock`. Capturas. |
| `scripts/` o prueba Node | Escenario 14: exporta (slug, plan, plan_expires_at) de las tiendas en solo lectura, corre la función del cliente con fecha 8 dic 23:00 Lima y compara con `semilla_sunset_targets('2026-12-09')`. Sin datos personales en el informe. |

## Riesgos
- Diferencia de borde entre `daysSinceExpiry` (cliente) y `interval '3 days'` (SQL) → el escenario 14 lo detecta; si hay diferencia, se alinea el cliente a la regla SQL dentro de `semilla-notice.ts` (no tocar `getEffectivePlan`).
- No va en paralelo con nada que toque `admin.tsx` o `apply_semilla_sunset`.
