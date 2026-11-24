# F57.2 · Diseño (hipótesis hasta el Paso 0)
- **Textos:** cambios puntuales en `index.html`, `index.tsx`, `terminos.tsx`, `ayuda.tsx`. Sin componentes nuevos.
- **Mi Plan:** importar `getStoreAccessState` y `useAppConfig` de `src/lib/access-state.ts` (como `admin.tsx:142-145`). Tres textos: gracia / pausa / vencido con interruptor apagado.
- **Super:** helper `isSemillaAssignable(config, now)` en `src/lib/semilla-notice.ts` (mismo módulo de F57.1: fecha Lima). Lo usan `SubscriptionManager` e `InviteGenerator`.
- **Base (una migración):** `cancel_subscription` sin pasar a Semilla (`plan_expires_at = now() - interval '3 days'`, `subscription_status` sin cambio salvo el que ya ponga); `initialize_store` rama super: `COALESCE(p_plan, 'pro')` y si queda `pro` sin invitación → trial +7 días. `pg_get_functiondef` actual respaldado antes.
- **Dependencia:** va **después** de F57.1 (comparte `semilla-notice.ts` y toca `admin.*`). No en paralelo.
