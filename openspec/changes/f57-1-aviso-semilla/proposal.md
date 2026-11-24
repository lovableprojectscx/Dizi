# F57.1 · Aviso en el panel a quienes están en plan gratis

**Estado:** 📝 Propuesta (23 nov 2026). Pedido de Jack: avisar por el mismo sistema (no por WhatsApp), algo visual, **solo** a quienes les toca, con buen filtro, SDD y Playwright que lo certifiquen.
**Fechas aprobadas por Jack (23 nov):** aviso visible desde el merge de F57.1; **día S = martes 9 dic 2026** (`semilla_fin = '2026-12-09'`).

## Por qué
F57 ya está en producción con el interruptor apagado. El 9 dic las tiendas que hoy están en plan gratis pasan a 7 días de Pro y después eligen plan o su catálogo queda en pausa. Tienen que enterarse dentro de su panel con 15 días de anticipación.

## A quién le aparece (regla única)
Le aparece el aviso a una tienda **solo si se cumplen todas**:
1. `semilla_fin` tiene fecha y hoy (hora Lima) es **antes** de esa fecha.
2. Su plan efectivo es gratis: `plan = 'semilla'`, **o** es un plan pagado que venció hace más de 3 días (Milance, Giosathi y quien venza antes del 6 dic sin renovar). Es el mismo grupo que `apply_semilla_sunset` convierte el día S.
3. **No** es demo (`*-demo`), **no** es de prueba (`zz-*`), **no** es Ilimitado sin vencimiento.

**No** le aparece a: quien paga y está vigente, quien está en prueba Pro vigente, quien está en sus 3 días de gracia (ya ve su propio aviso de gracia), demos, `zz-*`, internas, ni a nadie cuando `semilla_fin` está vacío o ya pasó.

Hoy (23 nov) eso es: 52 Semilla + Milance. Giosathi entra cuando termine su gracia (25 nov).

## Qué ven
- **Ventana una sola vez** al entrar al panel (por tienda y por dispositivo): título "Cambia el plan gratis", fecha S en grande y 3 pasos: 1) "Hasta el 8 de diciembre todo sigue igual". 2) "El 9 de diciembre te regalamos 7 días de Pro". 3) "Después eliges tu plan desde S/ X. Si no, tu catálogo queda en pausa; no se borra nada". Botones: "Ver planes" (→ `/admin/plan`) y "Entendido".
- **Franja fija** arriba del panel (la que ya existe, `admin-semilla-countdown-banner`), con la fecha correcta y "Faltan N días".

## Requisitos
| ID | Requisito |
|---|---|
| RF-57.1.1 | Una sola función pura decide si se muestra el aviso; la franja y la ventana la usan. |
| RF-57.1.2 | El grupo de la función del cliente es **el mismo** que el que convertirá la base el día S (certificado con datos reales). |
| RF-57.1.3 | `apply_semilla_sunset` deja de depender de `pausa_desde` para las pagadas vencidas: usa "venció + 3 días antes del inicio del día S en Lima". Así el día S convierte a todas, aunque el interruptor siga apagado, y no hay bucle de pruebas gratis después. |
| RF-57.1.4 | La fecha se muestra en hora Lima: `'2026-12-09'` se ve "9 de diciembre" (hoy la franja mostraría "8 de diciembre" por zona horaria). |
| RF-57.1.5 | La ventana sale una vez por tienda y dispositivo; "Entendido" la cierra; la franja sigue. |
| RF-57.1.6 | Textos simples, sin palabras técnicas; precio tomado de `PLANS.emprendedor.price`. |

| ID | No funcional |
|---|---|
| RNF-57.1.1 | Nada más cambia: el catálogo público y el panel de las tiendas que no cumplen la regla quedan idénticos. |
| RNF-57.1.2 | Celular primero (Pixel 7); la ventana entra completa sin desbordarse. |
| RNF-57.1.3 | Sin cambios de datos de tiendas; la única escritura es `semilla_fin`, con OK de Jack, después del merge. |

## Escenarios (cada uno es una prueba con su número)
1. Semilla, `semilla_fin` = 9 dic, hoy 24 nov → ventana + franja "9 de diciembre", "Faltan 15 días".
2. Pro pagado vigente → nada.
3. Pro en prueba vigente → nada.
4. Pagado vencido hace 1 día (gracia) → solo su aviso de gracia, no el de plan gratis.
5. Pagado vencido hace 5 días → ventana + franja.
6. Semilla con slug `*-demo` → nada. 7. Semilla con slug `zz-*` → nada.
8. Ilimitado sin vencimiento → nada.
9. `semilla_fin` vacío → nada para nadie.
10. Hoy = 9 dic (hora Lima) o después → nada.
11. 8 dic 23:30 Lima → todavía se ve ("Falta 1 día").
12. Cerrar con "Entendido" y recargar → no vuelve la ventana; la franja sí.
13. "Ver planes" lleva a `/admin/plan`.
14. Base: `semilla_sunset_targets('2026-12-09')` (solo lectura) devuelve exactamente las tiendas para las que la función del cliente dice "mostrar" con fecha simulada 8 dic — 0 diferencias en las 80 tiendas.
15. Base: con `semilla_fin` vacío o futuro, `apply_semilla_sunset()` no cambia nada (BEGIN…ROLLBACK).
16. Base: el día S en BEGIN…ROLLBACK convierte exactamente al grupo del escenario 14; correr de nuevo al día siguiente convierte 0 (sin bucle).

## Decisiones abiertas
Ninguna: fechas y alcance aprobados por Jack el 23 nov.
